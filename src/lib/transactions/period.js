import { transactionMonthKey } from "../dashboard/period.js";

export function transactionsForMonth(transactions = [], monthKey) {
  return transactions.filter((transaction) => transactionMonthKey(transaction.transaction_date) === monthKey);
}

export function transactionMonths(transactions = []) {
  return [...new Set(transactions.map((transaction) => transactionMonthKey(transaction.transaction_date)).filter(Boolean))].sort();
}
