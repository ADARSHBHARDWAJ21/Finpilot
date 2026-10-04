import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as XLSX from "xlsx";
import sharp from "sharp";
import { parseMoney, parseTransactionDate, validateImportRow, transactionKey } from "../src/lib/import/transaction-values.js";
import { parseStatementMatrix, parseStatementText, completeStatementRows } from "../src/lib/import/statement-parser.js";
import { parseOcrStatementLayout, parsePositionedStatementLayout } from "../src/lib/import/ocr-layout-parser.js";
import { normalizeImportRows, removeExistingTransactions, saveImportedTransactions } from "../src/lib/import/save-import.js";
import { parseStatementFile } from "../src/components/transactions/parse-statement-file.js";
import { processStatement, selectStatementExtraction } from "../src/lib/ingestion/process-statement.js";
import { detectCategory, applyCategoryRules } from "../src/lib/bank-parsers/category-rules.js";
import { normalizeTransactions } from "../src/lib/bank-parsers/normalize-transactions.js";
import { TRANSACTION_CATEGORY_KEYS } from "../src/lib/budget/category-meta.js";

const expense = { transaction_date: "2026-09-01", description: "Finpilot import test coffee", amount: 450, type: "expense", category: "Food", payment_method: "Bank" };
const income = { ...expense, description: "Finpilot import test salary", amount: 30000, type: "income", category: "Income" };

test("category suggestions recognize merchants and bill descriptions in bank narrations", () => {
  const examples = [
    ["UPI/DR/123456789012/zomato@hdfcbank", "Food"],
    ["UPI swiggyinstamart@icici", "Food"],
    ["POS BIGBASKET Bengaluru", "Food"],
    ["UPI/OLA CABS/123456", "Transport"],
    ["FASTAG recharge", "Transport"],
    ["AMAZON PRIME subscription", "Entertainment"],
    ["POS AMAZON purchase", "Shopping"],
    ["AIRTEL broadband bill", "Utilities"],
    ["NEFT MONTHLY RENT", "Housing"],
    ["UPI APOLLO PHARMACY", "Healthcare"],
  ];
  for (const [description, category] of examples) {
    assert.equal(detectCategory(description, "expense"), category, description);
    assert.ok(TRANSACTION_CATEGORY_KEYS.includes(category));
  }
});

test("unknown beneficiaries and merchant fragments are not assigned a guessed category", () => {
  for (const description of ["UPI/DR/KAMOLA/123456", "NEFT BIPOLAR SERVICES", "UPI/DR/RAMESH/123456", "IMPS TRANSFER", "BANK CHARGES"]) {
    assert.equal(detectCategory(description, "expense"), "Other", description);
  }
  assert.equal(detectCategory("AMAZON REFUND", "income"), "Income");
  assert.equal(applyCategoryRules("ZOMATO", "Business meals", "expense"), "Business meals");
});

test("CSV, Excel matrix and PDF text share automatic suggestions and preserve source categories", async () => {
  const csv = "Date,Description,Debit,Credit,Category\n01/09/2026,UPI SWIGGY,450,,\n02/09/2026,NETFLIX,500,,\n03/09/2026,AMAZON REFUND,,100,\n04/09/2026,UBER,200,,Business travel\n";
  const result = await parseStatementFile(new File([csv], "categories.csv"));
  assert.deepEqual(result.transactions.map((row) => row.category), ["Food", "Entertainment", "Income", "Business travel"]);
  const matrix = parseStatementMatrix([["Date", "Description", "Amount", "Type"], ["01/09/2026", "AIRTEL", 100, "expense"], ["02/09/2026", "SBINT CREDIT", 20, "income"]]);
  assert.deepEqual(matrix.transactions.map((row) => row.category), ["Utilities", "Income"]);
  const pdfText = parseStatementText("01/09/2026 ZOMATO 450.00 DR\n02/09/2026 SBINT 20.00 CR");
  assert.deepEqual(pdfText.transactions.map((row) => row.category), ["Food", "Income"]);
  assert.deepEqual(normalizeTransactions([{ date: "01/09/2026", description: "ZOMATO", amount: -50 }, { date: "02/09/2026", description: "ZOMATO REFUND", amount: 10 }]).map((row) => row.category), ["Food", "Income"]);
});

