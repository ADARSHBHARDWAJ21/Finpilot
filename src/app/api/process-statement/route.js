import { createClient } from "@/lib/supabase/server-client";
import { processStatement } from "@/lib/ingestion/process-statement";
import { MAX_FILE_BYTES, MAX_FILE_MB, validateFile } from "@/lib/import/transaction-values";
import { isAllowedUploadOrigin } from "@/lib/security/request-origin";
import { statementErrorResponse } from "@/lib/ingestion/statement-errors";
import { createStatementSessionStore } from "@/lib/ingestion/statement-sessions";

export const runtime = "nodejs";
export const maxDuration = 180;
const attempts = new Map();
const sessions = createStatementSessionStore();
let cleaning;
const cleanupSessions = () => {
  if (!cleaning) cleaning = sessions.cleanup().catch(() => {}).finally(() => { cleaning = null; });
  return cleaning;
};
// Expired uploads must be removed even when no new statements arrive. This
// timer never keeps an otherwise idle server process alive.
const cleanupTimer = setInterval(cleanupSessions, 60_000);
cleanupTimer.unref?.();
let running = 0;
const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const failureReply = (error) => {
  if ((typeof error?.code === "string" && error.code.startsWith("STATEMENT_SESSION_")) || error?.code === "STATEMENT_PAGE_ORDER") return reply({ success: false, error: error.message, code: error.code }, error.status);
  const { body, status } = statementErrorResponse(error);
  return reply(body, status);
};
const tooLarge = () => `File is too large. Choose a file up to ${MAX_FILE_MB} MB.`;

async function readUploadForm(req) {
  if (!req.body || !req.headers.get("content-type")?.startsWith("multipart/form-data")) throw new Error("Choose a bank statement file.");
  const reader = req.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_FILE_BYTES + 4096) {
        await reader.cancel();
        throw new Error(tooLarge());
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Request(req.url, { method: "POST", headers: { "content-type": req.headers.get("content-type") }, body: Buffer.concat(chunks) }).formData();
}

export async function POST(req) {
  let started = false;
  let session;
  try {
    if (!isAllowedUploadOrigin(req)) return reply({ success: false, error: "Please upload from the Finpilot app." }, 403);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return reply({ success: false, error: "Please sign in again before importing." }, 401);
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session");
    // OCR and PDF rendering use native memory. One active request keeps large
    // imports within the free preview's memory budget; pages run sequentially.
    if (running >= 1) return reply({ success: false, error: "Another statement is being processed. Please try again shortly." }, 429);
    if (sessionId) {
      // Continuations have their own busy guard and do not consume new-upload
      // rate limits. Each request handles a single page within its deadline.
      running++;
      started = true;
      const page = Number(url.searchParams.get("page"));
      session = await sessions.acquire(sessionId, user.id, page);
      const buffer = await sessions.read(session);
      const result = await processStatement(buffer, "pdf", "application/pdf", { password: session.password, pageNumbers: [page], forceOcr: true, initialLayout: session.ocrLayout || session.pageLayouts[page], includeBalances: true, allowEmpty: true });
      if (!result.ok) return reply({ success: false, error: result.error }, 422);
      const remainingPages = await sessions.complete(session, result);
      return reply({ success: true, processedPage: page, remainingPages, transactions: result.transactions, pageResults: result.pageResults, openingBalance: result.openingBalance, totalPages: result.totalPages, extractionMethod: result.extractionMethod, warnings: result.warnings, count: result.count });
    }
    const length = Number(req.headers.get("content-length") || 0);
    if (length > MAX_FILE_BYTES + 4096) return reply({ success: false, error: tooLarge() }, 413);
    const now = Date.now();
    for (const [id, entry] of attempts) if (entry.reset <= now) attempts.delete(id);
    const entry = attempts.get(user.id) || { count: 0, reset: now + 60_000 };
    if (entry.count >= 5) return reply({ success: false, error: "Please wait a minute before processing another statement." }, 429);
    entry.count++;
    attempts.set(user.id, entry);
    running++;
    started = true;
    await cleanupSessions();
    const form = await readUploadForm(req);
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") return reply({ success: false, error: "Choose a bank statement file." }, 400);
    validateFile(file);
    const password = form.get("password") || "";
    if (typeof password !== "string" || password.length > 256) return reply({ success: false, error: "The PDF password is too long." }, 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    const isPdf = buffer.subarray(0, 1024).toString("latin1").includes("%PDF-");
    const isImage = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) || (buffer.toString("ascii",0,4) === "RIFF" && buffer.toString("ascii",8,12) === "WEBP");
    if (!isPdf && !isImage) return reply({ success: false, error: "Choose a valid PDF, PNG, JPG or WebP file. Use the CSV / Excel option for spreadsheets." }, 415);
    const result = await processStatement(buffer, isPdf ? "pdf" : "image", file.type, { password, ...(isPdf ? { deferOcr: true } : {}) });
    if (!result.ok) return reply({ success: false, error: result.error }, 422);
    let newSession;
    if (isPdf && result.pendingPages?.length) newSession = await sessions.create({ userId: user.id, buffer, password, pendingPages: result.pendingPages, pageResults: result.pageResults, openingBalance: result.openingBalance });
    return reply({ success: true, transactions: result.transactions, extractionMethod: result.extractionMethod, warnings: result.warnings, count: result.count, ...(newSession ? { sessionId: newSession.id, pendingPages: result.pendingPages, pageResults: result.pageResults, totalPages: result.totalPages, openingBalance: result.openingBalance } : {}) });
  } catch (error) {
    return failureReply(error);
  } finally {
    if (session) await sessions.release(session).catch(() => {});
    if (started) running--;
  }
}

export async function DELETE(req) {
  try {
    if (!isAllowedUploadOrigin(req)) return reply({ success: false, error: "Please upload from the Finpilot app." }, 403);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return reply({ success: false, error: "Please sign in again before importing." }, 401);
    const sessionId = new URL(req.url).searchParams.get("session");
    if (!sessionId) return reply({ success: false, error: "Choose an upload session." }, 400);
    await sessions.delete(sessionId, user.id);
    return reply({ success: true });
  } catch (error) { return failureReply(error); }
}
