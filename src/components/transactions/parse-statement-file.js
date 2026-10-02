import Papa from "papaparse";
import * as XLSX from "xlsx";
import { identifyColumns, isStatementHeader, parseStatementMatrix } from "../../lib/import/statement-parser.js";
import { MAX_IMPORT_ROWS, validateFile, excelSerialDate } from "../../lib/import/transaction-values.js";

export function isSpreadsheetFile(file) {
  return /\.(?:csv|xlsx|xls)$/i.test(file?.name || "");
}
export function isPdfFile(file) {
  return /\.pdf$/i.test(file?.name || "");
}

export async function parseStatementFile(file) {
  validateFile(file);
  if (/\.csv$/i.test(file.name)) {
    const result = Papa.parse(await file.text(), { skipEmptyLines: "greedy" });
    if (result.errors.some((error) => error.code === "MissingQuotes")) throw new Error("This CSV contains an unclosed quoted field. Export it again from your bank.");
    return parseStatementMatrix(result.data);
  }
  if (!/\.(?:xls|xlsx)$/i.test(file.name)) throw new Error("Choose a CSV, XLSX or XLS file.");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
  const transactions = [];
  const warnings = [];
  for (const name of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "", raw: true });
    const header = matrix.slice(0, 60).find((cells) => isStatementHeader(identifyColumns(cells)));
    if (header) {
      const dateColumn = identifyColumns(header).date;
      for (const cells of matrix) {
        if (typeof cells[dateColumn] !== "number") continue;
        cells[dateColumn] = excelSerialDate(cells[dateColumn], !!workbook.Workbook?.WBProps?.date1904);
      }
    }
    try {
      const result = parseStatementMatrix(matrix);
      transactions.push(...result.transactions);
    } catch (error) {
      if (workbook.SheetNames.length === 1 || error.message.includes("1,000")) throw error;
      warnings.push(`Sheet “${name}” has no readable transaction table and was skipped.`);
    }
  }
  if (!transactions.length) throw new Error("No transaction table was found in the workbook.");
  if (transactions.length > MAX_IMPORT_ROWS) throw new Error("This workbook has more than 1,000 transactions. Split it into smaller files.");
  return { transactions, warnings };
}