test("saving uses the reviewed dropdown category including Other without reclassifying", async () => {
  const rows = normalizeImportRows([
    { ...expense, description: "ZOMATO", category: "Other" },
    { ...expense, description: "ZOMATO", category: "Housing" },
    { ...expense, description: "ZOMATO", category: "Business meals" },
    { ...expense, description: "ZOMATO", category: undefined },
  ], "owner");
  assert.deepEqual(rows.map((row) => row.category), ["Other", "Housing", "Business meals", "Food"]);
  const db = fakeDatabase();
  await saveImportedTransactions(db, "owner", rows);
  assert.deepEqual(db.state.rows.map((row) => row.category), ["Other", "Housing", "Business meals", "Food"]);
});

test("dates validate calendar days and Indian date order without timezone shifts", () => {
  assert.equal(parseTransactionDate("01/10/2026"), "2026-10-01");
  assert.equal(parseTransactionDate("1-Oct-26"), "2026-10-01");
  assert.equal(parseTransactionDate("2024-02-29"), "2024-02-29");
  for (const value of ["2026-02-29", "31/04/2026", "12/13/2026", "not a date"]) assert.equal(parseTransactionDate(value), "");
});

test("money supports Indian grouping, currency, parentheses and debit/credit markers", () => {
  assert.equal(parseMoney("₹1,23,456.78"), 123456.78);
  assert.equal(parseMoney("Rs. 1,250.00 DR"), -1250);
  assert.equal(parseMoney("(300.00)"), -300);
  assert.equal(parseMoney("500.00 CR"), 500);
  for (const value of ["hello", "1e3", "100USD", "", "12.345", "Infinity"]) assert.equal(parseMoney(value), null);
});

test("CSV debit/credit columns preserve directions and never import the running balance", async () => {
  const file = new File(["My bank statement\nTransaction Date,Narration,Withdrawal Amt.,Deposit Amt.,Closing Balance\n01/09/2026,UPI COFFEE,450.00,,9500.00\n02/09/2026,SALARY,,30000.00,39500.00\n"], "statement.csv");
  const result = await parseStatementFile(file);
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type]), [[450, "expense"], [30000, "income"]]);
});

test("quoted CSV descriptions, signed values and explicit Dr/Cr types work", async () => {
  const result = await parseStatementFile(new File(['Date,Description,Amount,Type\n01/09/2026,"Shop, groceries",500,DR\n02/09/2026,Refund,+100,\n03/09/2026,Fee,-20,\n'], "statement.csv"));
  assert.equal(result.transactions[0].description, "Shop, groceries");
  assert.deepEqual(result.transactions.map((row) => row.type), ["expense", "income", "expense"]);
});

test("unsigned amounts require direction; invalid and missing dates stay available to repair", () => {
  const result = parseStatementMatrix([["Date", "Description", "Amount"], ["31/02/2026", "Bad date", 10], ["", "Missing date", 20], ["01/09/2026", "Unsigned", 30]]);
  assert.equal(result.transactions.length, 3);
  assert.equal(result.transactions[2].type, "");
  assert.ok(result.transactions.every((row) => validateImportRow(row).issues.length > 0));
});

test("both debit and credit populated stay invalid rather than netting unrelated amounts", () => {
  const result = parseStatementMatrix([["Date", "Description", "Debit", "Credit"], ["01/09/2026", "Ambiguous", 100, 200]]);
  assert.equal(result.transactions[0].amount, "");
  assert.ok(validateImportRow(result.transactions[0]).issues.length);
});

test("bank exports fill direction from amounts and running balances in either date order", async () => {
  const header = ["Txn Date", "Txn Description", "Amount", "Running Balance"];
  const data = [["01/09/2026", "UPI ZOMATO", 450, 9550], ["02/09/2026", "NEFT SALARY", 30000, 39550]];
  for (const rows of [data, [...data].reverse()]) {
    const csv = [["Opening Balance", 10000], header, ...rows].map((row) => row.join(",")).join("\n");
    const result = await parseStatementFile(new File([csv], "bank.csv"));
    const ordered = result.transactions.toSorted((a, b) => a.transaction_date.localeCompare(b.transaction_date));
    assert.deepEqual(ordered.map((row) => [row.amount, row.type, row.category, row.payment_method]), [[450, "expense", "Food", "UPI"], [30000, "income", "Income", "Net Banking"]]);
    assert.ok(ordered.every((row) => !validateImportRow(row).issues.length));
  }
});

