import { monthLabel, resolveMonthKey, shiftMonth, transactionMonthKey } from "./period.js";

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
      positive: lowerIsBetter ? current <= 0 : current >= 0,
    };
  }

  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const improved = lowerIsBetter ? pct <= 0 : pct >= 0;
  const arrow = pct >= 0 ? "↑" : "↓";

  return {
    text: `${arrow} ${Math.abs(pct).toFixed(1)}% vs ${prevMonthLabel}`,
    positive: improved,
  };
}

export function computeFinancialSummary(transactions, requestedMonth, now = new Date()) {
  const currentKey = resolveMonthKey(requestedMonth, now);
  const prevKey = shiftMonth(currentKey, -1);
  const prevMonthLabel = monthLabel(prevKey, true);

  let incomeCurrent = 0;
  let expenseCurrent = 0;
  let incomePrev = 0;
  let expensePrev = 0;

  for (const tx of transactions || []) {
    const mk = transactionMonthKey(tx.transaction_date);
    const amt = Math.abs(Number(tx.amount));
    if (!mk || !Number.isFinite(amt)) continue;

    if (tx.type === "income") {
      if (mk === currentKey) incomeCurrent += amt;
      if (mk === prevKey) incomePrev += amt;
    } else if (tx.type === "expense") {
      if (mk === currentKey) expenseCurrent += amt;
      if (mk === prevKey) expensePrev += amt;
    }
  }

  const savingsCurrent = incomeCurrent - expenseCurrent;
  const savingsPrev = incomePrev - expensePrev;

  return {
    monthKey: currentKey,
    monthLabel: monthLabel(currentKey),
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
        title: "Monthly Balance",
        amount: formatInr(savingsCurrent),
        ...compareChange(savingsCurrent, savingsPrev, prevMonthLabel),
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
