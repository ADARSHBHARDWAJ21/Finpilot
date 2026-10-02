import { createClient } from "@/lib/supabase/server-client";
import { processStatement } from "@/lib/ingestion/process-statement";
import { MAX_FILE_BYTES, validateFile } from "@/lib/import/transaction-values";

export const runtime = "nodejs";
export const maxDuration = 180;
const attempts = new Map();
let running = 0;
const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

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
        throw new Error("File is too large. Choose a file under 10 MB.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Request(req.url, { method: "POST", headers: { "content-type": req.headers.get("content-type") }, body: Buffer.concat(chunks) }).formData();
}

export async function POST(req) {
  let started = false;
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) return reply({ success: false, error: "Please upload from the Finpilot app." }, 403);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return reply({ success: false, error: "Please sign in again before importing." }, 401);
    const length = Number(req.headers.get("content-length") || 0);
    if (length > MAX_FILE_BYTES + 4096) return reply({ success: false, error: "File is too large. Choose a file under 10 MB." }, 413);
    const now = Date.now();
    for (const [id, entry] of attempts) if (entry.reset <= now) attempts.delete(id);
    const entry = attempts.get(user.id) || { count: 0, reset: now + 60_000 };
    if (entry.count >= 5) return reply({ success: false, error: "Please wait a minute before processing another statement." }, 429);
    if (running >= 2) return reply({ success: false, error: "Other statements are being processed. Please try again shortly." }, 429);
    entry.count++;
    attempts.set(user.id, entry);
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
    running++;
    started = true;
    const result = await processStatement(buffer, isPdf ? "pdf" : "image", file.type, { password });
    if (!result.ok) return reply({ success: false, error: result.error }, 422);
    return reply({ success: true, transactions: result.transactions, extractionMethod: result.extractionMethod, warnings: result.warnings, count: result.count });
  } catch (error) {
    const safe = /^(?:Choose |File is too large|This PDF |This statement |This workbook |Processing took too long|No readable |Could not read a PDF|This PDF needs)/.test(error.message || "");
    return reply({ success: false, error: safe ? error.message : "Could not read this file. Try a clearer image or a new CSV/Excel/PDF export from your bank.", ...(error.code === "PDF_PASSWORD_REQUIRED" ? { code: error.code } : {}) }, 422);
  } finally {
    if (started) running--;
  }
}