test("same-day balance changes fill directions only when a unique row order agrees", () => {
  const result = parseStatementMatrix([["Opening Balance", 10000], ["Date", "Narration", "Amount", "Balance"], ["01/09/2026", "UPI ZOMATO", 450, 9550], ["01/09/2026", "NEFT SALARY", 30000, 39550]]);
  assert.deepEqual(result.transactions.map((row) => row.type), ["expense", "income"]);
  const unclear = parseStatementMatrix([["Date", "Narration", "Amount", "Balance"], ["01/09/2026", "First", 100, 1000], ["01/09/2026", "Second", 100, 1100]]);
  assert.deepEqual(unclear.transactions.map((row) => row.type), ["", ""]);
});

test("missing intermediate balances cannot borrow an unrelated opening balance", () => {
  const result = parseStatementMatrix([["Opening Balance", 10000], ["Date", "Narration", "Amount", "Balance"], ["01/09/2026", "First", 20, ""], ["02/09/2026", "Second", 100, 9900]]);
  assert.equal(result.transactions[1].type, "");
});

test("compact bank headers and Amount plus Dr/Cr automatically populate Excel rows", async () => {
  const workbook = XLSX.utils.book_new();
  const matrix = [["TransactionDate", "NarrationRemarks", "DebitAmt", "CreditAmt"], ["01/09/2026", "ATM CASH", 1000, ""], ["02/09/2026", "NEFT SALARY", "", 30000]];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(matrix), "Statement");
  const result = await parseStatementFile(new File([XLSX.write(workbook, { type: "array", bookType: "xlsx" })], "bank.xlsx"));
  assert.deepEqual(result.transactions.map((row) => [row.type, row.payment_method]), [["expense", "Cash"], ["income", "Net Banking"]]);
  const explicit = parseStatementMatrix([["Date", "Description", "Debit", "Credit", "Amount", "Debit Credit Indicator"], ["01/09/2026", "CARD SHOP", "", "", 20, "DR"]]);
  assert.equal(explicit.transactions[0].type, "expense");
  assert.equal(explicit.transactions[0].amount, 20);
});

test("OCR positions preserve empty debit/credit columns without asking for types", () => {
  const lines = [
    [[60, "Date"], [400, "Narration"], [1000, "Debit"], [1300, "Credit"], [1600, "Balance"]],
    [[60, "01/09/2026"], [400, "UPI"], [480, "ZOMATO"], [1000, "450.00"], [1600, "9550.00"]],
    [[60, "02/09/2026"], [400, "NEFT"], [500, "SALARY"], [1300, "30000.00"], [1600, "39550.00"]],
  ];
  const tsv = "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n" + lines.flatMap((words, line) => words.map(([x, text], word) => `5\t1\t1\t1\t${line + 1}\t${word + 1}\t${x}\t${line * 80}\t${text.length * 18}\t30\t99\t${text}`)).join("\n");
  const result = parseOcrStatementLayout(tsv);
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type, row.payment_method]), [[450, "expense", "UPI"], [30000, "income", "Net Banking"]]);
  assert.equal(result.transactions[0].description, "UPI ZOMATO");
});

test("Excel serial dates respect both calendar systems and all transaction sheets", async () => {
  for (const date1904 of [false, true]) {
    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { WBProps: { date1904 } };
    const serial = date1904 ? 44834 : 46296;
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Date", "Description", "Amount", "Type"], [serial, "Test expense", 10, "expense"]]), "Transactions");
    const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = await parseStatementFile(new File([bytes], "statement.xlsx"));
    assert.equal(result.transactions[0].transaction_date, "2026-10-01");
  }
});

test("limits, empty files, damaged CSV and absent transaction headers fail clearly", async () => {
  await assert.rejects(parseStatementFile(new File([], "empty.csv")), /contains/);
  await assert.rejects(parseStatementFile(new File(['Date,Description,Amount\n01/09/2026,"bad quote,100'], "bad.csv")), /quoted/);
  assert.throws(() => parseStatementMatrix([["Customer", "Account number"], ["Test", "123"]]), /columns/);
  assert.throws(() => parseStatementMatrix([["Date", "Description", "Amount", "Type"], ...Array.from({ length: 1001 }, () => ["01/09/2026", "Test", 1, "expense"])]), /1,000/);
});

