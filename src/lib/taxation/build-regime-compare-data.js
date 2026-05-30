import { compareRegimes } from "@/lib/tax/compare-regimes";
import { OLD_REGIME_SLABS, NEW_REGIME_SLABS } from "@/lib/tax/tax-slabs";
import { getSlabTaxBreakdown, getBaseTaxAndCess } from "@/lib/tax/slab-breakdown";
import { calculateDeductionUtilization } from "@/lib/tax/deduction-utilization";

function n(value) {
  return Number(value) || 0;
}

function totalByKey(deductions, key) {
  return (deductions ?? [])
    .filter((r) => r.key === key)
    .reduce((sum, r) => sum + n(r.amount), 0);
}

function section80cFromOnboarding(profile) {
  if (!profile) return 0;
  return (
    n(profile.elss_investments) +
    n(profile.ppf) +
    n(profile.epf) +
    n(profile.tax_saver_fd) +
    n(profile.life_insurance)
  );
}

function buildCompareInputs(taxContext, overrides = {}) {
  const profile = taxContext.salaryProfile ?? taxContext.onboardingProfile;
  const deductions = taxContext.deductions ?? [];

  const annualCtc = n(overrides.annual_ctc ?? taxContext.annualCtc);
  const section80c = Math.min(
    150000,
    n(overrides.section80c) ||
      Math.max(totalByKey(deductions, "80C"), section80cFromOnboarding(profile))
  );
  const section80d = Math.min(
    25000,
    n(overrides.section80d) ||
      Math.max(totalByKey(deductions, "80D"), n(profile?.health_insurance))
  );
  const nps = Math.min(
    50000,
    n(overrides.nps) ||
      totalByKey(deductions, "80CCD_1B") + n(profile?.nps_contribution) + n(profile?.employer_nps)
  );
  const hra_exemption = n(overrides.hra_exemption ?? taxContext.hraExemption);
  const home_loan_interest = n(overrides.home_loan_interest ?? profile?.home_loan_interest);

  return {
    annual_ctc: annualCtc,
    section80c,
    section80d,
    nps,
    hra_exemption,
    home_loan_interest,
  };
}

function buildRegimeDetail(compareInputs, result, regimeKey) {
  const isOld = regimeKey === "old";
  const slabs = isOld ? OLD_REGIME_SLABS : NEW_REGIME_SLABS;
  const standardDeduction = isOld ? 50000 : 75000;
  const taxableIncome = isOld ? result.oldResult.taxableIncome : result.newResult.taxableIncome;
  const totalTax = isOld ? result.oldResult.tax : result.newResult.tax;
  const { baseTax, cess } = getBaseTaxAndCess(taxableIncome, slabs);
  const annualCtc = compareInputs.annual_ctc;
  const effectiveRate = annualCtc > 0 ? (totalTax / annualCtc) * 100 : 0;

  const deductionItems = isOld
    ? [
        { key: "80C", label: "Section 80C", amount: compareInputs.section80c, limit: 150000 },
        { key: "80D", label: "Section 80D", amount: compareInputs.section80d, limit: 25000 },
        { key: "HRA", label: "HRA Exemption", amount: compareInputs.hra_exemption },
        { key: "NPS", label: "NPS (80CCD)", amount: compareInputs.nps, limit: 50000 },
        ...(compareInputs.home_loan_interest > 0
          ? [{ key: "HL", label: "Home Loan Interest", amount: compareInputs.home_loan_interest }]
          : []),
        { key: "STD", label: "Standard Deduction", amount: standardDeduction },
      ].filter((d) => d.amount > 0)
    : [{ key: "STD", label: "Standard Deduction", amount: standardDeduction }];

  const totalDeductions = isOld
    ? deductionItems.reduce((sum, d) => sum + d.amount, 0)
    : standardDeduction;

  return {
    regime: regimeKey,
    taxableIncome,
    totalTax,
    baseTax,
    cess,
    effectiveRate,
    standardDeduction,
    deductionItems,
    totalDeductions,
    slabBreakdown: getSlabTaxBreakdown(taxableIncome, slabs),
  };
}

