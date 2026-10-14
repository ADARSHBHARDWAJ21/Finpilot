import test from "node:test";
import assert from "node:assert/strict";
import { completeStatementRows, parseStatementMatrix } from "../src/lib/import/statement-parser.js";
import { readServerStatement } from "../src/components/transactions/read-server-statement.js";

const balanceRow = (date, description, amount, balance, extra = {}) => ({ transaction_date: date, description, amount, _balance: balance, type: "", category: "Other", payment_method: "Bank", ...extra });

test("balance-inferred directions and default categories change with corrected neighboring balances", () => {
  const rows = completeStatementRows([
    balanceRow("2026-09-01", "First payment", 30, 90),
    balanceRow("2026-09-02", "Native payment", 10, 100),
  ], { openingBalance: 120, includeBalances: true });
  assert.deepEqual(rows.map((row) => [row.type, row.category]), [["expense", "Other"], ["income", "Income"]]);
  rows[0] = balanceRow("2026-09-01", "OCR corrected payment", 10, 110, { type: "expense" });
  const completed = completeStatementRows(rows, { openingBalance: 120 });
  assert.deepEqual(completed.map((row) => [row.type, row.category]), [["expense", "Other"], ["expense", "Other"]]);
  assert.ok(completed.every((row) => !Object.keys(row).some((key) => key.startsWith("_"))));
});

test("repeated completion is idempotent and preserves source directions and categories", () => {
  const rows = [
    balanceRow("2026-09-01", "First payment", 30, 90, { type: "expense", category: "Income" }),
    balanceRow("2026-09-02", "Source category", 10, 100, { category: "Income" }),
    balanceRow("2026-09-03", "Source direction", 10, 90, { type: "income", category: "Reviewed" }),
  ];
  const first = structuredClone(completeStatementRows(rows, { openingBalance: 120, includeBalances: true }));
  assert.deepEqual(completeStatementRows(rows, { openingBalance: 120, includeBalances: true }), first);
  rows[0]._balance = 110;
  const corrected = completeStatementRows(rows, { openingBalance: 120 });
  assert.equal(corrected[0].type, "expense");
  assert.equal(corrected[0].category, "Income");
  assert.equal(corrected[1].type, "expense");
  assert.equal(corrected[1].category, "Income");
  assert.equal(corrected[2].type, "income");
  assert.equal(corrected[2].category, "Reviewed");
});

test("a corrected OCR page updates directions on retained native pages before preview", async () => {
  const native = parseStatementMatrix([
    ["Date", "Description", "Amount", "Balance"],
    ["01/09/2026", "Scan candidate", "30.00", "90.00"],
    ["02/09/2026", "Native payment", "10.00", "100.00"],
  ], { includeBalances: true, openingBalance: 120 });
  assert.equal(native.transactions[1].type, "income");
  let requests = 0;
  const result = await readServerStatement(new File(["%PDF-synthetic"], "statement.pdf"), { fetchImpl: async () => {
    requests++;
    return Response.json(requests === 1 ? {
      success: true, sessionId: "balance-session", pendingPages: [1], totalPages: 2, openingBalance: 120,
      pageResults: [{ num: 1, transactions: [native.transactions[0]], expectedRows: 1 }, { num: 2, transactions: [native.transactions[1]], expectedRows: 1 }],
    } : {
      success: true, processedPage: 1, remainingPages: [], openingBalance: 120,
      pageResults: [{ num: 1, transactions: [balanceRow("2026-09-01", "OCR corrected payment", 10, 110, { type: "expense" })], expectedRows: 1 }],
    });
  } });
  assert.equal(requests, 2);
  assert.deepEqual(result.transactions.map((row) => [row.description, row.type, row.category]), [["OCR corrected payment", "expense", "Other"], ["Native payment", "expense", "Other"]]);
  assert.ok(result.transactions.every((row) => !Object.keys(row).some((key) => key.startsWith("_"))));
});