test("text parsing reads explicit markers and two-column debit/credit layouts", () => {
  const result = parseStatementText("Date Narration Debit Credit Balance\n01/09/2026 COFFEE 450.00 0.00 9550.00\n02/09/2026 SALARY 0.00 30000.00 39550.00");
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type]), [[450, "expense"], [30000, "income"]]);
  const markers = parseStatementText("01/09/2026 COFFEE 450.00 DR\n02/09/2026 SALARY 30000.00 CR");
  assert.deepEqual(markers.transactions.map((row) => row.type), ["expense", "income"]);
});

test("credit markers on balances cannot turn expenses into income", () => {
  const result = parseStatementText("Date Description Amount Balance\n01/09/2026 COFFEE 450.00 9550.00 CR");
  assert.equal(result.transactions[0].amount, 450);
  assert.equal(result.transactions[0].type, "");
});

test("text amounts and descriptions wrapped below the date are not dropped", () => {
  const result = parseStatementText("01 / 09 / 2026\nUPI ZOMATO\n450.00 DR\n02/09/2026 NEFT\nSALARY 30000.00 CR\nPage 1 of 1\nClosing Balance 39550.00");
  assert.deepEqual(result.transactions.map((row) => [row.description, row.amount, row.type]), [["UPI ZOMATO", 450, "expense"], ["NEFT SALARY", 30000, "income"]]);
  assert.ok(result.transactions.every((row) => !validateImportRow(row).issues.length));
  assert.equal(parseStatementText("03/09/2026 FEE -20.00").transactions[0].type, "expense");
});

function positionedWords(lines) {
  return lines.flatMap((words, line) => words.map(([x, text]) => ({ x, text, y: 40 + line * 30, width: text.length * 6, height: 12 })));
}

test("positioned rows join wrapped lines and retain column layout on headerless pages", () => {
  const first = parsePositionedStatementLayout(positionedWords([
    [[20, "Date"], [200, "Particulars"], [550, "Deposits"], [700, "Withdrawals"], [850, "Balance"]],
    [[20, "01/09/2026"], [200, "UPI"]],
    [[200, "ZOMATO"], [700, "450.00"], [850, "9550.00"]],
  ]));
  const second = parsePositionedStatementLayout(positionedWords([
    [[20, "02/09/2026"], [200, "NEFT"]],
    [[200, "SALARY"], [550, "30000.00"], [850, "39550.00"]],
  ]), { layout: first.layout });
  assert.deepEqual([...first.transactions, ...second.transactions].map((row) => [row.description, row.amount, row.type]), [["UPI ZOMATO", 450, "expense"], ["NEFT SALARY", 30000, "income"]]);
});

test("multi-line column headers and separate OCR blocks on one baseline retain all rows", () => {
  const result = parsePositionedStatementLayout(positionedWords([
    [[20, "Transaction"], [200, "Particulars"], [550, "Deposits"], [700, "Withdrawals"], [850, "Balance"]],
    [[20, "Date"]],
    [[20, "01/09/2026"], [200, "COFFEE"], [700, "450.00"], [850, "9550.00"]],
  ]));
  assert.equal(result.transactions[0].type, "expense");
  const tsv = "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n" + [
    [[60, "Date"], [400, "Narration"], [1000, "Debit"], [1300, "Credit"], [1600, "Balance"]],
    [[60, "01/09/2026"], [400, "COFFEE"], [1000, "450.00"], [1600, "9550.00"]],
    [[60, "02/09/2026"], [400, "SALARY"], [1300, "30000.00"], [1600, "39550.00"]],
  ].flatMap((words, line) => words.map(([x, text], word) => `5\t1\t${word + 1}\t1\t${line + 1}\t1\t${x}\t${line * 80}\t${text.length * 18}\t30\t99\t${text}`)).join("\n");
  assert.equal(parseOcrStatementLayout(tsv).transactions.length, 2);
});

