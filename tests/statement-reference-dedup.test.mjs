import test from "node:test";
import assert from "node:assert/strict";
import { removeExistingTransactions } from "../src/lib/import/save-import.js";

const row = (description, extra = {}) => ({ transaction_date: "2026-10-01", type: "expense", amount: 150, description, category: "Other", payment_method: "UPI", ...extra });
const original = row("UPI/DR/123456789012/SYNTHETIC SHOP/BANK/PAYMENT");
const fuller = row("UPI/DR/123456789012/SYNTHETIC SHOP/BANK/PAYMENT Additional narration Chq: 123456789012");

test("UPI re-uploads skip saved rows when extraction adds wrapped narration", () => {
  assert.deepEqual(removeExistingTransactions([fuller], [original]), { toInsert: [], skipped: 1 });
});

test("distinct UPI references, dates, amounts and directions remain distinct", () => {
  for (const candidate of [
    row("UPI/DR/123456789013/SYNTHETIC SHOP/BANK/PAYMENT"),
    row(fuller.description, { transaction_date: "2026-10-02" }),
    row(fuller.description, { amount: 151 }),
    row(fuller.description, { type: "income" }),
  ]) assert.deepEqual(removeExistingTransactions([candidate], [original]), { toInsert: [candidate], skipped: 0 });
});

test("reference matching preserves legitimate repeated-row multiplicity", () => {
  assert.deepEqual(removeExistingTransactions([fuller, fuller], [original]), { toInsert: [fuller], skipped: 1 });
  assert.deepEqual(removeExistingTransactions([fuller, fuller], [original, original]), { toInsert: [], skipped: 2 });
});

test("account numbers and generic order numbers do not collapse unrelated transactions", () => {
  for (const prefix of ["MB/123456789012", "ORDER 123456789012", "UPI/DR/12345678"]) {
    const first = row(`${prefix}/FIRST`), second = row(`${prefix}/SECOND`);
    assert.deepEqual(removeExistingTransactions([second], [first]), { toInsert: [second], skipped: 0 });
  }
});
