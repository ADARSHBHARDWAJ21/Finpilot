import { defaultDetails, calculateHra } from "../finance/model.js";
import { profileTaxInputs } from "../copilot/tax-engine.js";

// One set of yearly overrides for the tax pages, exports and Copilot.
// Legacy profile declarations are only a fallback for their own financial year.
export function applyTaxWorkspace(initial, workspace, profile = {}, salary = null) {
  if (!workspace) return initial;
  const year = workspace.year;
  const sameYear = profile.financial_year === year;
  const inputs = sameYear ? { ...initial } : {
    ...profileTaxInputs({ financial_year: year }, null), deductionConflicts: [],
  };
  inputs.financialYear = year;
  const sections = workspace.sections || {};
  const salaryDetails = sections["salary-documents"]?.details;
  const filing = sections["compliance-filing"]?.details;
  if (filing?.annualSalary != null) {
    inputs.annualSalary = filing.annualSalary;
    inputs.salaryIsCtcProxy = false;
  }
  if (salaryDetails?.annualSalary != null) {
    Object.assign(inputs, salaryDetails, { salaryIsCtcProxy: false, employerNpsUnconfirmed: false });
    inputs.annualBasic = Number(salaryDetails.annualBasic) + Number(salaryDetails.annualDa || 0);
    inputs.npsSalaryConfirmed = true;
  }
  const declared = sections["tax-saving-proofs"]?.details;
  if (declared?.eligibilityConfirmed === true) {
    Object.assign(inputs, declared, { deductionConflicts: [] });
  }
  const rent = { ...defaultDetails("rent-hra", profile, salary, year), ...sections["rent-hra"]?.details };
  const hra = calculateHra(rent, year);
  if (hra.available && (sameYear || sections["rent-hra"]?.details)) {
    inputs.confirmedHraExemption = hra.exemption;
    inputs.hraSalaryBase = hra.salary;
    inputs.hraReceivedForPeriod = hra.annualHra;
    inputs.rentalMonths = rent.months;
    inputs.metro = hra.rate === .5;
  }
  const banking = sections["banking-investments"]?.details;
  if (banking) inputs.monthlySideIncome = Number(banking.monthlySideIncome) || 0;
  inputs.excludedBankingIncome = !!(banking?.annualInterest || banking?.capitalGains || banking?.monthlySideIncome);
  return inputs;
}

export function taxReconciliation(tax, filing) {
  if (!tax.available) return { available: false, reason: "Complete the tax inputs before reconciling payments." };
  if (!["old", "new"].includes(filing.regime)) return { available: false, reason: "Select your regime before reconciling tax payments." };
  if (filing.annualTds == null || filing.advanceTax == null) return { available: false, reason: "Enter annual TDS and advance tax from your records. Enter 0 where nothing was paid; blank means unknown." };
  const liability = tax[filing.regime].tax;
  const paid = filing.annualTds + filing.advanceTax;
  return { available: true, liability, paid, balance: Math.max(0, liability - paid), excess: Math.max(0, paid - liability) };
}
