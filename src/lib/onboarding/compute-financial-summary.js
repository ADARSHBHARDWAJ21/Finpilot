import { compareRegimes } from "@/lib/tax/compare-regimes";

function n(value) {
  return Number(value) || 0;
}

function section80cTotal(profile) {
  return (
    n(profile.elss_investments) +
    n(profile.ppf) +
    n(profile.epf) +
    n(profile.tax_saver_fd) +
    n(profile.life_insurance)
  );
}

function hraExemption(profile) {
  if (!profile.paying_rent) return 0;
  const annualRent = n(profile.monthly_rent) * 12;
  const hra = n(profile.hra) * 12;
  return Math.min(annualRent, hra, n(profile.basic_salary) * 12 * 0.5);
}

export function computeOnboardingFinancialSummary(profile) {
  const annualCtc = n(profile.annual_ctc);
  const section80c = Math.min(150000, section80cTotal(profile));
  const nps = n(profile.nps_contribution) + n(profile.employer_nps);
  const hra_exemption = hraExemption(profile);

  const taxCompare = compareRegimes({
    annual_ctc: annualCtc,
    section80c,
    nps,
    hra_exemption,
  });

  const chosenRegime =
    profile.tax_regime === "unsure" ? taxCompare.recommended : profile.tax_regime || "new";

  const estimatedTax =
    chosenRegime === "old" ? taxCompare.oldResult.tax : taxCompare.newResult.tax;

  const tdsPaid = n(profile.monthly_tds) * 12;
  const expectedRefund = Math.max(0, tdsPaid - estimatedTax);
  const unused80c = Math.max(0, 150000 - section80c);

  const monthlySpend =
    n(profile.monthly_food_spend) +
    n(profile.monthly_transport_spend) +
    n(profile.monthly_shopping_spend) +
    n(profile.emi_obligations);

  const monthlyIncome = n(profile.monthly_inhand_salary) || annualCtc / 12;
  const potentialMonthlySavings = Math.max(0, monthlyIncome - monthlySpend - n(profile.sip_amount));

  let taxHealthScore = 70;
  if (unused80c < 30000) taxHealthScore += 10;
  if (taxCompare.savings > 10000) taxHealthScore += 10;
  if (potentialMonthlySavings > 5000) taxHealthScore += 10;
  taxHealthScore = Math.min(100, taxHealthScore);

  const insights = [];

  if (taxCompare.recommended === "new") {
    insights.push("Based on your deductions, the New Tax Regime likely saves you more tax.");
  } else {
    insights.push("Your deductions favor the Old Tax Regime — maximize 80C and HRA where eligible.");
  }

  if (unused80c > 20000) {
    insights.push(
      `You have ₹${Math.round(unused80c).toLocaleString("en-IN")} unused 80C limit — consider ELSS or PPF.`
    );
  }

  if (profile.paying_rent && n(profile.monthly_rent) > 0) {
    insights.push("Rent receipts can support HRA exemption under the old regime.");
  }

  if (profile.planning_home_loan) {
    insights.push("A future home loan can unlock additional interest deductions — plan ahead.");
  }

  if (potentialMonthlySavings > 0) {
    insights.push(
      `You could save ~₹${Math.round(potentialMonthlySavings).toLocaleString("en-IN")}/month with your current spending pattern.`
    );
  }

  return {
    recommendedRegime: taxCompare.recommended,
    chosenRegime,
    estimatedTaxLiability: Math.round(estimatedTax),
    expectedRefund: Math.round(expectedRefund),
    unused80c: Math.round(unused80c),
    potentialAnnualSavings: Math.round(potentialMonthlySavings * 12),
    taxHealthScore,
    insights,
    regimeComparison: {
      oldTax: taxCompare.oldResult.tax,
      newTax: taxCompare.newResult.tax,
      savings: taxCompare.savings,
    },
  };
}
