export const MAX_IMPORT_ROWS = 1000;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function excelSerialDate(serial, date1904 = false) {
  if (!Number.isFinite(serial) || serial < 0 || (!date1904 && Math.floor(serial) === 60)) return "";
  const epoch = date1904 ? Date.UTC(1904, 0, 1) : serial < 60 ? Date.UTC(1899, 11, 31) : Date.UTC(1899, 11, 30);
  const date = new Date(epoch + Math.floor(serial) * 86_400_000);
  return Number.isNaN(date.getTime()) ? "" : isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function isoDate(year, month, day) {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseTransactionDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : isoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  const text = String(value ?? "").trim();
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/);
  if (match) return isoDate(Number(match[1]), Number(match[2]), Number(match[3]));
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:\s.*)?$/);
  if (match) return isoDate(match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]), Number(match[2]), Number(match[1]));
  match = text.match(/^(\d{1,2})[- /]([A-Za-z]{3,9})[- /](\d{2}|\d{4})(?:\s.*)?$/);
  if (match) {
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
    return isoDate(match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]), month, Number(match[1]));
  }
  return "";
}

export function parseMoney(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  let text = String(value ?? "").trim();
  if (!text || /^(?:-|—|–|nil|n\/a)$/i.test(text)) return null;
  const negative = /^\(.*\)$/.test(text) || /(?:^\s*-|\bdr\.?\s*$)/i.test(text);
  text = text.replace(/(?:INR|Rs\.?|₹|\b(?:CR|DR)\.?)/gi, "").replace(/[,\s()]/g, "");
  if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  return Number.isFinite(amount) ? (negative ? -Math.abs(amount) : amount) : null;
}

export function parseDirection(value) {
  const text = String(value ?? "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (["income", "credit", "cr", "deposit", "in", "received", "receipt"].includes(text)) return "income";
  if (["expense", "debit", "dr", "withdrawal", "out", "paid", "payment"].includes(text)) return "expense";
  return "";
}

export function validateImportRow(input) {
  const issues = [];
  const date = parseTransactionDate(input?.transaction_date || input?.date);
  const description = String(input?.description ?? "").trim();
  const money = parseMoney(input?.amount);
  const type = parseDirection(input?.type);
  if (!date) issues.push("Enter a valid date");
  if (!description || description.length > 500) issues.push("Description must be 1–500 characters");
  if (money === null || Math.abs(money) < 0.01 || Math.abs(money) > 1_000_000_000) issues.push("Enter an amount from ₹0.01 to ₹100 crore");
  if (!type) issues.push("Choose income or expense");
  const category = String(input?.category || "Other").trim();
  const paymentMethod = String(input?.payment_method || "Bank").trim();
  if (!category || category.length > 80) issues.push("Category must be 1–80 characters");
  if (!paymentMethod || paymentMethod.length > 80) issues.push("Payment method must be 1–80 characters");
  return { issues, row: { transaction_date: date, description, amount: money === null ? "" : Math.round(Math.abs(money) * 100) / 100, type, category, payment_method: paymentMethod } };
}

export function transactionKey(row) {
  return JSON.stringify([row.transaction_date, row.type, Math.round(Number(row.amount) * 100), row.description.trim().replace(/\s+/g, " ").toLowerCase()]);
}

export function validateFile(file) {
  if (!file || !file.size) throw new Error("Choose a file that contains a bank statement.");
  if (file.size > MAX_FILE_BYTES) throw new Error("File is too large. Choose a file under 10 MB.");
}
