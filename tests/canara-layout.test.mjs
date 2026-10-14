import test from "node:test";
import assert from "node:assert/strict";
import { parsePositionedStatementLayout } from "../src/lib/import/ocr-layout-parser.js";
import { validateImportRow } from "../src/lib/import/transaction-values.js";

function word(text, x, y, width = text.length * 10, sourcePage) {
  return { text, x, y, width, height: 20, ...(sourcePage ? { sourcePage } : {}) };
}

function header(y = 20, sourcePage) {
  return [word("Date", 73, y, 42, sourcePage), word("Particulars", 281, y, 120, sourcePage), word("Deposits", 539, y, 85, sourcePage), word("Withdrawals", 695, y, 120, sourcePage), word("Balance", 869, y, 85, sourcePage)];
}

function centeredRow(date, label, top, amount, balance, sourcePage, credit = false) {
  const narration = ["UPI", label, "Reference", "Bank transfer", "Merchant account", "Details"];
  return [
    ...narration.map((text, index) => word(text, 179, top + index * 20, text.length * 10, sourcePage)),
    // PDF text often places the date a half line lower than the narration.
    word(date, 45, top + 70, 115, sourcePage),
    word(amount, credit ? 595 : 774, top + 70, 65, sourcePage),
    word(balance, 898, top + 70, 80, sourcePage),
    word("Chq:", 179, top + 140, 40, sourcePage),
    word("TESTREF", 233, top + 140, 80, sourcePage),
  ];
}

test("centered headers accept left-aligned dates and full wrapped narration cells", () => {
  const result = parsePositionedStatementLayout([
    ...header(),
    word("Opening", 513, 50), word("Balance", 596, 50), word("1000.00", 902, 50),
    ...centeredRow("01/09/2026", "FIRST", 80, "100.00", "900.00"),
    ...centeredRow("02/09/2026", "SECOND", 260, "50.00", "950.00", undefined, true),
    word("Closing", 522, 460), word("Balance", 600, 460), word("950.00", 902, 460),
  ], { includeBalances: true });
  assert.deepEqual(result.transactions.map((row) => [row.transaction_date, row.amount, row.type]), [["2026-09-01", 100, "expense"], ["2026-09-02", 50, "income"]]);
  assert.deepEqual(result.transactions.map((row) => row.description), ["UPI FIRST Reference Bank transfer Merchant account Details Chq: TESTREF", "UPI SECOND Reference Bank transfer Merchant account Details Chq: TESTREF"]);
  assert.equal(result.openingBalance, 1000);
  assert.equal(result.layout.centeredRows, true);
  assert.ok(result.transactions.every((row) => !validateImportRow(row).issues.length));
});

test("centered row placement persists on a headerless continuation page", () => {
  const first = parsePositionedStatementLayout([...header(), ...centeredRow("01/09/2026", "FIRST", 80, "100.00", "900.00")]);
  const second = parsePositionedStatementLayout([...centeredRow("02/09/2026", "SECOND", 40, "50.00", "850.00")], { layout: first.layout });
  assert.equal(second.transactions[0].description, "UPI SECOND Reference Bank transfer Merchant account Details Chq: TESTREF");
  assert.equal(second.transactions[0].amount, 50);
});

test("row ownership uses the date baseline when narration lines sit half a line above it", () => {
  const firstDescription = ["UPI", "FIRST", "Reference", "Bank", "Transfer", "Account", "Details"];
  const secondDescription = ["UPI", "SECOND", "Reference", "Details"];
  const result = parsePositionedStatementLayout([
    ...header(),
    ...firstDescription.map((text, index) => word(text, 179, 80 + index * 20)),
    word("01/09/2026", 45, 160, 115), word("100.00", 774, 160), word("900.00", 898, 160),
    word("Chq:", 179, 244), word("FIRSTREF", 233, 244),
    ...secondDescription.map((text, index) => word(text, 179, 280 + index * 20)),
    word("02/09/2026", 45, 330, 115), word("50.00", 774, 330), word("850.00", 898, 330),
    word("Chq:", 179, 380), word("SECONDREF", 233, 380),
  ]);
  assert.equal(result.transactions[0].description, "UPI FIRST Reference Bank Transfer Account Details Chq: FIRSTREF");
  assert.equal(result.transactions[1].description, "UPI SECOND Reference Details Chq: SECONDREF");
});

test("a tall centered cell retains its cheque note before an adjacent short cell", () => {
  const firstDescription = ["UPI", "FIRST", "Reference", "Bank", "Transfer", "Account", "Details"];
  const result = parsePositionedStatementLayout([
    ...header(),
    ...firstDescription.map((text, index) => word(text, 179, 80 + index * 20)),
    word("01/09/2026", 45, 160, 115), word("100.00", 774, 160), word("900.00", 898, 160),
    word("Chq:", 179, 244), word("FIRSTREF", 233, 244),
    word("UPI", 179, 280), word("SECOND", 179, 300),
    word("02/09/2026", 45, 290, 115), word("50.00", 774, 290), word("850.00", 898, 290),
    word("Chq:", 179, 340), word("SECONDREF", 233, 340),
  ]);
  assert.equal(result.transactions[0].description, "UPI FIRST Reference Bank Transfer Account Details Chq: FIRSTREF");
  assert.equal(result.transactions[1].description, "UPI SECOND Chq: SECONDREF");
});

test("contiguous wrapped narration is kept whole when adjacent centered rows differ in height", () => {
  const firstDescription = ["UPI", "FIRST", "Reference", "Bank", "Transfer", "Account", "Details", "Tail"];
  const result = parsePositionedStatementLayout([
    ...header(),
    ...firstDescription.map((text, index) => word(text, 179, 80 + index * 20)),
    word("01/09/2026", 45, 150, 115), word("100.00", 774, 150), word("900.00", 898, 150),
    word("UPI", 179, 260), word("SECOND", 179, 280),
    word("02/09/2026", 45, 270, 115), word("50.00", 774, 270), word("850.00", 898, 270),
  ]);
  assert.equal(result.transactions[0].description, "UPI FIRST Reference Bank Transfer Account Details Tail");
  assert.equal(result.transactions[1].description, "UPI SECOND");
});

test("centered narration cells stay on their source pages in combined documents", () => {
  const result = parsePositionedStatementLayout([
    ...header(20, 1), ...centeredRow("01/09/2026", "FIRST", 80, "100.00", "900.00", 1),
    ...header(1020, 2), ...centeredRow("02/09/2026", "SECOND", 1080, "50.00", "850.00", 2),
  ], { includeSourcePages: true });
  assert.deepEqual(result.transactions.map((row) => row._sourcePage), [1, 2]);
  assert.equal(result.transactions[0].description.includes("SECOND"), false);
  assert.equal(result.transactions[1].description.includes("FIRST"), false);
  assert.ok(result.transactions.every((row) => row.description.startsWith("UPI")));
});

test("ordinary top-aligned rows still retain wrapped descriptions below the date", () => {
  const result = parsePositionedStatementLayout([
    ...header(), word("01/09/2026", 45, 80, 115), word("UPI", 179, 80), word("FIRST", 179, 110), word("100.00", 774, 110), word("900.00", 898, 110),
    word("02/09/2026", 45, 170, 115), word("UPI", 179, 170), word("SECOND", 179, 200), word("50.00", 774, 200), word("850.00", 898, 200),
  ]);
  assert.deepEqual(result.transactions.map((row) => row.description), ["UPI FIRST", "UPI SECOND"]);
  assert.equal(result.layout.centeredRows, false);
});
