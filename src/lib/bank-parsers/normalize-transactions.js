import { detectCategory } from "./category-rules.js";

export function normalizeTransactions(transactions) {
  return transactions.map((tx) => ({
    transaction_date: formatDate(tx.date),
    description: tx.description || "Unknown",
    amount: Math.abs(Number(tx.amount)),
    type: Number(tx.amount) > 0 ? "income" : "expense",
    category: detectCategory(tx.description, Number(tx.amount) > 0 ? "income" : "expense"),
    payment_method: "Bank",
  }));
}

function formatDate(date) {
  if (!date) return "";

  const text = String(date).trim();

  if (text.includes("/")) {
    const parts = text.split("/");
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }

  if (text.includes("-")) {
    const parts = text.split("-");
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }

  return text;
}