function buildIncomeBreakdown(profile, annualCtc) {
  const basic = n(profile?.basic_salary) * 12;
  const hra = n(profile?.hra) * 12;
  const special = n(profile?.special_allowance) * 12;
  const bonus = n(profile?.bonus);
  const known = basic + hra + special + bonus;
  const others = Math.max(0, annualCtc - known);

  const items = [
    { name: "Basic Salary", value: basic, color: "#6366f1" },
    { name: "HRA", value: hra, color: "#22c55e" },
    { name: "Special Allowance", value: special, color: "#f97316" },
    { name: "Bonus", value: bonus, color: "#3b82f6" },
    { name: "Others", value: others, color: "#a855f7" },
  ].filter((i) => i.value > 0);

  const total = items.reduce((s, i) => s + i.value, 0) || annualCtc;
  return items.map((i) => ({
    ...i,
    percent: total > 0 ? Math.round((i.value / total) * 100) : 0,
  }));
}

function buildDeductionBreakdown(oldDetail) {
  const colors = {
    "80C": "#6366f1",
    "80D": "#22c55e",
    HRA: "#f97316",
    NPS: "#3b82f6",
    HL: "#ec4899",
    STD: "#94a3b8",
  };

  return oldDetail.deductionItems
    .filter((d) => d.key !== "STD")
    .map((d) => ({
      name: d.label,
      value: d.amount,
      color: colors[d.key] || "#6366f1",
    }));
}

function buildFiveYearProjection(compareInputs, financialYear) {
  const startYear = parseInt(String(financialYear).split("-")[0], 10) || 2024;
  const growth = 0.05;
  const rows = [];

  for (let i = 0; i < 5; i++) {
    const ctc = compareInputs.annual_ctc * Math.pow(1 + growth, i);
    const compare = compareRegimes({ ...compareInputs, annual_ctc: Math.round(ctc) });
    rows.push({
      fy: `FY ${String(startYear + i).slice(-2)}`,
      oldTax: compare.oldResult.tax,
      newTax: compare.newResult.tax,
    });
  }

  return rows;
}

function buildMonthlyProjection(oldTax, newTax) {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  return months.map((month, index) => {
    const factor = (index + 1) / 12;
    return {
      month,
      oldTax: Math.round((oldTax / 12) * factor),
      newTax: Math.round((newTax / 12) * factor),
    };
  });
}

function buildInsights(compare, oldDetail, newDetail, compareInputs, utilization) {
  const recommended = compare.recommended;
  const insights = [];

  if (recommended === "old") {
    if (compareInputs.section80c > 50000) {
      insights.push("High 80C investments reduce taxable income significantly under the old regime.");
    }
    if (compareInputs.hra_exemption > 0) {
      insights.push("HRA exemption is only available in the old regime and improves your outcome.");
    }
    if (compareInputs.nps > 0) {
      insights.push("NPS (80CCD) adds extra deduction benefit in the old regime.");
    }
    if (oldDetail.effectiveRate < newDetail.effectiveRate) {
      insights.push(
        `Your effective tax rate is lower in the old regime (${oldDetail.effectiveRate.toFixed(1)}% vs ${newDetail.effectiveRate.toFixed(1)}%).`
      );
    }
  } else {
    insights.push("Lower deductions mean the new regime's simplified slabs work better for you.");
    insights.push("Standard deduction of ₹75,000 under the new regime improves your net tax.");
    if (compareInputs.section80c < 50000) {
      insights.push("Limited 80C usage makes old-regime deductions less impactful.");
    }
  }

  if (insights.length < 3) {
    insights.push(
      `Annual tax difference: ₹${compare.savings.toLocaleString("en-IN")} in favor of the ${recommended} regime.`
    );
  }

  return insights.slice(0, 4);
}

function buildSavingsOpportunities(utilization) {
  const opportunities = [];
  const u80c = utilization.find((d) => d.key === "80C");
  const u80d = utilization.find((d) => d.key === "80D");
  const unps = utilization.find((d) => d.key === "80CCD_1B");

  if (u80c && u80c.remaining > 0) {
    opportunities.push({
      title: "Unused 80C Limit",
      desc: `${formatInr(u80c.remaining)} room left — ELSS, PPF, or EPF can help.`,
      href: "/taxation/deductions",
      cta: "Invest Now",
    });
  }
  if (unps && unps.remaining > 0) {
    opportunities.push({
      title: "NPS Extra Deduction",
      desc: `Claim up to ${formatInr(unps.remaining)} more under 80CCD(1B).`,
      href: "/taxation/deductions",
      cta: "Explore Options",
    });
  }
  if (u80d && u80d.remaining > 0) {
    opportunities.push({
      title: "Health Insurance (80D)",
      desc: `${formatInr(u80d.remaining)} health premium deduction available.`,
      href: "/taxation/deductions",
      cta: "Explore Options",
    });
  }

  return opportunities;
}

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

