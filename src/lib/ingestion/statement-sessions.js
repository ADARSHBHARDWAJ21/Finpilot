import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile, utimes } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

const SESSION_TTL_MS = 30 * 60_000;
const sessionFailure = (message, status, code) => Object.assign(new Error(message), { status, code });

// The uploaded file is private temporary storage. Passwords and ownership stay
// in memory; restarting a server never restores an unauthenticated session.
export function createStatementSessionStore({ directory = path.join(tmpdir(), "finpilot-statement-imports"), now = Date.now, ttlMs = SESSION_TTL_MS, maxSessions = 8, maxOwnerSessions = 2 } = {}) {
  const sessions = new Map();
  let creating = 0;
  const ownerReservations = new Map();
  const removeFile = async (filePath) => {
    try { await unlink(filePath); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  };
  async function discard(session) {
    // Retain an expired entry if removal fails, so the next cleanup retries it.
    session.expiresAt = 0;
    await removeFile(session.filePath);
    sessions.delete(session.id);
    session.password = "";
  }
  function owned(id, userId) {
    const session = sessions.get(id);
    if (!session || session.userId !== userId) throw sessionFailure("This upload session is no longer available. Upload the statement again.", 404, "STATEMENT_SESSION_MISSING");
    return session;
  }
  return {
    async create({ userId, buffer, password = "", pendingPages, pageResults = [], openingBalance = null }) {
      const ownerCount = [...sessions.values()].filter((session) => session.userId === userId).length + (ownerReservations.get(userId) || 0);
      if (sessions.size + creating >= maxSessions || ownerCount >= maxOwnerSessions) throw sessionFailure("There are too many unfinished statement uploads. Finish an existing upload or try again shortly.", 429, "STATEMENT_SESSION_LIMIT");
      // Reserve before the first await so concurrent initial imports cannot
      // exceed the temporary disk budget (8 files, at most 2 per user).
      creating++;
      ownerReservations.set(userId, (ownerReservations.get(userId) || 0) + 1);
      try {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const id = randomUUID();
        const filePath = path.join(directory, `${id}.pdf`);
        await writeFile(filePath, buffer, { mode: 0o600, flag: "wx" });
        const session = { id, userId, filePath, password, pendingPages: [...pendingPages], pageLayouts: Object.fromEntries(pageResults.map((page) => [page.num, page.layout || null])), ocrLayout: null, openingBalance, expiresAt: now() + ttlMs, lastUsed: now(), busy: false };
        sessions.set(id, session);
        return session;
      } finally {
        creating--;
        const reserved = ownerReservations.get(userId) - 1;
        if (reserved) ownerReservations.set(userId, reserved);
        else ownerReservations.delete(userId);
      }
    },
    async acquire(id, userId, page) {
      const session = owned(id, userId);
      if (session.busy) throw sessionFailure("This statement page is already being read. Please wait before retrying.", 409, "STATEMENT_SESSION_BUSY");
      if (session.expiresAt <= now()) {
        await discard(session);
        throw sessionFailure("This upload session expired. Upload the statement again to continue.", 410, "STATEMENT_SESSION_EXPIRED");
      }
      if (!Number.isInteger(page) || session.pendingPages[0] !== page) throw sessionFailure("This page cannot be read yet. Upload the statement again to restart.", 409, "STATEMENT_PAGE_ORDER");
      // Claim synchronously before any file read, so concurrent requests cannot
      // both process or advance the same page.
      session.busy = true;
      session.lastUsed = now();
      session.expiresAt = session.lastUsed + ttlMs;
      return session;
    },
    async read(session) {
      // A deployment overlap must not mistake an active long import for an
      // abandoned file. Runtime temp files stay outside the source checkout.
      const usedAt = new Date(now());
      await utimes(session.filePath, usedAt, usedAt);
      return readFile(session.filePath);
    },
    async release(session) {
      session.busy = false;
      if (session.deleteRequested) await discard(session);
    },
    async complete(session, result) {
      session.pendingPages.shift();
      session.ocrLayout = result.ocrLayout || session.ocrLayout;
      session.openingBalance ??= result.openingBalance ?? null;
      session.lastUsed = now();
      session.expiresAt = session.lastUsed + ttlMs;
      const remainingPages = [...session.pendingPages];
      if (!remainingPages.length) {
        // A failed cleanup must not turn a fully read statement into a failed
        // import. An expired entry lets a later cleanup retry the deletion.
        await discard(session).catch(() => {});
      }
      return remainingPages;
    },
    async delete(id, userId) {
      const session = owned(id, userId);
      if (session.busy) { session.deleteRequested = true; return; }
      await discard(session);
    },
    async cleanup() {
      const time = now();
      for (const session of sessions.values()) {
        if (!session.busy && session.expiresAt <= time) await discard(session);
      }
      let files;
      try { files = await readdir(directory, { withFileTypes: true }); }
      catch (error) { if (error.code === "ENOENT") return; throw error; }
      const activePaths = new Set([...sessions.values()].map((session) => session.filePath));
      for (const file of files) {
        if (!file.isFile() || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i.test(file.name)) continue;
        const filePath = path.join(directory, file.name);
        if (activePaths.has(filePath)) continue;
        try { if ((await stat(filePath)).mtimeMs + ttlMs <= time) await removeFile(filePath); }
        catch (error) { if (error.code !== "ENOENT") throw error; }
      }
    },
  };
}
