import { compareRegimes } from "@/lib/tax/compare-regimes";

function n(value) {
  return Number(value) || 0;
}

function totalByKey(deductions, key) {
  return (deductions ?? [])
    .filter((r) => String(r.key || "").toUpperCase() === String(key).toUpperCase())
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

export function buildLiabilityTrackerData(taxContext) {
  const profile = taxContext.salaryProfile ?? taxContext.onboardingProfile ?? {};
  const deductions = taxContext.deductions ?? [];
  const annualCtc = n(taxContext.annualCtc);
  const sideIncome = n(profile.side_income);

  const section80c = Math.min(
    150000,
    Math.max(totalByKey(deductions, "80C"), section80cFromOnboarding(profile))
  );
  const section80d = Math.min(
    25000,
    Math.max(totalByKey(deductions, "80D"), n(profile.health_insurance))
  );
  const nps = Math.min(
    50000,
    totalByKey(deductions, "80CCD_1B") + n(profile.nps_contribution) + n(profile.employer_nps)
  );

  const compare = compareRegimes({
    annual_ctc: annualCtc + sideIncome,
    section80c,
    section80d,
    nps,
    hra_exemption: n(taxContext.hraExemption),
  });

  const preferredRegime =
    profile.tax_regime && profile.tax_regime !== "unsure"
      ? profile.tax_regime
      : taxContext.recommendedRegime ?? compare.recommended;

  const chosenTax = preferredRegime === "old" ? compare.oldResult.tax : compare.newResult.tax;
  const chosenTaxableIncome =
    preferredRegime === "old"
      ? compare.oldResult.taxableIncome
      : compare.newResult.taxableIncome;

  const monthlyTds = n(profile.monthly_tds ?? taxContext.salaryProfile?.monthly_tds);
  const totalTds = Math.round(monthlyTds * 12);
  const advanceTaxPaid = n(profile.employer_pf) > 0 ? 6000 : 0;
  const totalTaxPaid = totalTds + advanceTaxPaid;

  const taxPayable = Math.max(0, Math.round(chosenTax - totalTaxPaid));
  const refund = Math.max(0, Math.round(totalTaxPaid - chosenTax));
  const effectiveTaxRate = chosenTaxableIncome > 0 ? (chosenTax / chosenTaxableIncome) * 100 : 0;
  const paidPercent = chosenTax > 0 ? Math.min(100, Math.round((totalTaxPaid / chosenTax) * 100)) : 0;

  const months = ["Apr '24", "May '24", "Jun '24", "Jul '24", "Aug '24", "Sep '24", "Oct '24", "Nov '24", "Dec '24", "Jan '25", "Feb '25", "Mar '25"];
  const monthlyEstimated = chosenTax / 12;
  const monthlyPaid = totalTaxPaid / 12;
  let estCum = 0;
  let paidCum = 0;
  const trend = months.map((m) => {
    estCum += monthlyEstimated;
    paidCum += monthlyPaid;
    return {
      month: m,
      estimated: Math.round(estCum),
      paid: Math.round(Math.min(estCum, paidCum)),
      projection: Math.round(estCum * 0.92),
    };
  });

  const taxableIncome = Math.max(0, chosenTaxableIncome);
  const taxOnIncome = Math.round(chosenTax / 1.04);
  const cess = Math.round(chosenTax - taxOnIncome);

  const deadlines = [
    { label: "Q4 Advance Tax", due: "15 Mar 2025", sub: "(Due in 20 days)" },
    { label: "File ITR", due: "31 Jul 2025", sub: "(Due in 158 days)" },
    { label: "Claim Refund", due: "As per ITR filing", sub: "" },
  ];

  const components = [
    { label: "Salary", value: annualCtc },
    { label: "Interest Income", value: 50000 },
    { label: "Other Income", value: sideIncome },
  ];

  return {
    annualCtc,
    sideIncome,
    preferredRegime,
    estimatedTax: Math.round(chosenTax),
    totalTaxPaid: Math.round(totalTaxPaid),
    totalTds: Math.round(totalTds),
    advanceTaxPaid: Math.round(advanceTaxPaid),
    taxPayable,
    refund,
    effectiveTaxRate,
    paidPercent,
    taxableIncome,
    taxOnIncome,
    cess,
    trend,
    deadlines,
    components,
    financialYear: taxContext.financialYear,
    userName: taxContext.userName,
  };
}

