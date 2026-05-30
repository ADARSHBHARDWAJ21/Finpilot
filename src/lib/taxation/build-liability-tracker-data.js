import { compareRegimes } from "@/lib/tax/compare-regimes";

function n(value) {
  return Number(value) || 0;
}

function buildFyMonths(financialYear) {
  const [start] = String(financialYear || "2024-25").split("-");
  const startYear = Number(start) || new Date().getFullYear();
  const months = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(startYear, 3 + i, 1);
    months.push(
      d
        .toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
        .replace(" ", " '")
    );
  }
  return months;
}

function buildDeadlines(financialYear) {
  const [start, endSuffix] = String(financialYear || "2024-25").split("-");
  const endYear = Number(`20${endSuffix}`) || Number(start) + 1;
  return [
    { label: "Q4 Advance Tax", due: `15 Mar ${endYear}`, sub: "" },
    { label: "File ITR", due: `31 Jul ${endYear}`, sub: "" },
    { label: "Claim Refund", due: "As per ITR filing", sub: "" },
  ];
}

function buildAdvanceTaxSchedule(financialYear, estimatedTax, totalTaxPaid) {
  const [start, endSuffix] = String(financialYear || "2024-25").split("-");
  const startYear = Number(start) || new Date().getFullYear();
  const endYear = Number(`20${endSuffix}`) || startYear + 1;

  const installments = [
    { label: "1st (15%)", dueDate: `15 Jun ${startYear}`, target: Math.round(estimatedTax * 0.15) },
    { label: "2nd (45%)", dueDate: `15 Sep ${startYear}`, target: Math.round(estimatedTax * 0.45) },
    { label: "3rd (75%)", dueDate: `15 Dec ${startYear}`, target: Math.round(estimatedTax * 0.75) },
    { label: "4th (100%)", dueDate: `15 Mar ${endYear}`, target: Math.round(estimatedTax) },
  ];

  return installments.map((item) => ({
    ...item,
    status: totalTaxPaid >= item.target ? "Paid" : "Pending",
  }));
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
  const salaryProfile = taxContext.salaryProfile ?? {};
  const onboardingProfile = taxContext.onboardingProfile ?? {};
  const deductions = taxContext.deductions ?? [];
  const annualCtc = n(taxContext.annualCtc);
  const sideIncome = n(onboardingProfile.side_income);
  const interestIncome = 0;

  const section80c = Math.min(
    150000,
    Math.max(totalByKey(deductions, "80C"), section80cFromOnboarding(onboardingProfile))
  );
  const healthInsuranceSelf = Math.max(
    totalByKey(deductions, "80D"),
    n(onboardingProfile.health_insurance)
  );
  const healthInsuranceParents = n(onboardingProfile.parents_health_insurance);
  const section80dLimit = healthInsuranceParents > 0 ? 50000 : 25000;
  const section80d = Math.min(
    section80dLimit,
    healthInsuranceSelf + healthInsuranceParents
  );
  const nps = Math.min(
    50000,
    totalByKey(deductions, "80CCD_1B") +
      n(onboardingProfile.nps_contribution) +
      n(salaryProfile.employer_nps ?? onboardingProfile.employer_nps)
  );

  const compare = compareRegimes({
    annual_ctc: annualCtc + sideIncome + interestIncome,
    section80c,
    section80d,
    nps,
    hra_exemption: n(taxContext.hraExemption),
  });

  const recommendedRegime = taxContext.liveCompare?.recommended ?? compare.recommended;
  const preferredRegime =
    onboardingProfile.tax_regime && onboardingProfile.tax_regime !== "unsure"
      ? onboardingProfile.tax_regime
      : recommendedRegime;

  const chosenTax = preferredRegime === "old" ? compare.oldResult.tax : compare.newResult.tax;
  const chosenTaxableIncome =
    preferredRegime === "old"
      ? compare.oldResult.taxableIncome
      : compare.newResult.taxableIncome;

  const monthlyTds = n(salaryProfile.monthly_tds ?? onboardingProfile.monthly_tds);
  const totalTds = Math.round(monthlyTds * 12);
  const advanceTaxPaid = 0;
  const totalTaxPaid = totalTds + advanceTaxPaid;

  const taxPayable = Math.max(0, Math.round(chosenTax - totalTaxPaid));
  const refund = Math.max(0, Math.round(totalTaxPaid - chosenTax));
  const effectiveTaxRate = chosenTaxableIncome > 0 ? (chosenTax / chosenTaxableIncome) * 100 : 0;
  const paidPercent = chosenTax > 0 ? Math.min(100, Math.round((totalTaxPaid / chosenTax) * 100)) : 0;

  const months = buildFyMonths(taxContext.financialYear);
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

  const deadlines = buildDeadlines(taxContext.financialYear);

  const components = [
    { label: "Salary", value: annualCtc },
    { label: "Interest Income", value: interestIncome },
    { label: "Other Income", value: sideIncome },
  ];
  const advanceTaxSchedule = buildAdvanceTaxSchedule(
    taxContext.financialYear,
    Math.round(chosenTax),
    Math.round(totalTaxPaid)
  );

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
    advanceTaxSchedule,
    financialYear: taxContext.financialYear,
    userName: taxContext.userName,
  };
}

