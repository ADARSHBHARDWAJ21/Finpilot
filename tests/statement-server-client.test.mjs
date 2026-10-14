import test from "node:test";
import assert from "node:assert/strict";
import { readServerStatement } from "../src/components/transactions/read-server-statement.js";

const file = () => new File(["%PDF-synthetic"], "statement.pdf", { type: "application/pdf" });
const row = (description, balance, date = "2026-01-01") => ({ transaction_date: date, description, amount: 10, type: "", category: "Other", payment_method: "Bank", _balance: balance });
const response = (body, status = 200) => Response.json(body, { status });

test("native PDFs complete in one request without creating a continuation", async () => {
  const transactions = [{ ...row("Native statement", 100), type: "expense" }];
  let calls = 0;
  const result = await readServerStatement(file(), { fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, "/api/process-statement");
    assert.equal(options.method, "POST");
    assert.ok(options.body instanceof FormData);
    return response({ success: true, transactions, count: 1, warnings: [] });
  } });
  assert.equal(calls, 1);
  assert.deepEqual(result.transactions, transactions);
});

test("OCR replaces page rows and completes balance directions across page boundaries", async () => {
  const progress = [];
  let calls = 0;
  const first = row("First expense", 90, "2026-01-01");
  const second = row("Second income", 100, "2026-01-02");
  const result = await readServerStatement(file(), { password: "bank-password", onProgress: (value) => progress.push(value), fetchImpl: async (url, options) => {
    calls++;
    if (calls === 1) {
      assert.equal(options.body.get("password"), "bank-password");
      return response({ success: true, sessionId: "test-id", pendingPages: [2], totalPages: 3, openingBalance: 100, transactions: [first, row("Wrong partial candidate", 500)], pageResults: [{ num: 1, transactions: [first], expectedRows: 1 }, { num: 2, transactions: [row("Wrong partial candidate", 500)], expectedRows: 1 }, { num: 3, transactions: [], informational: true }], warnings: ["PDF page 2: at least 2 dated rows were detected, but only 1 were read.", "A retained warning"] });
    }
    assert.equal(url, "/api/process-statement?session=test-id&page=2");
    assert.equal(options.body, undefined);
    return response({ success: true, processedPage: 2, remainingPages: [], transactions: [second], pageResults: [{ num: 2, transactions: [second], expectedRows: 1 }], warnings: ["1 PDF page(s) used text recognition. Please check every extracted row."] });
  } });
  assert.equal(calls, 2);
  assert.equal(result.count, 2);
  assert.deepEqual(result.transactions.map((entry) => [entry.description, entry.type]), [["First expense", "expense"], ["Second income", "income"]]);
  assert.ok(result.transactions.every((entry) => !("_balance" in entry)));
  assert.deepEqual(progress, ["Reading your statement…", "Reading page 2 of 3…"]);
  assert.deepEqual(result.warnings, ["A retained warning", "1 PDF page(s) used text recognition. Please check every extracted row."]);
});

test("failure on a later OCR page rejects partial rows and cancels its session", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push([url, options.method]);
    if (options.method === "DELETE") return response({ success: true });
    if (requests.length === 1) return response({ success: true, sessionId: "private-session", pendingPages: [1, 2], totalPages: 2, pageResults: [{ num: 1, transactions: [] }, { num: 2, transactions: [] }] });
    if (requests.length === 2) return response({ success: true, processedPage: 1, remainingPages: [2], pageResults: [{ num: 1, transactions: [row("Partial result", 90)], expectedRows: 1 }] });
    return response({ success: false, error: "Page reading timed out", code: "STATEMENT_TIMEOUT" }, 504);
  };
  await assert.rejects(readServerStatement(file(), { fetchImpl }), { message: "Page reading timed out", code: "STATEMENT_TIMEOUT" });
  assert.deepEqual(requests, [["/api/process-statement", "POST"], ["/api/process-statement?session=private-session&page=1", "POST"], ["/api/process-statement?session=private-session&page=2", "POST"], ["/api/process-statement?session=private-session", "DELETE"]]);
});

test("continuation warnings reflect final empty and unread rows rather than stale native candidates", async () => {
  let count = 0;
  const result = await readServerStatement(file(), { fetchImpl: async () => {
    count++;
    if (count === 1) return response({ success: true, sessionId: "test", pendingPages: [1, 2], totalPages: 3, pageResults: [{ num: 1, transactions: [row("Old candidate", 90)], expectedRows: 1 }, { num: 2, transactions: [], expectedRows: 0 }, { num: 3, transactions: [row("Good native row", 100, "2026-01-03")], expectedRows: 1 }], warnings: ["No transaction rows were found on PDF page(s) 2. Check whether those pages contain transactions before importing."] });
    if (count === 2) return response({ success: true, processedPage: 1, remainingPages: [2], pageResults: [{ num: 1, transactions: [], expectedRows: 0 }] });
    return response({ success: true, processedPage: 2, remainingPages: [], pageResults: [{ num: 2, transactions: [row("OCR recovered row", 90, "2026-01-02")], expectedRows: 2 }] });
  } });
  assert.equal(result.count, 2);
  assert.match(result.warnings[0], /PDF page 2: at least 2 dated rows.*only 1 were read/);
  assert.match(result.warnings[1], /^2 PDF page/);
  assert.match(result.warnings[2], /page\(s\) 1\./);
});

test("missing page responses cannot silently produce a partial preview", async () => {
  const requests = [];
  await assert.rejects(readServerStatement(file(), { fetchImpl: async (url, options) => {
    requests.push(options.method);
    if (options.method === "DELETE") throw new Error("Offline during cleanup");
    if (requests.length === 1) return response({ success: true, sessionId: "test", pendingPages: [1], totalPages: 1, pageResults: [{ num: 1, transactions: [] }] });
    return response({ success: true, processedPage: 1, remainingPages: [], transactions: [row("Not authoritative", 90)] });
  } }), /incomplete statement/);
  assert.deepEqual(requests, ["POST", "POST", "DELETE"]);
});

test("password-required errors retain their retry code", async () => {
  await assert.rejects(readServerStatement(file(), { fetchImpl: async () => response({ success: false, error: "Enter a password", code: "PDF_PASSWORD_REQUIRED" }, 422) }), { code: "PDF_PASSWORD_REQUIRED" });
});

test("incomplete or duplicate page inventories are rejected and their upload sessions canceled", async () => {
  const initial = { success: true, sessionId: "test", pendingPages: [1, 2], totalPages: 2, pageResults: [{ num: 1, transactions: [] }, { num: 2, transactions: [] }] };
  const malformed = [
    { pageResults: [{ num: 1, transactions: [] }] },
    { pageResults: [{ num: 1, transactions: [] }, { num: 1, transactions: [] }] },
    { pageResults: [...initial.pageResults, { num: 2, transactions: [] }] },
    { pageResults: [{ num: 1, transactions: [] }, { num: 2 }] },
    { pendingPages: [1, 1] },
    { pendingPages: [2, 1] },
    { pendingPages: [3] },
    { pendingPages: ["1"] },
  ];
  for (const replacement of malformed) {
    const requests = [];
    await assert.rejects(readServerStatement(file(), { fetchImpl: async (url, options) => {
      requests.push(options.method);
      return response(options.method === "DELETE" ? { success: true } : { ...initial, ...replacement });
    } }), /incomplete statement/);
    assert.deepEqual(requests, ["POST", "DELETE"]);
  }
});
