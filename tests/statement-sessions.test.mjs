import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createStatementSessionStore } from "../src/lib/ingestion/statement-sessions.js";
import { MAX_FILE_BYTES, MAX_FILE_MB, validateFile } from "../src/lib/import/transaction-values.js";
import { createStatementTimeout, statementErrorResponse } from "../src/lib/ingestion/statement-errors.js";

async function temporaryStore(t, options = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "finpilot-statement-session-"));
  t.after(async () => {
    for (const file of await fs.readdir(directory)) await fs.unlink(path.join(directory, file));
    await fs.rmdir(directory);
  });
  return { store: createStatementSessionStore({ directory, ...options }), directory };
}
const sessionInput = { userId: "owner", buffer: Buffer.from("%PDF-test"), password: "in-memory-password", pendingPages: [1, 3], pageResults: [{ num: 1, layout: { date: 10 } }] };

test("statement sessions keep passwords in memory and restrict ownership", async (t) => {
  const { store, directory } = await temporaryStore(t);
  const session = await store.create(sessionInput);
  assert.deepEqual(await fs.readdir(directory), [`${session.id}.pdf`]);
  assert.deepEqual(await store.read(session), sessionInput.buffer);
  await assert.rejects(store.acquire(session.id, "someone-else", 1), { status: 404 });
  await assert.rejects(store.delete(session.id, "someone-else"), { status: 404 });
  await store.delete(session.id, "owner");
  assert.equal(session.password, "");
  assert.deepEqual(await fs.readdir(directory), []);
});

test("statement sessions enforce page order and admit one reader per session", async (t) => {
  const { store } = await temporaryStore(t);
  const session = await store.create(sessionInput);
  await assert.rejects(store.acquire(session.id, "owner", 3), { code: "STATEMENT_PAGE_ORDER" });
  await store.acquire(session.id, "owner", 1);
  await assert.rejects(store.acquire(session.id, "owner", 1), { code: "STATEMENT_SESSION_BUSY" });
  // Failure releases the reader without advancing the page; it can be retried.
  await store.release(session);
  await store.acquire(session.id, "owner", 1);
  assert.deepEqual(await store.complete(session, { ocrLayout: { date: 12 } }), [3]);
  await store.release(session);
  assert.deepEqual(session.ocrLayout, { date: 12 });
  await assert.rejects(store.acquire(session.id, "owner", 1), { code: "STATEMENT_PAGE_ORDER" });
});

test("statement sessions expire, refresh with use, and remove completed files", async (t) => {
  let time = 1_000;
  const { store, directory } = await temporaryStore(t, { now: () => time, ttlMs: 100 });
  const session = await store.create({ ...sessionInput, pendingPages: [1] });
  time = 1_099;
  await store.acquire(session.id, "owner", 1);
  time = 1_150;
  await store.cleanup();
  assert.equal((await fs.readdir(directory)).length, 1);
  await store.release(session);
  await store.acquire(session.id, "owner", 1);
  assert.deepEqual(await store.complete(session, {}), []);
  await store.release(session);
  assert.deepEqual(await fs.readdir(directory), []);
  await assert.rejects(store.acquire(session.id, "owner", 1), { status: 404 });
  const expired = await store.create(sessionInput);
  time += 101;
  await assert.rejects(store.acquire(expired.id, "owner", 1), { status: 410 });
  assert.deepEqual(await fs.readdir(directory), []);
});

test("canceling a running page removes its file when the reader releases it", async (t) => {
  const { store, directory } = await temporaryStore(t);
  const session = await store.create(sessionInput);
  await store.acquire(session.id, "owner", 1);
  await store.delete(session.id, "owner");
  assert.equal((await fs.readdir(directory)).length, 1);
  await store.release(session);
  assert.deepEqual(await fs.readdir(directory), []);
});

test("cleanup removes only expired session files and stale generated PDF orphans", async (t) => {
  const time = Date.now();
  const { store, directory } = await temporaryStore(t, { now: () => time, ttlMs: 100 });
  const session = await store.create(sessionInput);
  const orphan = path.join(directory, "00000000-0000-0000-0000-000000000000.pdf");
  const other = path.join(directory, "user-kept.pdf");
  await fs.writeFile(orphan, "%PDF-orphan");
  await fs.writeFile(other, "unrelated file");
  const old = new Date(time - 200);
  await fs.utimes(orphan, old, old);
  await fs.utimes(other, old, old);
  await store.cleanup();
  assert.deepEqual((await fs.readdir(directory)).sort(), [`${session.id}.pdf`, "user-kept.pdf"].sort());
});

