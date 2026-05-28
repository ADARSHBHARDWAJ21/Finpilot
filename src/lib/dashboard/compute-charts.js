import { formatInr } from "@/lib/dashboard/compute-summary";
import { getCategoryMeta, normalizeCategoryName } from "@/lib/budget/category-meta";

const ASSET_COLORS = {
  investments: "#7B61FF",
  cash: "#10b981",
  others: "#06b6d4",
};

const LIABILITY_COLORS = {
  homeLoan: "#f87171",
  personalLoan: "#fb923c",
};

export const EXPENSE_CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#94a3b8",
];

function n(value) {
  return Number(value) || 0;
}

function txMonthKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthShort(key) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }).replace(" ", " '");
}

function section80cTotal(profile) {
  if (!profile) return 0;
  return (
    n(profile.elss_investments) +
    n(profile.ppf) +
    n(profile.epf) +
    n(profile.tax_saver_fd) +
    n(profile.life_insurance)
  );
}

function monthlyNetFromProfile(profile) {
  if (!profile) return 0;
  const income = n(profile.monthly_inhand_salary) || n(profile.annual_ctc) / 12;
  const spend =
    n(profile.monthly_food_spend) +
    n(profile.monthly_transport_spend) +
    n(profile.monthly_shopping_spend) +
    n(profile.emi_obligations) +
    n(profile.sip_amount);
  return Math.max(0, income - spend);
}

export function computeNetWorthChartData(transactions, profile) {
  const monthMap = {};

  for (const tx of transactions || []) {
    const mk = txMonthKey(tx.transaction_date);
    if (!mk) continue;
    if (!monthMap[mk]) monthMap[mk] = { income: 0, expense: 0 };
    const amt = Math.abs(n(tx.amount));
    if (tx.type === "income") monthMap[mk].income += amt;
    else if (tx.type === "expense") monthMap[mk].expense += amt;
  }

  const sortedKeys = Object.keys(monthMap).sort();
  let cumulative = 0;
  const lineData = sortedKeys.map((key) => {
    cumulative += monthMap[key].income - monthMap[key].expense;
    return {
      month: formatMonthShort(key),
      value: Math.round(cumulative),
      monthKey: key,
    };
  });

  const hasTransactions = lineData.length > 0;

  if (!hasTransactions) {
    const monthlyNet = monthlyNetFromProfile(profile);
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      lineData.push({
        month: formatMonthShort(key),
        value: Math.round(monthlyNet * (6 - i)),
        monthKey: key,
      });
    }
  }

  const display = lineData.slice(-6);
  const first = display[0]?.value ?? 0;
  const last = display[display.length - 1]?.value ?? 0;
  const growthPct = first > 0 ? ((last - first) / first) * 100 : last > 0 ? 100 : 0;

  const rangeLabel =
    display.length >= 2
      ? `${display[0].month} – ${display[display.length - 1].month}`
      : display[0]?.month ?? "No history yet";

  return {
    lineData: display,
    growthPct,
    rangeLabel,
    hasData: hasTransactions || monthlyNetFromProfile(profile) > 0,
    fromTransactions: hasTransactions,
  };
}

export function computeNetWorthBreakdown(transactions, profile) {
  let incomeAll = 0;
  let expenseAll = 0;

  for (const tx of transactions || []) {
    const amt = Math.abs(n(tx.amount));
    if (tx.type === "income") incomeAll += amt;
    else if (tx.type === "expense") expenseAll += amt;
  }

  const cashSavings = Math.max(0, Math.round(incomeAll - expenseAll));
  const investments = Math.round(
    section80cTotal(profile) + n(profile?.nps_contribution) + n(profile?.employer_nps)
  );
  const sipMonthly = n(profile?.sip_amount);
  const others = sipMonthly > 0 ? Math.round(sipMonthly * 36) : 0;

  const assets = [
    { label: "Investments", value: investments, color: ASSET_COLORS.investments },
    { label: "Cash & Savings", value: cashSavings, color: ASSET_COLORS.cash },
    ...(others > 0 ? [{ label: "Others", value: others, color: ASSET_COLORS.others }] : []),
  ].filter((item) => item.value > 0);

  const emi = n(profile?.emi_obligations);
  const estimatedOutstanding = emi > 0 ? Math.round(emi * 12 * 8) : 0;
  const liabilities = [];

  if (profile?.home_loan_active && estimatedOutstanding > 0) {
    liabilities.push({
      label: "Home Loan",
      value: Math.round(estimatedOutstanding * 0.75),
      color: LIABILITY_COLORS.homeLoan,
    });
    const personalShare = Math.round(estimatedOutstanding * 0.25);
    if (personalShare > 0) {
      liabilities.push({
        label: "Personal Loan",
        value: personalShare,
        color: LIABILITY_COLORS.personalLoan,
      });
    }
  } else if (estimatedOutstanding > 0) {
    liabilities.push({
      label: "EMI / Loans",
      value: estimatedOutstanding,
      color: LIABILITY_COLORS.personalLoan,
    });
  }

  const breakdownSegments = [
    ...assets.map((item) => ({ name: item.label, value: item.value, color: item.color })),
    ...liabilities.map((item) => ({ name: item.label, value: item.value, color: item.color })),
  ];

  return {
    assets: assets.map((item) => ({ ...item, valueFormatted: formatInr(item.value) })),
    liabilities: liabilities.map((item) => ({ ...item, valueFormatted: formatInr(item.value) })),
    breakdownSegments,
    hasData: breakdownSegments.length > 0,
  };
}

export function computeExpenseByCategory(transactions, selectedMonthKey) {
  const now = new Date();
  const currentKey =
    selectedMonthKey ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const map = {};
  for (const tx of transactions || []) {
    if (txMonthKey(tx.transaction_date) !== currentKey || tx.type !== "expense") continue;
    const cat = normalizeCategoryName(tx.category);
    map[cat] = (map[cat] || 0) + Math.abs(n(tx.amount));
  }

  const total = Object.values(map).reduce((sum, value) => sum + value, 0);
  const [year, month] = currentKey.split("-");
  const monthLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const data = Object.entries(map)
    .map(([key, value]) => {
      const meta = getCategoryMeta(key);
      const rounded = Math.round(value);
      return {
        name: meta.label,
        value: rounded,
        pct: total > 0 ? Math.round((rounded / total) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  return {
    data,
    total: Math.round(total),
    totalFormatted: formatInr(total),
    monthLabel,
    monthKey: currentKey,
    hasData: total > 0,
  };
}

export function computeDashboardCharts(transactions, profile) {
  return {
    netWorth: {
      chart: computeNetWorthChartData(transactions, profile),
      breakdown: computeNetWorthBreakdown(transactions, profile),
    },
    expenses: computeExpenseByCategory(transactions),
  };
}
