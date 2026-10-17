import { identifyColumns, isStatementHeader, parseStatementMatrix } from "../../lib/import/statement-parser.js";
import { assertImportRowLimit, validateFile, excelSerialDate } from "../../lib/import/transaction-values.js";

export function isSpreadsheetFile(file) {
  return /\.(?:csv|xlsx|xls)$/i.test(file?.name || "");
}
export function isPdfFile(file) {
  return /\.pdf$/i.test(file?.name || "");
}

export async function parseStatementFile(file) {
  validateFile(file);
  if (/\.csv$/i.test(file.name)) {
    const { default: Papa } = await import("papaparse");
    const result = Papa.parse(await file.text(), { skipEmptyLines: "greedy" });
    if (result.errors.some((error) => error.code === "MissingQuotes")) throw new Error("This CSV contains an unclosed quoted field. Export it again from your bank.");
    return parseStatementMatrix(result.data);
  }
  if (!/\.(?:xls|xlsx)$/i.test(file.name)) throw new Error("Choose a CSV, XLSX or XLS file.");
  const XLSX = await import("xlsx");
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
      if (workbook.SheetNames.length === 1 || error.code === "IMPORT_ROW_LIMIT") throw error;
      warnings.push(`Sheet “${name}” has no readable transaction table and was skipped.`);
    }
  }
  if (!transactions.length) throw new Error("No transaction table was found in the workbook.");
  assertImportRowLimit(transactions.length, "workbook");
  return { transactions, warnings };
}
