import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createStatementTimeout, STATEMENT_TIMEOUT_MESSAGE, OCR_UNAVAILABLE_MESSAGE, statementErrorResponse } from "../src/lib/ingestion/statement-errors.js";
import { MAX_FILE_BYTES, MAX_FILE_MB, validateFile } from "../src/lib/import/transaction-values.js";

test("statement deadlines return a typed service timeout instead of invalid-file status", () => {
  const error = createStatementTimeout();
  assert.equal(error.code, "STATEMENT_TIMEOUT");
  assert.equal(error.status, 504);
  assert.deepEqual(statementErrorResponse(error), { status: 504, body: { success: false, error: STATEMENT_TIMEOUT_MESSAGE, code: "STATEMENT_TIMEOUT" } });
  assert.match(error.message, /CSV\/Excel/);
});

test("legacy statement deadlines retain the timeout status during migration", () => {
  const error = new Error("Processing took too long. Split the statement into smaller files and try again.");
  assert.equal(statementErrorResponse(error).status, 504);
  assert.equal(statementErrorResponse(error).body.error, STATEMENT_TIMEOUT_MESSAGE);
});

test("known statement validation errors preserve their actionable messages", () => {
  for (const message of ["Choose a bank statement file.", "This PDF is damaged or unreadable. Download a fresh statement from your bank.", "This statement has more than 1,000 rows. Split it into smaller files.", "No readable transaction rows were found."]) {
    assert.deepEqual(statementErrorResponse(new Error(message)), { status: 422, body: { success: false, error: message } });
  }
});

test("file size failures use payload-too-large status rather than invalid-PDF status", () => {
  let error;
  try { validateFile({ size: MAX_FILE_BYTES + 1 }); } catch (failure) { error = failure; }
  assert.equal(error.code, "FILE_TOO_LARGE");
  assert.equal(statementErrorResponse(error).status, 413);
  assert.equal(statementErrorResponse(error).body.code, "FILE_TOO_LARGE");
  assert.match(statementErrorResponse(error).body.error, /50 MB/);
});

test("password prompts keep their retry code and hide unexpected provider details", () => {
  const message = "This PDF needs its password. Enter the bank statement password and try again.";
  const error = Object.assign(new Error(message), { code: "PDF_PASSWORD_REQUIRED" });
  assert.deepEqual(statementErrorResponse(error), { status: 422, body: { success: false, error: message, code: "PDF_PASSWORD_REQUIRED" } });
  error.message = "Internal parser path /private/server/config";
  assert.equal(statementErrorResponse(error).body.error, message);
});

test("unexpected service errors are 500 responses without internal details", () => {
  for (const error of [new Error("private connection or parser details"), "worker failure", null]) {
    const result = statementErrorResponse(error);
    assert.equal(result.status, 500);
    assert.equal(result.body.success, false);
    assert.equal(result.body.code, undefined);
    assert.equal(result.body.error, "Could not read this file. Try a clearer image or a new CSV/Excel/PDF export from your bank.");
  }
});

test("OCR startup failures have a retryable service status and hide internal details", () => {
  const error = Object.assign(new Error("private worker initialization details"), { code: "OCR_UNAVAILABLE" });
  assert.deepEqual(statementErrorResponse(error), { status: 503, body: { success: false, error: OCR_UNAVAILABLE_MESSAGE, code: "OCR_UNAVAILABLE" } });
});

// Exercise the actual route without database or PDF workers. Injecting only its
// imports keeps its upload reader, admission counter and response handling real.
async function statementRoute(processStatement) {
  const source = await fs.readFile(new URL("../src/app/api/process-statement/route.js", import.meta.url), "utf8");
  const createRoute = new Function("createClient", "processStatement", "MAX_FILE_BYTES", "MAX_FILE_MB", "validateFile", "isAllowedUploadOrigin", "statementErrorResponse", "createStatementSessionStore", source.replace(/^import .*;\r?$/gm, "").replace(/^export /gm, "") + "\nreturn { POST };");
  return createRoute(async () => ({ auth: { getUser: async () => ({ data: { user: { id: "test-owner" } } }) } }), processStatement, MAX_FILE_BYTES, MAX_FILE_MB, validateFile, () => true, statementErrorResponse, () => ({ cleanup: async () => {} }));
}

async function uploadRequest({ waitUntilReleased = null, onRead = () => {} } = {}) {
  const form = new FormData();
  form.append("file", new File(["%PDF-1.4 synthetic"], "statement.pdf", { type: "application/pdf" }));
  const original = new Request("http://localhost/api/process-statement", { method: "POST", body: form });
  const bytes = new Uint8Array(await original.arrayBuffer());
  let read = false;
  return { url: original.url, headers: original.headers, body: { getReader() { return {
    async read() {
      if (read) return { done: true };
      read = true;
      onRead();
      if (waitUntilReleased) await waitUntilReleased;
      return { done: false, value: bytes };
    },
    async cancel() {},
    releaseLock() {},
  }; } } };
}

test("upload route distinguishes processing timeouts from invalid statements", async () => {
  const route = await statementRoute(async () => { throw createStatementTimeout(); });
  const response = await route.POST(await uploadRequest());
  assert.equal(response.status, 504);
  assert.equal((await response.json()).code, "STATEMENT_TIMEOUT");
});

test("upload route reserves capacity before awaiting upload bodies and releases failed slots", async () => {
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  let readCount = 0;
  let firstReading;
  const admitted = new Promise((resolve) => { firstReading = resolve; });
  const route = await statementRoute(async () => { throw createStatementTimeout(); });
  const first = route.POST(await uploadRequest({ waitUntilReleased: blocked, onRead: () => { readCount++; firstReading(); } }));
  try {
    await admitted;
    const second = await route.POST(await uploadRequest({ onRead: () => { readCount++; } }));
    assert.equal(second.status, 429);
    assert.match((await second.json()).error, /Another statement/);
    assert.equal(readCount, 1);
  } finally { release(); }
  assert.equal((await first).status, 504);
  const retry = await route.POST(await uploadRequest());
  assert.equal(retry.status, 504);
});
