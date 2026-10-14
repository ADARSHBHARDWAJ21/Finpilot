import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { processStatement } from "../src/lib/ingestion/process-statement.js";
import { validateImportRow } from "../src/lib/import/transaction-values.js";

async function digitalStatement(pageCount, rowsPerPage = 50) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Courier);
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const page = document.addPage([612, 792]);
    for (let row = 0; row < rowsPerPage; row++) page.drawText(`01/10/2026 TEST PAYMENT ${pageIndex * rowsPerPage + row + 1} 10.00 DR`, { x: 40, y: 755 - row * 14, size: 9, font });
  }
  return Buffer.from(await document.save());
}

test("a 500-page digital PDF reads all 10,000 transactions without OCR or truncation", async () => {
  const result = await processStatement(await digitalStatement(500, 20), "pdf", "", { deferOcr: true });
  assert.equal(result.ok, true);
  assert.equal(result.totalPages, 500);
  assert.equal(result.count, 10_000);
  assert.deepEqual(result.pendingPages, []);
  assert.equal(result.extractionMethod, "PDF text");
  assert.equal(result.pageResults.length, 500);
  assert.ok(result.transactions.every((row) => row.amount === 10 && row.type === "expense" && !validateImportRow(row).issues.length));
  assert.match(result.transactions.at(-1).description, /10000/);
});

test("only the requested page is returned while native neighboring pages remain context", async () => {
  const result = await processStatement(await digitalStatement(4, 2), "pdf", "", { pageNumbers: [3], includeBalances: true });
  assert.equal(result.totalPages, 4);
  assert.equal(result.count, 2);
  assert.deepEqual(result.pageResults.map((page) => page.num), [3]);
  assert.match(result.transactions[0].description, /PAYMENT 5/);
  assert.match(result.transactions[1].description, /PAYMENT 6/);
  await assert.rejects(processStatement(await digitalStatement(1, 1), "pdf", "", { pageNumbers: [2] }), /valid PDF pages/);
});

test("a final native disclaimer cannot create a transaction or an OCR task", async () => {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Courier);
  const first = document.addPage([612, 792]);
  const columns = [[30, "Date"], [160, "Particulars"], [340, "Deposits"], [420, "Withdrawals"], [505, "Balance"]];
  columns.forEach(([x, text]) => first.drawText(text, { x, y: 740, size: 9, font }));
  [[30, "01/10/2026"], [160, "SYNTHETIC PAYMENT"], [420, "10.00"], [505, "990.00"]].forEach(([x, text]) => first.drawText(text, { x, y: 710, size: 9, font }));
  const second = document.addPage([612, 792]);
  second.drawText("DISCLAIMER", { x: 40, y: 740, size: 12, font });
  second.drawText("10/3/8 SAMPLE ADDRESS", { x: 40, y: 690, size: 12, font });
  second.drawText("END OF STATEMENT", { x: 40, y: 650, size: 12, font });
  const result = await processStatement(Buffer.from(await document.save()), "pdf", "", { deferOcr: true });
  assert.equal(result.count, 1);
  assert.deepEqual(result.pendingPages, []);
  assert.equal(result.pageResults[1].informational, true);
  assert.deepEqual(result.pageResults[1].transactions, []);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.transactions[0].description, "SYNTHETIC PAYMENT");
});