test("running balance directions can be completed across PDF page boundaries", () => {
  const first = parseStatementMatrix([["Opening Balance", 10000], ["Date", "Particulars", "Amount", "Balance"], ["01/09/2026", "COFFEE", 450, 9550]], { includeBalances: true });
  const second = parseStatementMatrix([["Date", "Particulars", "Amount", "Balance"], ["02/09/2026", "SALARY", 30000, 39550]], { includeBalances: true });
  const result = completeStatementRows([...first.transactions, ...second.transactions], { openingBalance: first.openingBalance });
  assert.deepEqual(result.map((row) => row.type), ["expense", "income"]);
  assert.ok(result.every((row) => !Object.hasOwn(row, "_balance")));
});

test("choosing a complete PDF read does not lose visible but incomplete rows", () => {
  const partial = { transactions: [expense, { ...income, amount: "" }] };
  const fewer = { transactions: [expense] };
  assert.equal(selectStatementExtraction([fewer, partial]).transactions.length, 2);
  assert.deepEqual(selectStatementExtraction([partial, { transactions: [expense, income] }]).transactions, [expense, income]);
});

test("duplicate comparison keeps income and expenses distinct and preserves legitimate repeat counts", () => {
  const opposite = { ...expense, type: "income" };
  assert.notEqual(transactionKey(expense), transactionKey(opposite));
  const result = removeExistingTransactions([expense, expense, opposite], [expense]);
  assert.equal(result.skipped, 1);
  assert.equal(result.toInsert.length, 2);
  const replay = removeExistingTransactions([expense, expense, opposite], [expense, expense, opposite]);
  assert.equal(replay.skipped, 3);
});

test("server validation rejects the entire invalid batch and always uses authenticated ownership", () => {
  assert.throws(() => normalizeImportRows([expense, { ...expense, amount: "NaN" }], "owner"), /Row 2/);
  const rows = normalizeImportRows([{ ...expense, user_id: "victim", id: "injected" }], "owner");
  assert.equal(rows[0].user_id, "owner");
  assert.equal(rows[0].id, undefined);
});

function fakeDatabase(initial = [], failCheck = false) {
  const state = { rows: initial, inserts: 0, owners: [] };
  return { state, from() {
    let incoming, owner, lower, upper, offset = 0, end = 999;
    const query = {
      select() { return query; }, eq(name, value) { if (name === "user_id") { owner = value; state.owners.push(value); } return query; },
      gte(name, value) { lower = value; return query; }, lte(name, value) { upper = value; return query; }, order() { return query; },
      range(start, finish) { offset = start; end = finish; return query; }, insert(rows) { incoming = rows; return query; },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          if (incoming) { state.inserts++; const saved = incoming.map((row, i) => ({ ...row, id: `${state.rows.length + i}` })); state.rows.push(...saved); return { data: saved }; }
          if (failCheck) return { error: { message: "test database outage" } };
          return { data: state.rows.filter((row) => row.user_id === owner && row.transaction_date >= lower && row.transaction_date <= upper).slice(offset, end + 1) };
        }).then(resolve, reject);
      },
    };
    return query;
  } };
}

test("save imports use account-scoped duplicate reads, one atomic insert and safe retries", async () => {
  const db = fakeDatabase([{ ...income, user_id: "other" }]);
  const first = await saveImportedTransactions(db, "owner", [expense, income]);
  assert.equal(first.count, 2);
  assert.equal(db.state.inserts, 1);
  const second = await saveImportedTransactions(db, "owner", [expense, income]);
  assert.equal(second.count, 0);
  assert.equal(second.skipped, 2);
  assert.ok(db.state.owners.every((id) => id === "owner"));
  assert.equal(db.state.rows[0].user_id, "other");
});

test("concurrent imports on this server serialize to avoid double saving", async () => {
  const db = fakeDatabase();
  const results = await Promise.all([saveImportedTransactions(db, "owner", [expense]), saveImportedTransactions(db, "owner", [expense])]);
  assert.equal(results.reduce((count, result) => count + result.count, 0), 1);
  assert.equal(db.state.inserts, 1);
});

test("failed duplicate checks never continue with an insert", async () => {
  const db = fakeDatabase([], true);
  await assert.rejects(saveImportedTransactions(db, "owner", [expense]), /Nothing was imported/);
  assert.equal(db.state.inserts, 0);
});