export function buildRegimeCompareData(taxContext, overrides = {}) {
  const profile = taxContext.salaryProfile ?? taxContext.onboardingProfile;
  const compareInputs = buildCompareInputs(taxContext, overrides);
  const compare = compareRegimes(compareInputs);
  const oldDetail = buildRegimeDetail(compareInputs, compare, "old");
  const newDetail = buildRegimeDetail(compareInputs, compare, "new");

  const monthlyTds =
    n(taxContext.salaryProfile?.monthly_tds) || n(taxContext.onboardingProfile?.monthly_tds);
  const annualTds = Math.round(monthlyTds * 12);

  const oldRefund = Math.max(0, annualTds - oldDetail.totalTax);
  const oldAdditional = Math.max(0, oldDetail.totalTax - annualTds);
  const newRefund = Math.max(0, annualTds - newDetail.totalTax);
  const newAdditional = Math.max(0, newDetail.totalTax - annualTds);

  const utilization = calculateDeductionUtilization(taxContext.deductions ?? []);
  const savingsPercent =
    compare.savings > 0 && Math.max(oldDetail.totalTax, newDetail.totalTax) > 0
      ? ((compare.savings / Math.max(oldDetail.totalTax, newDetail.totalTax)) * 100).toFixed(1)
      : "0";

  const oldSlabs = getSlabTaxBreakdown(oldDetail.taxableIncome, OLD_REGIME_SLABS);
  const newSlabs = getSlabTaxBreakdown(newDetail.taxableIncome, NEW_REGIME_SLABS);
  const slabLabels = [...new Set([...oldSlabs.map((s) => s.label), ...newSlabs.map((s) => s.label)])];
  const slabComparison = slabLabels.map((label) => ({
    label,
    old: oldSlabs.find((s) => s.label === label)?.tax ?? 0,
    new: newSlabs.find((s) => s.label === label)?.tax ?? 0,
  }));

  const preferredRegime =
    taxContext.onboardingProfile?.tax_regime &&
    taxContext.onboardingProfile.tax_regime !== "unsure"
      ? taxContext.onboardingProfile.tax_regime
      : compare.recommended;

  return {
    userName: taxContext.userName,
    financialYear: taxContext.financialYear,
    taxHealthScore: taxContext.taxHealthScore,
    annualCtc: compareInputs.annual_ctc,
    compareInputs,
    compare,
    recommended: compare.recommended,
    savings: compare.savings,
    savingsPercent,
    preferredRegime,
    old: {
      ...oldDetail,
      monthlyTds,
      annualTds,
      refund: oldRefund,
      additionalTax: oldAdditional,
    },
    new: {
      ...newDetail,
      monthlyTds,
      annualTds,
      refund: newRefund,
      additionalTax: newAdditional,
    },
    incomeBreakdown: buildIncomeBreakdown(profile, compareInputs.annual_ctc),
    deductionBreakdown: buildDeductionBreakdown(oldDetail),
    fiveYearProjection: buildFiveYearProjection(compareInputs, taxContext.financialYear),
    monthlyProjection: buildMonthlyProjection(oldDetail.totalTax, newDetail.totalTax),
    slabComparison,
    insights: buildInsights(compare, oldDetail, newDetail, compareInputs, utilization),
    savingsOpportunities: buildSavingsOpportunities(utilization),
    keySummary: {
      salaryCtc: compareInputs.annual_ctc,
      totalDeductionsOld: oldDetail.totalDeductions,
      taxableIncomeOld: oldDetail.taxableIncome,
      taxableIncomeNew: newDetail.taxableIncome,
      youSave: compare.savings,
    },
  };
}

export { buildCompareInputs };

/** Single source of truth for old vs new regime recommendation (used across taxation UI). */
export function computeLiveRegimeCompare(taxContext, overrides = {}) {
  const compareInputs = buildCompareInputs(taxContext, overrides);
  const compare = compareRegimes(compareInputs);
  return { compareInputs, ...compare };
}