test("temporary storage reserves per-user and global capacity before asynchronous writes", async (t) => {
  const { store, directory } = await temporaryStore(t);
  const ownerResults = await Promise.allSettled([store.create(sessionInput), store.create(sessionInput), store.create(sessionInput)]);
  assert.equal(ownerResults.filter((entry) => entry.status === "fulfilled").length, 2);
  assert.equal(ownerResults.find((entry) => entry.status === "rejected").reason.code, "STATEMENT_SESSION_LIMIT");
  const globalResults = await Promise.allSettled(Array.from({ length: 7 }, (_, index) => store.create({ ...sessionInput, userId: `other-${index}` })));
  assert.equal(globalResults.filter((entry) => entry.status === "fulfilled").length, 6);
  assert.equal(globalResults.find((entry) => entry.status === "rejected").reason.status, 429);
  assert.equal((await fs.readdir(directory)).length, 8);
  const existing = ownerResults.find((entry) => entry.status === "fulfilled").value;
  await store.delete(existing.id, "owner");
  const next = await store.create(sessionInput);
  assert.equal(next.userId, "owner");
  assert.equal((await fs.readdir(directory)).length, 8);
});

async function routeWithStore(store, processStatement, currentUser = () => "owner") {
  const source = await fs.readFile(new URL("../src/app/api/process-statement/route.js", import.meta.url), "utf8");
  const createRoute = new Function("createClient", "processStatement", "MAX_FILE_BYTES", "MAX_FILE_MB", "validateFile", "isAllowedUploadOrigin", "statementErrorResponse", "createStatementSessionStore", source.replace(/^import .*;\r?$/gm, "").replace(/^export /gm, "") + "\nreturn { POST, DELETE };");
  return createRoute(async () => ({ auth: { getUser: async () => ({ data: { user: { id: currentUser() } } }) } }), processStatement, MAX_FILE_BYTES, MAX_FILE_MB, validateFile, () => true, statementErrorResponse, () => store);
}
const continuation = (id, page) => new Request(`http://localhost/api/process-statement?session=${id}&page=${page}`, { method: "POST" });

test("continuation route retains failed pages for retries and deletes files on final success", async (t) => {
  const { store, directory } = await temporaryStore(t);
  const session = await store.create({ ...sessionInput, pendingPages: [1] });
  let first = true;
  const route = await routeWithStore(store, async (buffer, kind, mime, options) => {
    assert.equal(kind, "pdf");
    assert.equal(options.forceOcr, true);
    assert.deepEqual(options.pageNumbers, [1]);
    assert.deepEqual(options.initialLayout, sessionInput.pageResults[0].layout);
    assert.equal(options.password, sessionInput.password);
    if (first) { first = false; throw createStatementTimeout(); }
    return { ok: true, transactions: [], pageResults: [{ num: 1, transactions: [], expectedRows: 0 }], totalPages: 1 };
  });
  const failed = await route.POST(continuation(session.id, 1));
  assert.equal(failed.status, 504);
  assert.deepEqual(session.pendingPages, [1]);
  const succeeded = await route.POST(continuation(session.id, 1));
  assert.equal(succeeded.status, 200);
  assert.deepEqual((await succeeded.json()).remainingPages, []);
  assert.deepEqual(await fs.readdir(directory), []);
});

test("continuation route authenticates ownership and DELETE cleans up only the owner upload", async (t) => {
  const { store, directory } = await temporaryStore(t);
  const session = await store.create(sessionInput);
  let user = "other";
  let processed = false;
  const route = await routeWithStore(store, async () => { processed = true; }, () => user);
  assert.equal((await route.POST(continuation(session.id, 1))).status, 404);
  assert.equal(processed, false);
  const request = () => new Request(`http://localhost/api/process-statement?session=${session.id}`, { method: "DELETE" });
  assert.equal((await route.DELETE(request())).status, 404);
  user = "owner";
  assert.equal((await route.DELETE(request())).status, 200);
  assert.deepEqual(await fs.readdir(directory), []);
});

test("single-page continuations remain allowed after the new-import rate limit", async (t) => {
  const { store } = await temporaryStore(t);
  let initialCount = 0;
  const route = await routeWithStore(store, async (buffer, kind, mime, options) => {
    if (options.forceOcr) return { ok: true, transactions: [], pageResults: [{ num: 1, transactions: [] }], totalPages: 1 };
    initialCount++;
    assert.equal(options.deferOcr, true);
    return { ok: true, transactions: [], pageResults: [{ num: 1, transactions: [] }], pendingPages: [1], totalPages: 1 };
  });
  const upload = () => {
    const form = new FormData();
    form.append("file", new File(["%PDF-synthetic"], "statement.pdf", { type: "application/pdf" }));
    return new Request("http://localhost/api/process-statement", { method: "POST", body: form });
  };
  let last;
  for (let index = 0; index < 5; index++) {
    const response = await route.POST(upload());
    assert.equal(response.status, 200);
    last = await response.json();
    if (index < 4) await store.delete(last.sessionId, "owner");
  }
  assert.equal((await route.POST(upload())).status, 429);
  assert.equal(initialCount, 5);
  assert.equal((await route.POST(continuation(last.sessionId, 1))).status, 200);
});
