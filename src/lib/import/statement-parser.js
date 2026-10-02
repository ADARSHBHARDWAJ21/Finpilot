import { parseDirection, parseMoney, parseTransactionDate, MAX_IMPORT_ROWS } from "./transaction-values.js";
import { applyCategoryRules } from "../bank-parsers/category-rules.js";

const ALIASES = {
  date: ["transaction_date", "txn_date", "tran_date", "trans_date", "date", "transaction_date_time", "transaction_date_and_time", "txn_date_time", "booking_date", "posting_date", "posted", "value_date", "payment_date"],
  description: ["description", "narration", "particulars", "particular", "details", "memo", "transaction_details", "transaction_description", "txn_description", "transaction_particulars", "transaction_narration", "narration_remarks", "remarks", "payee", "name"],
  amount: ["amount", "transaction_amount", "txn_amount", "amt", "value"],
  debit: ["debit", "debit_amount", "debit_amt", "amount_debited", "withdrawal", "withdrawals", "withdrawal_amount", "withdrawal_amt", "dr", "paid_out", "withdrawals_dr", "withdrawal_dr"],
  credit: ["credit", "credit_amount", "credit_amt", "amount_credited", "deposit", "deposits", "deposit_amount", "deposit_amt", "cr", "paid_in", "deposits_cr", "deposit_cr"],
  type: ["type", "transaction_type", "dr_cr", "debit_credit", "cr_dr", "category_type", "debit_credit_indicator"],
  category: ["category", "transaction_category", "merchant_category", "cat"],
  payment_method: ["payment_method", "mode", "payment_mode", "channel", "payment_type"],
  currency: ["currency", "currency_code"],
  balance: ["balance", "closing_balance", "running_balance", "available_balance", "balance_amount", "bal"],
  reference: ["reference", "ref_no", "reference_no", "reference_number", "chq_ref_no", "chq_no", "chq_number", "cheque_no", "cheque_number", "instrument_no", "instrument_number", "instr_no", "ref_no_cheque_no", "cheque_no_reference_no"],
};

export function inferPaymentMethod(description) {
  if (/\bUPI\b/i.test(description)) return "UPI";
  if (/\b(?:IMPS|NEFT|RTGS|NET\s*BANKING)\b/i.test(description)) return "Net Banking";
  if (/\b(?:ATM|CASH)\b/i.test(description)) return "Cash";
  if (/\b(?:POS|CARD)\b/i.test(description)) return "Debit Card";
  return "Bank";
}

export function completeStatementRows(rows, { openingBalance = null, includeBalances = false } = {}) {
  let order = 0;
  for (let index = 1; index < rows.length; index++) {
    if (rows[index].transaction_date !== rows[index - 1].transaction_date) { order = rows[index].transaction_date > rows[index - 1].transaction_date ? 1 : -1; break; }
  }
  const baselineFor = (index, direction) => direction === 1 ? (index === 0 ? openingBalance : rows[index - 1]._balance) : (index === rows.length - 1 ? openingBalance : rows[index + 1]._balance);
  // For same-day entries, infer order only when the amounts and balances agree.
  if (!order) {
    const fits = (direction) => {
      let checked = 0;
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index], baseline = baselineFor(index, direction);
        if (row._balance === null || baseline === null || !row.amount) continue;
        const change = row._balance - baseline;
        if (Math.abs(Math.abs(change) - row.amount) >= 0.005 || (row.type && row.type !== (change > 0 ? "income" : "expense"))) return false;
        checked++;
      }
      return checked > 0;
    };
    const ascending = fits(1), descending = fits(-1);
    if (ascending !== descending) order = ascending ? 1 : -1;
    else if (rows.length === 1 && openingBalance !== null) order = 1;
  }
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!row.type && row._balance !== null && row.amount) {
      const baseline = order ? baselineFor(index, order) : null;
      const difference = baseline === null ? null : row._balance - baseline;
      if (difference !== null && Math.abs(Math.abs(difference) - row.amount) < 0.005) row.type = difference > 0 ? "income" : "expense";
    }
    row.category = applyCategoryRules(row.description, row.category || "Other");
    if (row.type === "income" && row.category === "Other") row.category = "Income";
    if (!row.payment_method || row.payment_method === "Bank") row.payment_method = inferPaymentMethod(row.description);
  }
  return includeBalances ? rows : rows.map(({ _balance: ignoredBalance, _sourcePage: ignoredPage, ...row }) => row);
}

