function n(value) {
  return Number(value) || 0;
}

function formatInr(value) {
  return `₹${Math.round(n(value)).toLocaleString("en-IN")}`;
}

function formatDateLabel(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fyMonths(financialYear) {
  const [start] = String(financialYear || "2024-25").split("-");
  const y = Number(start);
  const months = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(y, 3 + i, 1);
    months.push({
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }).replace(" ", " '"),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return months;
}

function surchargeRate(annualIncome) {
  if (annualIncome > 50000000) return 0.37;
  if (annualIncome > 20000000) return 0.25;
  if (annualIncome > 10000000) return 0.15;
  if (annualIncome > 5000000) return 0.1;
  return 0;
}

function getInitials(name) {
  const parts = String(name || "User")
    .split(" ")
    .filter(Boolean);
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function totalByKey(list, key) {
  return (list ?? [])
    .filter((d) => d.key === key)
    .reduce((sum, d) => sum + n(d.amount), 0);
}

export function buildReportsData(taxContext, transactions) {
  const annualIncome = n(taxContext.annualCtc);
  const annualTds = Math.round(
    (n(taxContext.salaryProfile?.monthly_tds) || n(taxContext.onboardingProfile?.monthly_tds)) * 12
  );
  const estimatedTax = Math.round(n(taxContext.estimatedTax));
  const expectedRefund = Math.max(0, annualTds - estimatedTax);

  const util = taxContext.deductionUtilization ?? [];
  const deductionClaimed = util.reduce((sum, d) => sum + n(d.used), 0) + n(taxContext.hraExemption);
  const deductionEligible =
    util.reduce((sum, d) => sum + n(d.limit), 0) + (n(taxContext.hraExemption) > 0 ? n(taxContext.hraExemption) : 120000);
  const deductionPct =
    deductionEligible > 0 ? Math.min(100, Math.round((deductionClaimed / deductionEligible) * 100)) : 0;

  const grossIncome = Math.max(0, annualIncome - deductionClaimed);

  const sRate = surchargeRate(annualIncome);
  const baseIncomeTax = estimatedTax > 0 ? estimatedTax / ((1 + sRate) * 1.04) : 0;
  const surcharge = baseIncomeTax * sRate;
  const cess = (baseIncomeTax + surcharge) * 0.04;

  const taxBreakdown = [
    { name: "Income Tax", value: Math.round(baseIncomeTax), color: "#6366f1" },
    { name: "Surcharge", value: Math.round(surcharge), color: "#a78bfa" },
    { name: "Health & Education Cess", value: Math.round(cess), color: "#c4b5fd" },
  ].map((item) => ({
    ...item,
    pct: estimatedTax > 0 ? Math.round((item.value / estimatedTax) * 1000) / 10 : 0,
  }));

  const monthlyLiability = Math.round(estimatedTax / 12);
  const monthlyTds = Math.round(annualTds / 12);
  let cumulativeDiff = 0;
  const monthlyData = fyMonths(taxContext.financialYear).map((m) => {
    cumulativeDiff += monthlyTds - monthlyLiability;
    return {
      month: m.label,
      liability: monthlyLiability,
      tds: monthlyTds,
      refund: cumulativeDiff,
    };
  });

  const latestDate =
    transactions?.[0]?.transaction_date ||
    transactions?.[transactions.length - 1]?.transaction_date ||
    new Date().toISOString();
  const generatedOn = formatDateLabel(latestDate);

  const section80cUsed = Math.max(totalByKey(taxContext.deductions, "80C"), n(taxContext.onboardingProfile?.elss_investments));
  const section80cRemaining = Math.max(0, 150000 - section80cUsed);
  const npsUsed = totalByKey(taxContext.deductions, "80CCD_1B") + n(taxContext.onboardingProfile?.nps_contribution);
  const npsRemaining = Math.max(0, 50000 - npsUsed);
  const hraUnused = taxContext.payingRent ? Math.max(0, n(taxContext.rentMonthly) * 12 - n(taxContext.hraExemption)) : 0;

  const highlights = [
    {
      text:
        taxContext.liveCompare.savings > 0
          ? `You save ${formatInr(taxContext.liveCompare.savings)} with ${String(taxContext.liveCompare.recommended).toUpperCase()} regime.`
          : "Upload salary details to compute regime savings.",
      iconKey: "trend",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      text: `80C limit: ${formatInr(section80cRemaining)} still available to invest.`,
      iconKey: "bars",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      text: `NPS (80CCD) can unlock up to ${formatInr(Math.round(npsRemaining * 0.3))} more tax savings.`,
      iconKey: "shield",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      text:
        hraUnused > 0
          ? `HRA exemption may be underutilized by ${formatInr(hraUnused)}.`
          : "HRA exemption is optimized based on your current rent details.",
      iconKey: "target",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return {
    header: {
      financialYear: taxContext.financialYear,
      alertsCount: highlights.filter((h) => h.text.includes("underutilized")).length + 1,
      userName: taxContext.userName,
      initials: getInitials(taxContext.userName),
      annualIncome: formatInr(annualIncome),
    },
    metricCards: [
      {
        label: "Annual Income",
        value: formatInr(annualIncome),
        sub: "Total Gross Income",
        iconKey: "wallet",
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-600",
      },
      {
        label: "Gross Total Income",
        value: formatInr(grossIncome),
        sub: "After Exemptions",
        iconKey: "file",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        label: "Total Deductions",
        value: formatInr(deductionClaimed),
        sub: `${deductionPct}% of Eligible`,
        iconKey: "receipt",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        label: "Total Tax Liability",
        value: formatInr(estimatedTax),
        sub: "Includes cess & surcharge",
        iconKey: "shield",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
      },
      {
        label: "Expected Refund",
        value: formatInr(expectedRefund),
        sub: expectedRefund > 0 ? "Processing after filing" : "No refund expected currently",
        iconKey: "file",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        valueColor: "text-emerald-600",
      },
    ],
    monthlyData,
    taxBreakdown,
    totalTax: formatInr(estimatedTax),
    reportsLibraryGeneratedOn: generatedOn,
    highlights,
    lastUpdated: formatDateLabel(new Date()),
  };
}
