import Papa from "papaparse";
import * as XLSX from "xlsx";

const FIELD_ALIASES = {
  date: [
    "date",
    "transaction_date",
    "transaction date",
    "txn_date",
    "value_date",
    "posting_date",
    "trans_date",
    "posted",
    "payment_date",
  ],
  description: [
    "description",
    "narration",
    "particulars",
    "details",
    "memo",
    "transaction_details",
    "remarks",
    "transaction_description",
    "payee",
    "name",
  ],
  amount: ["amount", "transaction_amount", "amt", "value", "transaction amount"],
  type: ["type", "transaction_type", "dr_cr", "debit_credit", "category_type"],
  category: [
    "category",
    "transaction_category",
    "cat",
    "merchant_category",
    "category type",
  ],
  payment_method: [
    "payment_method",
    "payment method",
    "mode",
    "payment_mode",
    "channel",
    "payment type",
  ],
  debit: [
    "debit",
    "withdrawal",
    "withdrawals",
    "dr",
    "debit_amount",
    "withdrawal amount",
    "paid out",
    "paid_out",
  ],
  credit: [
    "credit",
    "deposit",
    "deposits",
    "cr",
    "credit_amount",
    "deposit amount",
    "paid in",
    "paid_in",
  ],
};

function normalizeHeader(header) {
  return String(header ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function headerMatchesAlias(header, aliases) {
  if (!header) return false;
  return aliases.some((alias) => {
    const norm = normalizeHeader(alias);
    return header === norm || header.includes(norm) || norm.includes(header);
  });
}

function scoreHeaderRow(cells) {
  const headers = cells.map((c) => normalizeHeader(c));
  let score = 0;

  if (headers.some((h) => headerMatchesAlias(h, FIELD_ALIASES.date))) score += 2;
  if (headers.some((h) => headerMatchesAlias(h, FIELD_ALIASES.description))) score += 2;

  const hasAmount =
    headers.some((h) => headerMatchesAlias(h, FIELD_ALIASES.amount)) ||
    headers.some((h) => headerMatchesAlias(h, FIELD_ALIASES.debit)) ||
    headers.some((h) => headerMatchesAlias(h, FIELD_ALIASES.credit));

  if (hasAmount) score += 2;

  return score;
}

function matrixToObjects(matrix) {
  if (!matrix?.length) {
    return { objects: [], headers: [] };
  }

  let headerRowIndex = 0;
  let bestScore = 0;
  const scanLimit = Math.min(matrix.length, 30);

  for (let i = 0; i < scanLimit; i++) {
    const score = scoreHeaderRow(matrix[i]);
    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }

  const headerCells = matrix[headerRowIndex].map((c) => String(c ?? "").trim());
  const objects = [];

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row) continue;

    const hasData = row.some(
      (cell) => cell !== undefined && cell !== null && String(cell).trim() !== ""
    );
    if (!hasData) continue;

    const obj = {};
    headerCells.forEach((header, colIdx) => {
      if (header) {
        obj[header] = row[colIdx] ?? "";
      }
    });
    objects.push(obj);
  }

  return { objects, headers: headerCells.filter(Boolean), headerScore: bestScore };
}

function parseAmount(value) {
  if (value === undefined || value === null || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  let str = String(value).trim();
  const negative = /^\(.*\)$/.test(str) || str.startsWith("-");
  str = str.replace(/[₹$,\s]/g, "").replace(/[()]/g, "").replace(/^-/, "");
  const n = Number(str);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

function formatDate(value) {
  if (value === undefined || value === null || value === "") return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const m = String(parsed.m).padStart(2, "0");
      const d = String(parsed.d).padStart(2, "0");
      return `${parsed.y}-${m}-${d}`;
    }
  }

  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${month}-${day}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
}

function findField(byKey, aliases) {
  for (const alias of aliases) {
    const norm = normalizeHeader(alias);
    const val = byKey[norm];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return val;
    }
  }

  for (const [key, val] of Object.entries(byKey)) {
    if (!key || key.startsWith("__empty")) continue;
    if (headerMatchesAlias(key, aliases)) {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return val;
      }
    }
  }

  return undefined;
}

function mapRow(rawRow) {
  const byKey = {};
  for (const [key, value] of Object.entries(rawRow)) {
    const nk = normalizeHeader(key);
    if (nk && !nk.startsWith("__empty")) {
      byKey[nk] = value;
    }
  }

  let amount = parseAmount(findField(byKey, FIELD_ALIASES.amount));
  const debit = parseAmount(findField(byKey, FIELD_ALIASES.debit));
  const credit = parseAmount(findField(byKey, FIELD_ALIASES.credit));

  if (amount === null) {
    if (credit !== null && debit === null) amount = credit;
    else if (debit !== null && credit === null) amount = -Math.abs(debit);
    else if (debit !== null && credit !== null) {
      if (credit > 0 && debit === 0) amount = credit;
      else if (debit > 0 && credit === 0) amount = -Math.abs(debit);
      else amount = credit - debit;
    }
  }

  const categoryVal = findField(byKey, FIELD_ALIASES.category);
  const typeVal = findField(byKey, FIELD_ALIASES.type);

  return {
    date: formatDate(findField(byKey, FIELD_ALIASES.date)),
    description: String(findField(byKey, FIELD_ALIASES.description) ?? "").trim(),
    amount: amount ?? "",
    type: typeVal || categoryVal,
    category: categoryVal || "Other",
    payment_method: findField(byKey, FIELD_ALIASES.payment_method),
  };
}

function filterRows(rows) {
  return rows
    .map(mapRow)
    .filter((row) => {
      if (!row.date || !row.description) return false;
      if (row.amount === "" || row.amount === null || row.amount === undefined) {
        return false;
      }
      if (row.amount === 0) return false;
      return true;
    });
}

function buildParseError(headers, headerScore) {
  const headerList = headers.length ? headers.join(", ") : "(none detected)";
  return new Error(
    `No transaction rows found. Detected header row columns: ${headerList}. ` +
      `Need date, description, and amount (or debit/credit). ` +
      (headerScore < 3
        ? "Your file may have title rows above the column headers — we scan the first 30 rows automatically."
        : "Check that data rows are below the header row.")
  );
}

function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const matrix = results.data || [];
        const { objects, headers, headerScore } = matrixToObjects(matrix);
        const rows = filterRows(objects);
        if (rows.length === 0) {
          reject(buildParseError(headers, headerScore));
          return;
        }
        resolve(rows);
      },
      error: () => reject(new Error("Could not parse CSV file")),
    });
  });
}

async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel file has no sheets");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const { objects, headers, headerScore } = matrixToObjects(matrix);
  const rows = filterRows(objects);

  if (rows.length === 0) {
    throw buildParseError(headers, headerScore);
  }

  return rows;
}

export function isSpreadsheetFile(file) {
  if (!file?.name) return false;
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return true;
  }

  const type = (file.type || "").toLowerCase();
  return (
    type === "text/csv" ||
    type === "application/csv" ||
    type === "application/vnd.ms-excel" ||
    type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    type === "text/comma-separated-values" ||
    type === "text/plain"
  );
}

export function isPdfFile(file) {
  if (!file?.name) return false;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return true;
  const type = (file.type || "").toLowerCase();
  return type === "application/pdf";
}

export async function parseStatementFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcelFile(file);
  }

  if (isSpreadsheetFile(file)) {
    return parseCsvFile(file);
  }

  throw new Error("Unsupported file type. Use .csv, .xlsx, or .xls");
}