function pdfDocument(lines) {
  const stream = `BT /F1 12 Tf 40 760 Td 20 TL ${lines.map((line, i) => `${i ? "T* " : ""}(${line.replace(/[()\\]/g, "\\$&")}) Tj`).join("\n")} ET`;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>", `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let content = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(content)); content += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(content);
  content += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(content);
}

test("a real text PDF extracts transaction amounts and directions without AI", async () => {
  const result = await processStatement(pdfDocument(["Synthetic bank statement", "01/09/2026 TEST COFFEE 450.00 DR", "02/09/2026 TEST SALARY 30000.00 CR"]), "pdf");
  assert.equal(result.ok, true);
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type]), [[450, "expense"], [30000, "income"]]);
  assert.equal(result.extractionMethod, "PDF text");
});

test("a real photo is read locally without a paid AI API", { skip: process.env.RUN_OCR_TESTS !== "1" }, async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="350"><rect width="100%" height="100%" fill="white"/><g fill="black" font-family="monospace" font-size="32"><text x="60" y="80">Synthetic bank statement</text><text x="60" y="160">01/09/2026 TEST COFFEE 450.00 DR</text><text x="60" y="230">02/09/2026 TEST SALARY 30000.00 CR</text></g></svg>';
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.mkdir(new URL("./fixtures/", import.meta.url), { recursive: true });
  await fs.writeFile(new URL("./fixtures/statement-photo.png", import.meta.url), png);
  const result = await processStatement(png, "image");
  assert.equal(result.ok, true);
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type]), [[450, "expense"], [30000, "income"]]);
});

function rawPdf(objects) {
  const chunks = [Buffer.from("%PDF-1.4\n")];
  const offsets = [];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(chunks.reduce((size, chunk) => size + chunk.length, 0));
    chunks.push(Buffer.from(`${index + 1} 0 obj\n`), Buffer.isBuffer(objects[index]) ? objects[index] : Buffer.from(objects[index]), Buffer.from("\nendobj\n"));
  }
  const xref = chunks.reduce((size, chunk) => size + chunk.length, 0);
  chunks.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
  return Buffer.concat(chunks);
}

test("a real bank table photo fills all details despite blank debit/credit cells", { skip: process.env.RUN_OCR_TESTS !== "1" }, async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="400"><rect width="100%" height="100%" fill="white"/><g fill="black" font-family="monospace" font-size="32"><text x="60" y="80">Date</text><text x="400" y="80">Narration</text><text x="1000" y="80">Debit</text><text x="1300" y="80">Credit</text><text x="1600" y="80">Balance</text><text x="60" y="170">01/09/2026</text><text x="400" y="170">UPI ZOMATO</text><text x="1000" y="170">450.00</text><text x="1600" y="170">9550.00</text><text x="60" y="260">02/09/2026</text><text x="400" y="260">NEFT SALARY</text><text x="1300" y="260">30000.00</text><text x="1600" y="260">39550.00</text></g></svg>';
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.writeFile(new URL("./fixtures/statement-bank-table.png", import.meta.url), png);
  const result = await processStatement(png, "image");
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type]), [[450, "expense"], [30000, "income"]]);
  assert.ok(result.transactions.every((row) => !validateImportRow(row).issues.length));
});

test("an unbordered bank PDF preserves blank columns through positioned recognition", async () => {
  const records = [
    [[30, "Date"], [170, "Narration"], [360, "Debit"], [430, "Credit"], [505, "Balance"]],
    [[30, "01/09/2026"], [170, "UPI ZOMATO"], [360, "450.00"], [505, "9550.00"]],
    [[30, "02/09/2026"], [170, "NEFT SALARY"], [430, "30000.00"], [505, "39550.00"]],
  ];
  const stream = records.flatMap((words, row) => words.map(([x, text]) => `BT /F1 12 Tf ${x} ${730 - row * 40} Td (${text}) Tj ET`)).join("\n");
  const pdf = rawPdf(["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]);
  await fs.writeFile(new URL("./fixtures/statement-bank-table.pdf", import.meta.url), pdf);
  const result = await processStatement(pdf, "pdf");
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type]), [[450, "expense"], [30000, "income"]]);
  assert.ok(result.transactions.every((row) => !validateImportRow(row).issues.length));
});

