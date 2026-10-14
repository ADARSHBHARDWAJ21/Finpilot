import {
  DEFAULT_CATEGORY_KEYS,
  getCategoryMeta,
  normalizeCategoryName,
} from "./category-meta.js";
import { currentMonthKey, monthLabel, shiftMonth, transactionMonthKey } from "../dashboard/period.js";

const roundMoney = (amount) => Math.round(amount * 100) / 100;

function defaultBudgetForSpent(spent) {
  if (spent <= 0) return 5000;
  return Math.ceil((spent * 1.25) / 500) * 500;
}

export function getStatusMeta(pct) {
  if (pct > 100) {
    return {
      status: "Over Budget",
      statusStyle: "bg-red-50 text-red-700",
      barColor: "bg-red-500",
    };
  }
  if (pct >= 85) {
    return {
      status: "Near Limit",
      statusStyle: "bg-orange-50 text-orange-600",
      barColor: "bg-orange-500",
    };
  }
  return {
    status: "On Track",
    statusStyle: "bg-emerald-50 text-emerald-700",
    barColor: "bg-emerald-500",
  };
}

function computeHealthScore(totalBudget, totalSpent, categories) {
  if (totalBudget <= 0) return 50;
  const usage = totalSpent / totalBudget;
  let score = 100;
  if (usage > 1) score -= Math.min(40, (usage - 1) * 100);
  else if (usage > 0.9) score -= 15;
  else if (usage > 0.75) score -= 5;

  const overCount = categories.filter((c) => c.pct > 100).length;
  score -= overCount * 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function healthLabel(score) {
  if (score >= 75) return { text: "Good. You're on track!", className: "text-emerald-600" };
  if (score >= 50) return { text: "Fair. Watch overspending.", className: "text-amber-600" };
  return { text: "Needs attention this month.", className: "text-red-600" };
}

export function computeBudgetDashboard(transactions, budgetPlan, selectedMonthKey) {
  const currentKey = selectedMonthKey || currentMonthKey();

  const spentByCategory = Object.create(null);
  const incomeByMonth = Object.create(null);
  const spentByMonth = Object.create(null);

  for (const tx of transactions || []) {
    const mk = transactionMonthKey(tx.transaction_date);
    if (!mk) continue;

    const amount = Math.abs(Number(tx.amount));
    if (!Number.isFinite(amount)) continue;
    const cat = normalizeCategoryName(tx.category);

    if (tx.type === "expense") {
      spentByCategory[mk] = spentByCategory[mk] || Object.create(null);
      spentByCategory[mk][cat] = (spentByCategory[mk][cat] || 0) + amount;
      spentByMonth[mk] = (spentByMonth[mk] || 0) + amount;
    } else if (tx.type === "income") {
      incomeByMonth[mk] = (incomeByMonth[mk] || 0) + amount;
    }
  }

  const monthSpentMap = spentByCategory[currentKey] || Object.create(null);
  const savedCategoryBudgets = budgetPlan?.category_budgets || {};

  const categoryKeys = new Set(budgetPlan?.categories_managed
    ? Object.keys(savedCategoryBudgets)
    : [...DEFAULT_CATEGORY_KEYS, ...Object.keys(monthSpentMap), ...Object.keys(savedCategoryBudgets)]);

  const categories = Array.from(categoryKeys)
    .filter((k) => k !== "Income")
    .map((key) => {
      const spent = roundMoney(monthSpentMap[key] || 0);
      const savedLimit = Object.hasOwn(savedCategoryBudgets, key) ? Number(savedCategoryBudgets[key]) : null;
      const budget = Number.isFinite(savedLimit) && savedLimit >= 0 ? roundMoney(savedLimit) : defaultBudgetForSpent(spent);
      const pct = budget > 0 ? Math.round((spent / budget) * 100) : spent > 0 ? 100 : 0;
      const meta = getCategoryMeta(key);
      const statusMeta = getStatusMeta(budget === 0 && spent > 0 ? 101 : pct);

      return {
        key,
        name: meta.label,
        iconKey: meta.iconKey,
        iconBg: meta.iconBg,
        iconColor: meta.iconColor,
        budget,
        spent,
        remaining: roundMoney(budget - spent),
        pct,
        ...statusMeta,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  // Removing a budget category never removes its recorded expense.
  const totalSpent = roundMoney(spentByMonth[currentKey] || 0);
  const unbudgetedSpent = roundMoney(Object.entries(monthSpentMap).reduce((sum, [key, amount]) => sum + (categoryKeys.has(key) && key !== "Income" ? 0 : amount), 0));
  const savedTotal = budgetPlan ? Number(budgetPlan.total_budget) : NaN;
  const totalBudget = Number.isFinite(savedTotal) && savedTotal >= 0
    ? roundMoney(savedTotal)
    : roundMoney(categories.reduce((sum, category) => sum + category.budget, 0));

  const remaining = roundMoney(totalBudget - totalSpent);
  const spentPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

  const monthIncome = incomeByMonth[currentKey] || 0;
  const savings = Math.max(0, monthIncome - totalSpent);

  const monthKeys = Array.from({ length: 12 }, (_, index) => shiftMonth(currentKey, index - 11));

  const spendingTrend = monthKeys.map((mk) => ({
    month: monthLabel(mk, true),
    monthKey: mk,
    actual: Math.round(spentByMonth[mk] || 0),
    budget: totalBudget,
  }));

  const overspentCategories = categories
    .filter((c) => c.pct >= 75 && c.budget > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)
    .map((c) => ({ name: c.name, pct: c.pct }));

  const healthScore = computeHealthScore(totalBudget, totalSpent, categories);
  const health = healthLabel(healthScore);

  const incomeMonths = Object.keys(incomeByMonth).length || 1;
  const avgMonthlySavings =
    Object.values(incomeByMonth).reduce((a, b) => a + b, 0) / incomeMonths -
    Object.values(spentByMonth).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(spentByMonth).length);

  const topOverspent = categories.find((c) => c.pct >= 85);
  const tip = topOverspent
    ? `You can save ₹${Math.round(topOverspent.spent * 0.1).toLocaleString("en-IN")} by reducing ${topOverspent.name} expenses by 10% this month.`
    : totalSpent > 0
      ? "You're staying within budget across categories. Keep it up!"
      : "Add expenses via Add Expense to see budget insights from your real data.";

  const availableMonths = [
    ...new Set(
      (transactions || [])
        .map((t) => transactionMonthKey(t.transaction_date))
        .filter(Boolean)
    ),
  ].sort((a, b) => b.localeCompare(a));

  if (!availableMonths.includes(currentKey)) {
    availableMonths.unshift(currentKey);
  }

  return {
    monthKey: currentKey,
    monthLabel: monthLabel(currentKey),
    availableMonths,
    totalBudget,
    totalSpent,
    unbudgetedSpent,
    remaining,
    spentPct,
    monthIncome,
    savings,
    avgMonthlySavings: Math.max(0, Math.round(avgMonthlySavings)),
    savingsGoal: Number(budgetPlan?.savings_goal) || 0,
    categories,
    spendingTrend,
    overspentCategories,
    healthScore,
    health,
    tip,
    donutData: [
      { name: "Spent", value: totalSpent, color: "#6366f1" },
      { name: "Remaining", value: Math.max(0, remaining), color: "#22c55e" },
    ],
    hasTransactions: (transactions || []).length > 0,
  };
}

export function buildReportCsv(dashboard) {
  const lines = [
    `Budget Report - ${dashboard.monthLabel}`,
    "",
    "Summary",
    `Total Budget,${dashboard.totalBudget}`,
    `Total Spent,${dashboard.totalSpent}`,
    `Remaining,${dashboard.remaining}`,
    `Health Score,${dashboard.healthScore}`,
    "",
    "Category,Budget,Spent,Remaining,Percent,Status",
  ];

  for (const c of dashboard.categories) {
    lines.push(
      `"${c.name.replace(/"/g, '""')}",${c.budget},${c.spent},${c.remaining},${c.pct}%,"${c.status}"`
    );
  }

  return lines.join("\n");
}
