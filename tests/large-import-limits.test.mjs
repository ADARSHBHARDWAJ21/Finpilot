import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { MAX_IMPORT_ROWS, MAX_PDF_PAGES, MAX_FILE_BYTES, assertImportRowLimit, validateFile } from "../src/lib/import/transaction-values.js";
import { parseStatementMatrix, parseStatementText } from "../src/lib/import/statement-parser.js";
import { normalizeImportRows, saveImportedTransactions } from "../src/lib/import/save-import.js";
import { parseStatementFile } from "../src/components/transactions/parse-statement-file.js";
import nextConfig from "../next.config.mjs";

const row = { transaction_date: "2026-09-01", description: "Synthetic statement entry", amount: 1, type: "expense", category: "Other", payment_method: "Bank" };
const header = ["Date", "Description", "Amount", "Type"];
const matrixRow = ["01/09/2026", row.description, 1, "expense"];
const rowLimit = (error) => error.code === "IMPORT_ROW_LIMIT" && /10,000/.test(error.message);

test("larger shared limits accept their boundaries and reject oversized uploads", () => {
  assert.equal(MAX_IMPORT_ROWS, 10_000);
  assert.equal(MAX_PDF_PAGES, 500);
  assert.equal(MAX_FILE_BYTES, 50 * 1024 * 1024);
  assert.doesNotThrow(() => validateFile({ size: MAX_FILE_BYTES }));
  assert.throws(() => validateFile({ size: MAX_FILE_BYTES + 1 }), /50 MB/);
  assert.doesNotThrow(() => assertImportRowLimit(MAX_IMPORT_ROWS));
  assert.throws(() => assertImportRowLimit(MAX_IMPORT_ROWS + 1), rowLimit);
});

test("table, text and save preparation retain all 10,000 rows and reject overflow", () => {
  const matrix = [header, ...Array.from({ length: MAX_IMPORT_ROWS }, () => [...matrixRow])];
  assert.equal(parseStatementMatrix(matrix).transactions.length, MAX_IMPORT_ROWS);
  assert.throws(() => parseStatementMatrix([...matrix, matrixRow]), rowLimit);
  const text = Array.from({ length: MAX_IMPORT_ROWS }, () => "01/09/2026 Synthetic entry 1.00 DR").join("\n");
  assert.equal(parseStatementText(text).transactions.length, MAX_IMPORT_ROWS);
  assert.throws(() => parseStatementText(`${text}\n01/09/2026 Synthetic entry 1.00 DR`), rowLimit);
  const prepared = normalizeImportRows(Array.from({ length: MAX_IMPORT_ROWS }, () => row), "synthetic-owner");
  assert.equal(prepared.length, MAX_IMPORT_ROWS);
  assert.ok(prepared.every((entry) => entry.user_id === "synthetic-owner"));
  assert.throws(() => normalizeImportRows([...prepared, row], "synthetic-owner"), rowLimit);
});

test("server actions accept a full reviewed batch with maximum Unicode or escaped field lengths", () => {
  const configuredLimit = nextConfig.experimental.serverActions.bodySizeLimit;
  assert.match(configuredLimit, /^\d+mb$/i);
  const bodyLimit = Number.parseInt(configuredLimit, 10) * 1024 * 1024;
  // BMP Unicode uses three UTF-8 bytes per character. Control characters can
  // expand further to six-byte JSON escapes despite fitting field validation.
  for (const character of ["क", "\u0000"]) {
    const maximum = { ...row, amount: 1_000_000_000, description: character.repeat(500), category: character.repeat(80), payment_method: character.repeat(80) };
    const prepared = normalizeImportRows(Array.from({ length: MAX_IMPORT_ROWS }, () => maximum), "synthetic-owner");
    const payloadBytes = Buffer.byteLength(JSON.stringify([prepared]), "utf8");
    assert.ok(payloadBytes > 10 * 1024 * 1024, "This valid batch exceeds the previous action limit");
    assert.ok(payloadBytes < bodyLimit, "Every valid reviewed row must fit in one atomic save request");
  }
});

function workbookFile(sheets) {
  const workbook = XLSX.utils.book_new();
  for (const [name, count] of sheets) XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([header, ...Array.from({ length: count }, () => [...matrixRow])]), name);
  return new File([XLSX.write(workbook, { type: "array", bookType: "xlsx" })], "synthetic-statement.xlsx");
}

test("multi-sheet workbooks enforce the aggregate limit and never skip an oversized sheet", async () => {
  assert.equal((await parseStatementFile(workbookFile([["First", 5000], ["Second", 5000]]))).transactions.length, MAX_IMPORT_ROWS);
  await assert.rejects(parseStatementFile(workbookFile([["First", 5000], ["Second", 5001]])), rowLimit);
  await assert.rejects(parseStatementFile(workbookFile([["Oversized", MAX_IMPORT_ROWS + 1], ["Small", 1]])), rowLimit);
});

function responseLimitedDatabase(existing) {
  const state = { rows: existing.map((entry, index) => ({ ...entry, id: index + 1 })), insertCalls: 0, readCalls: 0 };
  return {
    state,
    from(table) {
      assert.equal(table, "transactions");
      let inserted = null;
      let owner;
      let firstDate;
      let lastDate;
      const query = {
        select() {
          if (!inserted) return query;
          state.insertCalls++;
          const saved = inserted.map((entry, index) => ({ ...entry, id: state.rows.length + index + 1 }));
          state.rows.push(...saved);
          return Promise.resolve({ data: saved.slice(0, 1000), error: null });
        },
        eq(field, value) { assert.equal(field, "user_id"); owner = value; return query; },
        gte(field, value) { assert.equal(field, "transaction_date"); firstDate = value; return query; },
        lte(field, value) { assert.equal(field, "transaction_date"); lastDate = value; return query; },
        order() { return query; },
        range(first, last) {
          state.readCalls++;
          const matching = state.rows.filter((entry) => entry.user_id === owner && entry.transaction_date >= firstDate && entry.transaction_date <= lastDate);
          return Promise.resolve({ data: matching.slice(first, last + 1), error: null });
        },
        insert(entries) { inserted = entries; return query; },
      };
      return query;
    },
  };
}

test("large imports save atomically, count every saved row and preserve legitimate repeats", async () => {
  const owner = "synthetic-owner";
  const input = Array.from({ length: 2505 }, (_, index) => ({ ...row, description: index < 3 ? "Repeated legitimate payment" : `New synthetic payment ${index}` }));
  const existing = [{ ...input[0], user_id: owner }, ...Array.from({ length: 1199 }, (_, index) => ({ ...row, user_id: owner, description: `Existing unrelated payment ${index}` }))];
  const database = responseLimitedDatabase(existing);
  const result = await saveImportedTransactions(database, owner, input);
  assert.equal(result.count, 2504);
  assert.equal(result.skipped, 1);
  assert.equal(result.transactions.length, 1000);
  assert.equal(result.refreshRequired, true);
  assert.equal(database.state.insertCalls, 1);
  assert.equal(database.state.readCalls, 2);
  assert.equal(database.state.rows.length, existing.length + 2504);
  assert.equal(database.state.rows.filter((entry) => entry.description === "Repeated legitimate payment").length, 3);
  const retry = await saveImportedTransactions(database, owner, input);
  assert.equal(retry.count, 0);
  assert.equal(retry.skipped, input.length);
  assert.equal(database.state.insertCalls, 1);
});