export function normalizeHeader(value) {
  return String(value ?? "").trim().toLowerCase().replace(/(?:\b(?:inr|rs|rupees)\b|₹)/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function identifyColumns(cells) {
  const headers = cells.map(normalizeHeader);
  const columns = {};
  for (const [field, aliases] of Object.entries(ALIASES)) {
    columns[field] = -1;
    for (const alias of aliases) {
      const index = headers.findIndex((header) => header === alias || header.replace(/_/g, "") === alias.replace(/_/g, ""));
      if (index >= 0) { columns[field] = index; break; }
    }
  }
  return columns;
}

export function isStatementHeader(columns) {
  return columns.date >= 0 && columns.description >= 0 && (columns.amount >= 0 || columns.debit >= 0 || columns.credit >= 0);
}

function mapStatementRow(cells, columns) {
  const field = (name) => columns[name] >= 0 ? cells[columns[name]] ?? "" : "";
  const debit = parseMoney(field("debit"));
  const credit = parseMoney(field("credit"));
  const rawAmount = field("amount");
  let amount = parseMoney(rawAmount);
  let type = parseDirection(field("type"));
  if (columns.debit >= 0 || columns.credit >= 0) {
    const outgoing = debit === null ? 0 : Math.abs(debit);
    const incoming = credit === null ? 0 : Math.abs(credit);
    if (outgoing > 0 && incoming === 0) { amount = outgoing; type = "expense"; }
    else if (incoming > 0 && outgoing === 0) { amount = incoming; type = "income"; }
    else if (outgoing > 0 || incoming > 0 || amount === null) { amount = null; type = ""; }
  }
  if (!type && amount !== null) {
    if (amount < 0 || /^\s*\(/.test(String(rawAmount)) || /\bdr\.?\s*$/i.test(String(rawAmount))) type = "expense";
    else if (/^\s*\+|\bcr\.?\s*$/i.test(String(rawAmount))) type = "income";
  }
  const description = String(field("description")).trim();
  const currency = String(field("currency")).trim();
  if (currency && !/^(?:inr|rs\.?|₹)$/i.test(currency)) amount = null;
  return { transaction_date: parseTransactionDate(field("date")) || String(field("date")).trim(), description, amount: amount === null ? "" : Math.abs(amount), type, category: applyCategoryRules(description, String(field("category")).trim() || (type === "income" ? "Income" : "Other")), payment_method: String(field("payment_method")).trim() || inferPaymentMethod(description), _balance: parseMoney(field("balance")) };
}

export function parseStatementMatrix(matrix, { includeBalances = false, openingBalance: startingBalance = null } = {}) {
  const headerIndex = matrix.slice(0, 60).findIndex((cells) => Array.isArray(cells) && isStatementHeader(identifyColumns(cells)));
  if (headerIndex < 0) throw new Error("Could not find transaction columns. Use Date, Description, and Amount with Type, or separate Debit and Credit columns.");
  const columns = identifyColumns(matrix[headerIndex]);
  const transactions = [];
  let openingBalance = startingBalance;
  for (const cells of matrix.slice(0, headerIndex)) {
    if (cells.some((value) => /^\s*(?:opening\s+balance|balance\s+brought\s+forward)\b/i.test(String(value)))) {
      openingBalance = cells.map(parseMoney).filter((value) => value !== null).at(-1) ?? openingBalance;
    }
  }
  for (const cells of matrix.slice(headerIndex + 1)) {
    if (!Array.isArray(cells) || !cells.some((cell) => String(cell ?? "").trim())) continue;
    if (isStatementHeader(identifyColumns(cells))) continue;
    const rawDate = cells[columns.date];
    const description = String(cells[columns.description] ?? "").trim();
    if (/^(?:opening|closing|available|brought forward|carried forward|total)\b/i.test(description) && /balance|total/i.test(description)) {
      if (/opening|brought forward/i.test(description) && !transactions.length) openingBalance = parseMoney(cells[columns.balance]) ?? cells.map(parseMoney).filter((value) => value !== null).at(-1) ?? openingBalance;
      continue;
    }
    if (!String(rawDate ?? "").trim() && !description) continue;
    if (!String(rawDate ?? "").trim() && ![columns.amount, columns.debit, columns.credit].some((index) => index >= 0 && String(cells[index] ?? "").trim())) {
      if (transactions.length && description) transactions.at(-1).description += ` ${description}`;
      continue;
    }
    transactions.push(mapStatementRow(cells, columns));
    if (transactions.length > MAX_IMPORT_ROWS) throw new Error("This statement has more than 1,000 rows. Split it into smaller files.");
  }
  if (!transactions.length) throw new Error("The file has column headers but no transaction rows.");
  return { transactions: completeStatementRows(transactions, { openingBalance, includeBalances }), warnings: [], ...(includeBalances ? { openingBalance } : {}) };
}

const DATE_START = /^(?:\d+[.)]?\s+)?(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.](?:\d{4}|\d{2})|\d{1,2}[- /][A-Za-z]{3,9}[- /](?:\d{4}|\d{2}))\b\s*/;
const normalizeLineDate = (line) => line.replace(/^(\d{1,4})\s*([/.-])\s*(\d{1,2})\s*\2\s*(\d{2,4})/, (_, first, separator, middle, last) => `${first}${separator}${middle}${separator}${last}`);

export function countStatementDateRows(text) {
  return String(text).split(/\r?\n/).filter((line) => DATE_START.test(normalizeLineDate(line.trim()))).length;
}

export function parseStatementText(text, { includeBalances = false, openingBalance: startingBalance = null } = {}) {
  const lines = String(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const matrix = lines.map((line) => line.split(/\t|\s{2,}/));
  const headerIndex = matrix.findIndex((cells) => isStatementHeader(identifyColumns(cells)));
  if (headerIndex >= 0) {
    const columns = identifyColumns(matrix[headerIndex]);
    const dated = matrix.slice(headerIndex + 1).filter((cells) => DATE_START.test(String(cells[columns.date] || "")));
    if (dated.length && dated.every((cells) => cells.length === matrix[headerIndex].length)) return parseStatementMatrix(matrix, { includeBalances, openingBalance: startingBalance });
  }
  const transactions = [];
  const hasBalanceColumn = /\b(?:balance|bal\.)\b/i.test(lines.join(" "));
  const hasDebitCredit = /\b(?:debit|withdrawal)\b/i.test(lines.join(" ")) && /\b(?:credit|deposit)\b/i.test(lines.join(" "));
  const records = [];
  for (const original of lines) {
    const line = normalizeLineDate(original);
    if (DATE_START.test(line)) records.push(line);
    else if (records.length && !/^(?:page\b|--\s*\d|opening\b|closing\b|total\b|balance\s+(?:brought|carried)|branch\b|account\b|ifsc\b|statement\b|date\b|txn\s+date\b|generated\b|for\s+(?:any|queries)|this\s+is\b|www\.|https?:)/i.test(line)) records[records.length - 1] += ` ${line}`;
  }
  for (const line of records) {
    const dateMatch = line.match(DATE_START);
    if (!dateMatch || !parseTransactionDate(dateMatch[1])) continue;
    let rest = line.slice(dateMatch[0].length).replace(DATE_START, "");
    const moneyMatches = [...rest.matchAll(/(?:^|\s)([+-]?\(?\d[\d,]*\.\d{2}\)?(?:\s*(?:CR|DR))?)(?=\s|$)/gi)];
    const lastMoney = moneyMatches.at(-1);
    const candidates = hasBalanceColumn && moneyMatches.length > 1 ? moneyMatches.slice(0, -1) : moneyMatches;
    const nonzero = candidates.filter((match) => parseMoney(match[1]) !== null && parseMoney(match[1]) !== 0);
    const transactionMoney = hasDebitCredit && candidates.length === 2 ? (nonzero.length === 1 ? nonzero[0] : null) : candidates.at(-1);
    const amountText = transactionMoney?.[1] || "";
    const amount = parseMoney(amountText);
    const firstMoney = moneyMatches[0];
    const description = (firstMoney ? rest.slice(0, firstMoney.index) : rest).trim();
    if (/^(?:opening|closing|brought forward|carried forward)\b.*balance/i.test(description)) continue;
    let type = /\bdr\b|^\s*[-(]/i.test(amountText) ? "expense" : /\bcr\b|^\s*\+/i.test(amountText) ? "income" : "";
    const marker = (firstMoney ? rest.slice(0, firstMoney.index) : "").match(/\b(DEBIT|CREDIT|DR|CR)\s*$/i)?.[1];
    if (!type && marker) type = parseDirection(marker);
    if (!type && hasDebitCredit && candidates.length === 2 && nonzero.length === 1) type = nonzero[0] === candidates[0] ? "expense" : "income";
    transactions.push({ transaction_date: parseTransactionDate(dateMatch[1]), description, amount: amount === null ? "" : Math.abs(amount), type, category: applyCategoryRules(description, type === "income" ? "Income" : "Other"), payment_method: "Bank", _balance: hasBalanceColumn && moneyMatches.length > 1 ? parseMoney(lastMoney[1]) : null });
    if (transactions.length > MAX_IMPORT_ROWS) throw new Error("This statement has more than 1,000 rows. Split it into smaller files.");
  }
  const openingLine = lines.find((line) => /^(?:opening\s+balance|balance\s+brought\s+forward)\b/i.test(line));
  const openingBalance = openingLine ? parseMoney(openingLine.match(/[+-]?\d[\d,]*\.\d{2}(?:\s*(?:CR|DR))?\s*$/i)?.[0]) : startingBalance;
  return { transactions: completeStatementRows(transactions, { openingBalance, includeBalances }), warnings: [], ...(includeBalances ? { openingBalance } : {}) };
}
