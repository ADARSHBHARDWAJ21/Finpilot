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

export function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function compareChange(current, previous, prevMonthLabel, { lowerIsBetter = false } = {}) {
  if (previous === 0 && current === 0) {
    return { text: `No change vs ${prevMonthLabel}`, positive: true };
  }
  if (previous === 0) {
    return {
      text: current > 0 ? `New vs ${prevMonthLabel}` : `— vs ${prevMonthLabel}`,
      positive: true,
    };
  }

  const pct = ((current - previous) / previous) * 100;
  const improved = lowerIsBetter ? pct <= 0 : pct >= 0;
  const arrow = pct >= 0 ? "↑" : "↓";

  return {
    text: `${arrow} ${Math.abs(pct).toFixed(1)}% vs ${prevMonthLabel}`,
    positive: improved,
  };
}

export function computeFinancialSummary(transactions) {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthLabel = formatMonthShort(prevKey);
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  let incomeCurrent = 0;
  let expenseCurrent = 0;
  let incomePrev = 0;
  let expensePrev = 0;
  let incomeAll = 0;
  let expenseAll = 0;

  for (const tx of transactions || []) {
    const mk = txMonthKey(tx.transaction_date);
    const amt = Math.abs(Number(tx.amount) || 0);

    if (tx.type === "income") {
      incomeAll += amt;
      if (mk === currentKey) incomeCurrent += amt;
      if (mk === prevKey) incomePrev += amt;
    } else if (tx.type === "expense") {
      expenseAll += amt;
      if (mk === currentKey) expenseCurrent += amt;
      if (mk === prevKey) expensePrev += amt;
    }
  }

  const savingsCurrent = incomeCurrent - expenseCurrent;
  const savingsPrev = incomePrev - expensePrev;
  const netWorth = incomeAll - expenseAll;
  const netWorthPrev = netWorth - savingsCurrent;

  return {
    monthLabel,
    cards: [
      {
        title: "Total Income",
        amount: formatInr(incomeCurrent),
        ...compareChange(incomeCurrent, incomePrev, prevMonthLabel),
      },
      {
        title: "Total Expenses",
        amount: formatInr(expenseCurrent),
        ...compareChange(expenseCurrent, expensePrev, prevMonthLabel, {
          lowerIsBetter: true,
        }),
      },
      {
        title: "Total Savings",
        amount: formatInr(savingsCurrent),
        ...compareChange(savingsCurrent, savingsPrev, prevMonthLabel),
      },
      {
        title: "Net Worth",
        amount: formatInr(netWorth),
        ...compareChange(netWorth, netWorthPrev, prevMonthLabel),
      },
      {
        title: "Tax Liability (Est.)",
        amount: "₹0",
        change: "Not calculated yet",
        positive: true,
        neutral: true,
      },
    ],
  };
}
