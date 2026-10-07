import { estimateTax, profileTaxInputs, number as n } from "../copilot/tax-engine.js";

export function computeOnboardingFinancialSummary(profile) {
  const inputs = profileTaxInputs(profile);
  const tax = estimateTax(inputs);
  const chosenRegime = ["old", "new"].includes(profile.tax_regime) ? profile.tax_regime : tax.available && tax.recommended === "old" ? "old" : "new";
  const monthlySpend = ["monthly_rent", "monthly_food_spend", "monthly_transport_spend", "monthly_shopping_spend", "emi_obligations", "sip_amount"].reduce((sum, key) => sum + n(profile[key]), 0);
  const monthlyIncome = n(profile.monthly_inhand_salary);
  const potentialMonthlySavings = Math.max(0, monthlyIncome - monthlySpend);
  const completeness = [n(profile.annual_ctc) > 0, n(profile.basic_salary) > 0, n(profile.age) > 0, ["old", "new"].includes(profile.tax_regime)].filter(Boolean).length * 25;
  const insights = tax.available ? [tax.recommended === "equal" ? "Both regimes have the same salary estimate." : (tax.recommended === "old" ? "Old" : "New") + " regime has the lower salary estimate. Review eligible amounts in your tax workspace.", ...tax.warnings] : [tax.reason];
  return {
    recommendedRegime: tax.available ? tax.recommended : null,
    chosenRegime, estimatedTaxLiability: tax.available ? tax[chosenRegime].tax : null,
    expectedRefund: null, unused80c: Math.max(0, 150000 - inputs.section80c),
    potentialAnnualSavings: potentialMonthlySavings * 12, taxHealthScore: completeness,
    insights, regimeComparison: { oldTax: tax.available ? tax.old.tax : null, newTax: tax.available ? tax.new.tax : null, savings: tax.available ? tax.difference : null },
  };
}
