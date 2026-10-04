import { getCategoryMeta, normalizeCategoryName } from "../budget/category-meta.js";
import { monthLabel, resolveMonthKey, shiftMonth, transactionMonthKey } from "./period.js";

const money = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const totals = () => ({ income: 0, expenses: 0, incomeCount: 0, expenseCount: 0 });

function change(current, previous, previousLabel, lowerIsBetter = false) {
  if (current === previous) return { change: `No change vs ${previousLabel}`, positive: true };
  if (!previous) return { change: `New activity vs ${previousLabel}`, positive: lowerIsBetter ? current <= 0 : current >= 0 };
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  return { change: `${percent >= 0 ? "↑" : "↓"} ${Math.abs(percent).toFixed(1)}% vs ${previousLabel}`, positive: lowerIsBetter ? percent <= 0 : percent >= 0 };
}

export function computeDashboardOverview(transactions = [], budgetRows = [], requestedMonth, now = new Date()) {
  const selectedMonth = resolveMonthKey(requestedMonth, now);
  const label = monthLabel(selectedMonth);
  const previousKey = shiftMonth(selectedMonth, -1);
  const previousLabel = monthLabel(previousKey, true);
  const monthly = new Map();
  const expenses = new Map();
  const selectedTransactions = [];
  const availableMonths = new Set();
  let balance = 0;
  for (const tx of transactions) {
    const key = transactionMonthKey(tx.transaction_date);
    const amount = Math.abs(Number(tx.amount));
    if (!key || !Number.isFinite(amount) || !["income", "expense"].includes(tx.type)) continue;
    availableMonths.add(key);
    if (key > selectedMonth) continue;
    const row = monthly.get(key) || totals();
    row[tx.type === "income" ? "income" : "expenses"] += amount;
    row[tx.type === "income" ? "incomeCount" : "expenseCount"]++;
    monthly.set(key, row);
    balance += tx.type === "income" ? amount : -amount;
    if (key === selectedMonth) {
      selectedTransactions.push(tx);
      if (tx.type === "expense") {
        const category = normalizeCategoryName(tx.category);
        expenses.set(category, (expenses.get(category) || 0) + amount);
      }
    }
  }
  const selected = monthly.get(selectedMonth) || totals();
  const previous = monthly.get(previousKey) || totals();
  const savings = selected.income - selected.expenses;
  const count = selected.incomeCount + selected.expenseCount;
  const summary = { monthKey: selectedMonth, monthLabel: label, transactionCount: count, cards: [
    { title: "Total Income", amount: money(selected.income), ...change(selected.income, previous.income, previousLabel) },
    { title: "Total Expenses", amount: money(selected.expenses), ...change(selected.expenses, previous.expenses, previousLabel, true) },
    { title: "Total Savings", amount: money(savings), ...change(savings, previous.income - previous.expenses, previousLabel) },
    { title: "Recorded Balance", amount: money(balance), change: `Through ${monthLabel(selectedMonth, true)}`, neutral: true },
    { title: "Transactions", amount: String(count), change: `${selected.incomeCount} income · ${selected.expenseCount} expenses`, neutral: true },
  ] };

  const sixMonthStart = shiftMonth(selectedMonth, -5);
  const earliest = [...monthly.keys()].sort()[0] || sixMonthStart;
  const start = earliest < sixMonthStart ? earliest : sixMonthStart;
  const lineData = [];
  let runningBalance = 0;
  for (let key = start; key <= selectedMonth; key = shiftMonth(key, 1)) {
    const row = monthly.get(key) || totals();
    runningBalance += row.income - row.expenses;
    lineData.push({ month: monthLabel(key, true), monthKey: key, value: Math.round(runningBalance) });
  }
  const cashFlowRows = Array.from({ length: 6 }, (_, index) => {
    const key = shiftMonth(selectedMonth, index - 5);
    const row = monthly.get(key) || totals();
    return { month: monthLabel(key, true), monthKey: key, income: Math.round(row.income), expenses: Math.round(row.expenses), savings: Math.round(row.income - row.expenses), count: row.incomeCount + row.expenseCount };
  });
  const cashIncome = cashFlowRows.reduce((sum, row) => sum + row.income, 0);
  const cashExpenses = cashFlowRows.reduce((sum, row) => sum + row.expenses, 0);
  const categoryData = [...expenses].map(([key, amount]) => ({ name: getCategoryMeta(key).label, value: Math.round(amount), pct: selected.expenses ? Math.round(amount / selected.expenses * 1000) / 10 : 0 })).sort((a, b) => b.value - a.value);
  const limits = new Map(budgetRows.map((row) => [normalizeCategoryName(row.category), Math.max(0, Number(row.monthly_limit) || 0)]));
  const categories = [...new Set([...limits.keys(), ...expenses.keys()])].filter((key) => key !== "Income").map((key) => {
    const spent = Math.round(expenses.get(key) || 0);
    const budget = limits.has(key) ? limits.get(key) : null;
    return { key, name: getCategoryMeta(key).label, spent, budget, pct: budget > 0 ? Math.round(spent / budget * 100) : 0 };
  }).sort((a, b) => b.spent - a.spent);
  return {
    selectedMonth, monthLabel: label, availableMonths: [...availableMonths].sort(), summary,
    netWorth: { chart: { lineData, hasData: monthly.size > 0 }, recordedBalance: Math.round(balance), monthLabel: label },
    expenses: { data: categoryData, totalFormatted: money(selected.expenses), monthLabel: label, hasData: categoryData.length > 0 },
    cashFlow: { data: cashFlowRows, hasData: cashFlowRows.some((row) => row.count), averageIncome: money(cashIncome / 6), averageExpenses: money(cashExpenses / 6), averageSavings: money((cashIncome - cashExpenses) / 6), savingsRate: cashIncome ? `${((cashIncome - cashExpenses) / cashIncome * 100).toFixed(1)}%` : "—", rangeLabel: `${cashFlowRows[0].month} – ${cashFlowRows[5].month}` },
    budget: { categories, monthLabel: label },
    activity: { ...selected, savings, count, biggestCategory: categoryData[0]?.name || null },
    recentTransactions: selectedTransactions.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || String(b.id).localeCompare(String(a.id))).slice(0, 5).map((tx) => ({ name: tx.description || "Transaction", category: getCategoryMeta(normalizeCategoryName(tx.category)).label, amount: `${tx.type === "income" ? "+" : "−"}${money(Math.abs(Number(tx.amount)))}`, date: new Date(`${tx.transaction_date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" }), income: tx.type === "income", emoji: tx.type === "income" ? "↗" : "↙", bg: tx.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600" })),
  };
}
