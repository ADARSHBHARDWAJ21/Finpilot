import { estimateTax } from "../copilot/tax-engine.js";
import { currentFinancialYear } from "../finance/model.js";

// Compatibility for older callers; all calculations delegate to the shared engine.
export function compareRegimes(data) {
  const result = estimateTax({
    financialYear: data.financialYear || data.financial_year || currentFinancialYear(),
    annualSalary: data.annualSalary ?? data.annual_ctc,
    age: data.age ?? null, resident: data.resident !== false,
    annualBasic: data.annualBasic ?? Number(data.basic_salary || 0) * 12,
    section80c: data.section80c, healthInsurance: data.healthInsurance ?? data.section80d,
    parentsHealthInsurance: data.parentsHealthInsurance, parentsSenior: data.parentsSenior,
    personalNps: data.personalNps ?? data.nps, employerNps: data.employerNps,
    governmentEmployer: data.governmentEmployer,
    confirmedHraExemption: data.confirmedHraExemption ?? data.hra_exemption,
    confirmedHomeLoanInterest: data.confirmedHomeLoanInterest ?? data.home_loan_interest,
    educationLoanInterest: data.educationLoanInterest,
    salaryIsCtcProxy: data.annualSalary == null,
  });
  const unavailable = { tax: null, taxableIncome: null, deductions: {} };
  return { ...result, oldResult: result.old || unavailable, newResult: result.new || unavailable,
    recommended: result.available ? result.recommended : null,
    savings: result.available ? result.difference : null };
}