test("a real multi-page bank PDF keeps wrapped rows even with column-first text storage", async () => {
  const pages = [
    [
      [[30, "Date"], [160, "Particulars"], [340, "Deposits"], [420, "Withdrawals"], [505, "Balance"]],
      [[30, "01/09/2026"], [160, "UPI"]],
      [[160, "ZOMATO"], [420, "450.00"], [505, "9550.00"]],
      [[30, "02/09/2026"], [160, "NEFT SALARY"], [340, "30000.00"], [505, "39550.00"]],
      [[30, "03/09/2026"], [160, "ATM"]],
    ],
    [
      [[160, "CASH"], [420, "1000.00"], [505, "38550.00"]],
      [[30, "04/09/2026"], [160, "REFUND"], [340, "100.00"], [505, "38650.00"]],
    ],
  ];
  const streams = pages.map((records) => records.flatMap((words, row) => words.map(([x, text]) => ({ x, row, text }))).sort((a, b) => a.x - b.x || a.row - b.row).map(({ x, row, text }) => `BT /F1 10 Tf ${x} ${730 - row * 24} Td (${text}) Tj ET`).join("\n"));
  const pdf = rawPdf([
    "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    ...streams.map((stream) => `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`),
  ]);
  await fs.writeFile(new URL("./fixtures/statement-wrapped-multipage.pdf", import.meta.url), pdf);
  const result = await processStatement(pdf, "pdf");
  assert.deepEqual(result.transactions.map((row) => [row.description, row.amount, row.type]), [["UPI ZOMATO", 450, "expense"], ["NEFT SALARY", 30000, "income"], ["ATM CASH", 1000, "expense"], ["REFUND", 100, "income"]]);
  assert.equal(result.extractionMethod, "PDF text");
  assert.ok(result.transactions.every((row) => !validateImportRow(row).issues.length));
});

test("a PDF page with both digital and scanned transactions reads both parts", { skip: process.env.RUN_OCR_TESTS !== "1" }, async () => {
  const image = await sharp(await fs.readFile(new URL("./fixtures/statement-photo.png", import.meta.url))).jpeg().toBuffer();
  const imageObject = Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width 1600 /Height 350 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`), image, Buffer.from("\nendstream")]);
  const stream = "BT /F1 12 Tf 40 760 Td (03/09/2026 TEST REFUND 100.00 CR) Tj ET\nq 520 0 0 114 40 500 cm /Im1 Do Q";
  const pdf = rawPdf(["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents 6 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>", imageObject, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]);
  const result = await processStatement(pdf, "pdf");
  assert.equal(result.transactions.length, 3);
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type]), [[100, "income"], [450, "expense"], [30000, "income"]]);
});

test("scanned and mixed-page PDFs include every page through local OCR", { skip: process.env.RUN_OCR_TESTS !== "1" }, async () => {
  const photo = await fs.readFile(new URL("./fixtures/statement-photo.png", import.meta.url));
  const image = await sharp(photo).jpeg().toBuffer();
  const imageObject = Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width 1600 /Height 350 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`), image, Buffer.from("\nendstream")]);
  const painting = "q 520 0 0 114 40 500 cm /Im1 Do Q";
  const text = "BT /F1 12 Tf 40 760 Td (03/09/2026 TEST REFUND 100.00 CR) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 7 0 R >> >> /Contents 8 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>", `<< /Length ${text.length} >>\nstream\n${text}\nendstream`, imageObject,
    `<< /Length ${painting.length} >>\nstream\n${painting}\nendstream`,
  ];
  const mixed = rawPdf(objects);
  await fs.writeFile(new URL("./fixtures/statement-mixed.pdf", import.meta.url), mixed);
  const result = await processStatement(mixed, "pdf");
  assert.equal(result.ok, true);
  assert.equal(result.transactions.length, 3);
  assert.deepEqual(result.transactions.map((row) => [row.amount, row.type]), [[100, "income"], [450, "expense"], [30000, "income"]]);
});

test("PDF page limits reject the whole file instead of silently truncating it", async () => {
  const pages = Array.from({ length: 21 }, () => "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>");
  const bytes = rawPdf(["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${pages.map((_, i) => `${i + 3} 0 R`).join(" ")}] /Count 21 >>`, ...pages]);
  await assert.rejects(processStatement(bytes, "pdf"), /more than 20 pages/);
});
