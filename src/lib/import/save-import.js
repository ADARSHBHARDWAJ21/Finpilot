import { MAX_IMPORT_ROWS, validateImportRow, transactionKey } from "./transaction-values.js";
import { applyCategoryRules } from "../bank-parsers/category-rules.js";

const locks = new Map();

async function withAccountLock(userId, callback) {
  const previous = locks.get(userId) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  locks.set(userId, current);
  await previous;
  try { return await callback(); }
  finally { release(); if (locks.get(userId) === current) locks.delete(userId); }
}

export function normalizeImportRows(transactions, userId) {
  if (!Array.isArray(transactions) || !transactions.length || transactions.length > MAX_IMPORT_ROWS) throw new Error("Select between 1 and 1,000 transactions to import.");
  return transactions.map((input, index) => {
    const { row, issues } = validateImportRow(input);
    if (issues.length) throw new Error(`Row ${index + 1}: ${issues.join(". ")}. Please correct it before saving.`);
    return { ...row, user_id: userId, category: applyCategoryRules(row.description, row.category) };
  });
}

export function removeExistingTransactions(rows, existing) {
  const counts = new Map();
  for (const row of existing) {
    const key = transactionKey(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const toInsert = [];
  let skipped = 0;
  for (const row of rows) {
    const key = transactionKey(row);
    const count = counts.get(key) || 0;
    if (count > 0) { counts.set(key, count - 1); skipped++; }
    else toInsert.push(row);
  }
  return { toInsert, skipped };
}

export async function saveImportedTransactions(supabase, userId, transactions) {
  const rows = normalizeImportRows(transactions, userId);
  return withAccountLock(userId, async () => {
    const dates = [...new Set(rows.map((row) => row.transaction_date))].sort();
    const existing = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await supabase.from("transactions").select("transaction_date,description,amount,type").eq("user_id", userId).gte("transaction_date", dates[0]).lte("transaction_date", dates.at(-1)).order("id", { ascending: true }).range(offset, offset + 999);
      if (result.error) throw new Error("Could not check existing transactions. Nothing was imported. Please retry.");
      existing.push(...(result.data || []));
      if ((result.data || []).length < 1000) break;
      if (offset >= 99_000) throw new Error("Too many existing transactions to compare. Import a shorter date range.");
    }
    const { toInsert, skipped } = removeExistingTransactions(rows, existing);
    if (!toInsert.length) return { count: 0, skipped, transactions: [], message: "These transactions are already in your account." };
    const result = await supabase.from("transactions").insert(toInsert).select("*");
    if (result.error) throw new Error("Could not save the import. Refresh your connection and retry; existing rows will be checked again.");
    return { count: result.data?.length || toInsert.length, skipped, transactions: result.data || [] };
  });
}
