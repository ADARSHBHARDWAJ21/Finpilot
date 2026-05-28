function n(value) {
  return Number(value) || 0;
}

export function formatInr(value) {
  return `₹${Math.round(n(value)).toLocaleString("en-IN")}`;
}

export function emi(principal, annualRatePct, months) {
  const p = Math.max(0, n(principal));
  const r = Math.max(0, n(annualRatePct)) / 1200;
  const m = Math.max(1, Math.round(n(months)));
  if (p <= 0) return 0;
  if (r === 0) return Math.round(p / m);
  const factor = Math.pow(1 + r, m);
  return Math.round((p * r * factor) / (factor - 1));
}

export function monthsToDate(months, fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + Math.max(0, Math.round(months)));
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function affordabilityEngine(input) {
  const monthlyIncome =
    n(input.monthlyInHandSalary) + n(input.bonusIncome) / 12 + n(input.sideIncome);
  const monthlyExpenses =
    n(input.monthlyRent) +
    n(input.foodExpenses) +
    n(input.shoppingSpend) +
    n(input.transportationSpend) +
    n(input.sipInvestments) +
    n(input.familyObligations) +
    n(input.creditCardDebtEmi) +
    n(input.existingEmis);

  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);
  const loanAmount = Math.max(
    0,
    n(input.estimatedCost) - n(input.existingSavings) - n(input.downpayment)
  );
  const tenureMonths = Math.max(6, Math.round(n(input.loanDurationMonths) || 36));
  const interestRate = n(input.interestRatePct) || 10.5;
  const estimatedEmi = input.purchaseMode === "emi" ? emi(loanAmount, interestRate, tenureMonths) : 0;
  const totalEmiBurden = n(input.existingEmis) + estimatedEmi;

  const emiRatio = monthlyIncome > 0 ? totalEmiBurden / monthlyIncome : 1;
  const debtToIncome = monthlyIncome > 0 ? totalEmiBurden / monthlyIncome : 1;
  const savingsRate = monthlyIncome > 0 ? monthlySurplus / monthlyIncome : 0;

  const emergencyFund = n(input.emergencyFundAvailable);
  const emergencyMonthsAfterDownpayment =
    monthlyExpenses > 0 ? Math.max(0, (emergencyFund - n(input.downpayment)) / monthlyExpenses) : 0;

  const baseMonthlyNeed =
    input.purchaseMode === "emi" ? Math.max(0, totalEmiBurden + monthlyExpenses) : monthlyExpenses;
  const goalGap =
    input.purchaseMode === "emi"
      ? Math.max(0, n(input.downpayment) - n(input.existingSavings))
      : Math.max(0, n(input.estimatedCost) - n(input.existingSavings));
  const monthsToAfford = monthlySurplus > 0 ? Math.ceil(goalGap / monthlySurplus) : 999;

  let riskScore = 0;
  if (emiRatio > 0.4) riskScore += 35;
  else if (emiRatio > 0.35) riskScore += 20;
  if (savingsRate < 0.2) riskScore += 25;
  if (debtToIncome > 0.45) riskScore += 25;
  if (emergencyMonthsAfterDownpayment < 6) riskScore += 20;
  riskScore = Math.min(100, riskScore);

  const status = riskScore >= 60 ? "Risky" : riskScore >= 35 ? "Moderate" : "Safe";

  const totalInterest = Math.max(0, estimatedEmi * tenureMonths - loanAmount);
  const readinessDate = monthsToDate(monthsToAfford);

  return {
    monthlyIncome: Math.round(monthlyIncome),
    monthlyExpenses: Math.round(monthlyExpenses),
    monthlySurplus: Math.round(monthlySurplus),
    estimatedEmi: Math.round(estimatedEmi),
    totalInterest: Math.round(totalInterest),
    loanAmount: Math.round(loanAmount),
    emiRatio,
    debtToIncome,
    savingsRate,
    emergencyMonthsAfterDownpayment,
    monthsToAfford,
    readinessDate,
    riskScore,
    status,
    baseMonthlyNeed: Math.round(baseMonthlyNeed),
  };
}

export function buildWhatIfScenarios(baseInput) {
  const scenarios = [
    {
      id: "downpayment_up",
      label: "Increase downpayment by ₹50k",
      patch: { downpayment: n(baseInput.downpayment) + 50000 },
    },
    {
      id: "extend_tenure",
      label: "Extend tenure by 12 months",
      patch: { loanDurationMonths: n(baseInput.loanDurationMonths || 36) + 12 },
    },
    {
      id: "salary_up",
      label: "Increase salary by 10%",
      patch: { monthlyInHandSalary: Math.round(n(baseInput.monthlyInHandSalary) * 1.1) },
    },
    {
      id: "shop_down",
      label: "Reduce shopping by ₹5k/month",
      patch: { shoppingSpend: Math.max(0, n(baseInput.shoppingSpend) - 5000) },
    },
    {
      id: "side_income_up",
      label: "Increase side income by ₹10k/month",
      patch: { sideIncome: n(baseInput.sideIncome) + 10000 },
    },
  ];

  return scenarios.map((s) => {
    const result = affordabilityEngine({ ...baseInput, ...s.patch });
    return { ...s, result };
  });
}

export function goalHealthScore(goal) {
  const progress = goal.targetAmount > 0 ? (goal.currentSaved / goal.targetAmount) * 100 : 0;
  const affordability = goal.affordabilityStatus === "Safe" ? 35 : goal.affordabilityStatus === "Moderate" ? 20 : 5;
  const riskDeduction = Math.min(30, Math.round((goal.riskScore || 0) / 3));
  return Math.max(0, Math.min(100, Math.round(progress * 0.5 + affordability - riskDeduction + 20)));
}

export function buildCalendarEntries(goal, simulation) {
  const entries = [];
  const createdAt = new Date().toISOString();
  entries.push({
    goalId: goal.id,
    type: "milestone",
    title: `${goal.name} target review`,
    dueDate: goal.targetDate,
    createdAt,
  });
  entries.push({
    goalId: goal.id,
    type: "quarterly_review",
    title: `${goal.name} quarterly progress review`,
    dueDate: monthsToDate(3),
    createdAt,
  });

  if (goal.purchaseMode === "emi") {
    for (let i = 1; i <= goal.loanDurationMonths; i += 1) {
      entries.push({
        goalId: goal.id,
        type: "emi",
        title: `${goal.name} EMI #${i}`,
        dueDate: monthsToDate(i),
        amount: simulation.estimatedEmi,
        createdAt,
      });
    }
  }

  return entries;
}

