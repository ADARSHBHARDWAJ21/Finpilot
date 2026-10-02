// Salary-only estimates. Keep these rules independent of the older dashboard engine.
export const TAX_SOURCES = [
  { title: "Income Tax Department: salaried individuals, AY 2025–26", url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-3" },
  { title: "Income Tax Department: salaried individuals, AY 2026–27", url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" },
  { title: "Income Tax Department: salary, HRA and employer NPS", url: "https://www.incometaxindia.gov.in/en/income-from-salary" },
  { title: "Income-tax Act, 2025: new regime", url: "https://www.incometaxindia.gov.in/w/section-202-78" },
  { title: "Income-tax Act: combined 80C and employee NPS deduction limit", url: "https://www.incometaxindia.gov.in/w/section-80cce-21" },
  { title: "Income-tax Act: rounding total income", url: "https://www.incometaxindia.gov.in/w/section-288a-55" },
  { title: "Income-tax Act: rounding tax payable", url: "https://www.incometaxindia.gov.in/w/section-288b-9" },
  { title: "Income-tax Act, 2025: rounding income and tax", url: "https://www.incometaxindia.gov.in/w/section-516-3" },
];

const NEW_SLABS = {
  "2024-25": [[300000, 0], [700000, .05], [1000000, .1], [1200000, .15], [1500000, .2], [Infinity, .3]],
  "2025-26": [[400000, 0], [800000, .05], [1200000, .1], [1600000, .15], [2000000, .2], [2400000, .25], [Infinity, .3]],
  "2026-27": [[400000, 0], [800000, .05], [1200000, .1], [1600000, .15], [2000000, .2], [2400000, .25], [Infinity, .3]],
};
const OLD_SLABS = [[250000, 0], [500000, .05], [1000000, .2], [Infinity, .3]];
export const number = (value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
export const inr = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

// Sections 288A/288B (and section 516 for TY 2026–27) discard paise first.
const roundToTen = (value) => Math.floor((Math.floor(number(value)) + 5) / 10) * 10;

function slabTax(income, slabs) {
  let floor = 0;
  return slabs.reduce((tax, [ceiling, rate]) => {
    const portion = Math.max(0, Math.min(income, ceiling) - floor);
    floor = ceiling;
    return tax + portion * rate;
  }, 0);
}

export function profileTaxInputs(profile = {}, salary = null) {
  const current = { ...profile, ...(salary || {}) };
  // Onboarding records monthly NPS, whereas the salary workspace has also
  // accepted annual NPS into this column. A differing value has unknown units.
  const monthlyEmployerNps = number(profile.employer_nps);
  const employerNpsUnconfirmed = salary?.employer_nps != null
    && number(salary.employer_nps) !== monthlyEmployerNps;
  return {
    financialYear: profile.financial_year || null,
    annualSalary: number(current.annual_ctc),
    age: profile.age == null ? null : number(profile.age),
    annualBasic: number(current.basic_salary) * 12,
    annualHra: number(current.hra) * 12,
    annualRent: profile.paying_rent ? number(profile.monthly_rent) * 12 : 0,
    metro: ["mumbai", "delhi", "kolkata", "chennai"].includes(String(profile.city).toLowerCase()),
    section80c: ["elss_investments", "ppf", "epf", "tax_saver_fd", "life_insurance"].reduce((sum, key) => sum + number(profile[key]), 0),
    healthInsurance: number(profile.health_insurance),
    parentsHealthInsurance: number(profile.parents_health_insurance),
    parentsSenior: false,
    personalNps: number(profile.nps_contribution),
    employerNps: employerNpsUnconfirmed ? 0 : monthlyEmployerNps * 12,
    employerNpsUnconfirmed,
    governmentEmployer: null,
    educationLoanInterest: 0,
    confirmedHomeLoanInterest: 0,
    monthlySideIncome: number(profile.side_income),
    declaredHomeLoanInterest: number(profile.home_loan_interest),
    declaredEducationLoanInterest: number(profile.education_loan_interest),
    salaryIsCtcProxy: true,
  };
}

export function estimateTax(inputs) {
  const warnings = [
    "Estimate assumes an Indian resident salaried individual below age 60, eligible documented deductions, and ordinary salary income only.",
    "HRA uses basic salary only; qualifying DA/commission and the rental period are not recorded. NPS uses basic salary only; qualifying DA is not recorded. Confirm the respective salary bases and rental city.",
  ];
  const year = inputs.financialYear;
  if (!NEW_SLABS[year]) return { available: false, reason: "Select a supported tax year (2024–25, 2025–26 or 2026–27) in Settings." };
  if (inputs.age != null && inputs.age >= 60) return { available: false, reason: "This calculator currently supports salaried individuals below age 60. Senior-citizen calculations need separate rules." };
  const conflicts = Array.isArray(inputs.deductionConflicts) ? inputs.deductionConflicts : [];
  if (conflicts.length || inputs.employerNpsUnconfirmed) {
    const unresolved = [...new Set(conflicts.map((conflict) => conflict.key))];
    if (inputs.employerNpsUnconfirmed) unresolved.push("annual employer NPS (saved amounts have unconfirmed monthly/annual units)");
    return { available: false, reason: `Confirm eligible annual totals for ${unresolved.join(", ")} before calculating tax. Conflicting saved amounts are not added together.`, deductionConflicts: conflicts, employerNpsUnconfirmed: Boolean(inputs.employerNpsUnconfirmed) };
  }
  const salary = number(inputs.annualSalary);
  if (!salary) return { available: false, reason: "Add or confirm your annual gross salary before calculating tax." };
  if (salary > 5000000) return { available: false, reason: "Income above ₹50 lakh needs surcharge calculations, which this salary estimator does not yet support." };
  if (inputs.salaryIsCtcProxy) warnings.push("Recorded annual CTC is used as a gross-salary proxy. CTC may include non-taxable employer costs; confirm gross taxable salary for an accurate estimate.");
  if (number(inputs.monthlySideIncome)) warnings.push("Side income is excluded until its type and annual taxable amount are confirmed. Business income, capital gains and foreign assets need separate treatment.");
  if (number(inputs.declaredHomeLoanInterest) && !number(inputs.confirmedHomeLoanInterest)) warnings.push("Home-loan interest is excluded until self-occupied status and qualifying loan conditions are confirmed.");
  if (number(inputs.declaredEducationLoanInterest) && !number(inputs.educationLoanInterest)) warnings.push("Education-loan interest is excluded until lender, purpose and claim-period eligibility are confirmed.");
  if (number(inputs.parentsHealthInsurance) && !inputs.parentsSenior) warnings.push("Parents' insurance uses the non-senior limit until their age is confirmed.");
  if (number(inputs.employerNps) && inputs.governmentEmployer == null) warnings.push("Employer type is unconfirmed. Old-regime employer NPS uses the private/other-employer limit of 10% of the recorded basic salary; Central/State Government employment allows 14% when confirmed.");
  const basic = number(inputs.annualBasic);
  const rent = number(inputs.annualRent);
  const hra = Math.max(0, Math.min(number(inputs.annualHra), rent - basic * .1, basic * (inputs.metro ? .5 : .4)));
  const section80c = Math.min(150000, number(inputs.section80c));
  const health = Math.min(25000, number(inputs.healthInsurance)) + Math.min(inputs.parentsSenior ? 50000 : 25000, number(inputs.parentsHealthInsurance));
  const personalNps = Math.min(50000, number(inputs.personalNps));
  // Allocate separate rupees to 80CCD(1B) and 80CCD(1); the latter shares
  // the 80C/80CCC pool and is limited to 10% of eligible salary.
  const personalNpsWithin80c = Math.min(Math.max(0, number(inputs.personalNps) - personalNps), 150000 - section80c, basic / 10);
  const oldEmployerNps = Math.min(number(inputs.employerNps), basic * (inputs.governmentEmployer === true ? 14 : 10) / 100);
  const newEmployerNps = Math.min(number(inputs.employerNps), basic * 14 / 100);
  const oldDeductions = { standard: Math.min(50000, salary), section80c, healthInsurance: health, personalNps, personalNpsWithin80c, employerNps: oldEmployerNps, hra, homeLoanInterest: Math.min(200000, number(inputs.confirmedHomeLoanInterest)), educationLoanInterest: number(inputs.educationLoanInterest) };
  const newDeductions = { standard: Math.min(75000, salary), employerNps: newEmployerNps };
  const calculate = (deductions, regime) => {
    const taxableIncome = roundToTen(Math.max(0, salary - Object.values(deductions).reduce((sum, value) => sum + value, 0)));
    const baseTax = slabTax(taxableIncome, regime === "old" ? OLD_SLABS : NEW_SLABS[year]);
    const threshold = regime === "old" ? 500000 : year === "2024-25" ? 700000 : 1200000;
    const rebateCap = regime === "old" ? 12500 : year === "2024-25" ? 25000 : 60000;
    const rebate = taxableIncome <= threshold ? Math.min(baseTax, rebateCap) : 0;
    const afterRebate = baseTax - rebate;
    const marginalRelief = regime === "new" && taxableIncome > threshold ? Math.max(0, afterRebate - (taxableIncome - threshold)) : 0;
    const taxBeforeCess = afterRebate - marginalRelief;
    return { taxableIncome, tax: roundToTen(taxBeforeCess * 1.04), baseTax: Math.round(baseTax), rebate: Math.round(rebate), marginalRelief: Math.round(marginalRelief), deductions };
  };
  const old = calculate(oldDeductions, "old");
  const next = calculate(newDeductions, "new");
  return { available: true, financialYear: year, annualSalary: salary, old, new: next, recommended: old.tax === next.tax ? "equal" : old.tax < next.tax ? "old" : "new", difference: Math.abs(old.tax - next.tax), warnings, rulesCheckedOn: "2026-10-01" };
}

export function simulateTaxChange(inputs, changes = {}) {
  const selectedInputs = { ...inputs, financialYear: changes.financialYear ?? inputs.financialYear };
  if (changes.baselineAnnualSalary != null) {
    selectedInputs.annualSalary = changes.baselineAnnualSalary;
    selectedInputs.salaryIsCtcProxy = false;
  }
  const baseline = estimateTax(selectedInputs);
  const next = { ...selectedInputs };
  const months = changes.monthsRemaining ?? 12;
  if (changes.annualSalary != null || changes.increasePercent != null) {
    const currentSalary = number(selectedInputs.annualSalary);
    const revisedSalary = changes.annualSalary ?? currentSalary * (1 + changes.increasePercent / 100);
    next.annualSalary = currentSalary + (revisedSalary - currentSalary) * months / 12;
    // Only an explicitly supplied gross-salary amount resolves the CTC ambiguity.
    if (changes.annualSalary != null && months === 12) next.salaryIsCtcProxy = false;
  }
  for (const key of ["section80c", "personalNps", "employerNps", "healthInsurance", "parentsHealthInsurance", "educationLoanInterest", "confirmedHomeLoanInterest"]) {
    if (changes[key] != null) next[key] = changes[key];
  }
  next.deductionConflicts = (selectedInputs.deductionConflicts || []).filter((conflict) => {
    if (conflict.key === "80C") return changes.section80c == null;
    if (conflict.key === "80CCD_1B") return changes.personalNps == null;
    if (conflict.key === "80D") return changes.healthInsurance == null || changes.parentsHealthInsurance == null;
    return true;
  });
  if (changes.employerNps != null) next.employerNpsUnconfirmed = false;
  if (changes.governmentEmployer != null) next.governmentEmployer = changes.governmentEmployer;
  if (changes.parentsSenior != null) next.parentsSenior = changes.parentsSenior;
  if (changes.monthlyRent != null) next.annualRent = changes.monthlyRent * 12;
  const scenario = estimateTax(next);
  return {
    kind: "tax", baseline, scenario,
    changes,
    assumptions: [`Both estimates use tax year ${selectedInputs.financialYear || "not selected"}.`, `Salary change applies for ${months} month(s) of that April–March tax year.`, "Salary components and other deductions stay fixed unless specified. Rent/deduction overrides are full-year eligible amounts.", "A promotion changes income and potentially the applicable slabs/rebate; it does not change the tax law itself."],
    delta: baseline.available && scenario.available ? { oldTax: scenario.old.tax - baseline.old.tax, newTax: scenario.new.tax - baseline.new.tax, grossIncome: scenario.annualSalary - baseline.annualSalary } : null,
  };
}
