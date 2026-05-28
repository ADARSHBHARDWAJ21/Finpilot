import { OLD_REGIME_SLABS } from "./tax-slabs";
import { calculateTaxBySlabs } from "./calculate-tax-by-slabs";

export function calculateOldRegime(data) {
  const annualCtc = Number(data.annual_ctc || 0);
  const standardDeduction = 50000;

  const deductions =
    Number(data.section80c || 0) +
    Number(data.nps || 0) +
    Number(data.hra_exemption || 0) +
    Number(data.section80d || 0) +
    Number(data.home_loan_interest || 0);

  const taxableIncome = Math.max(0, annualCtc - standardDeduction - deductions);

  const tax = calculateTaxBySlabs(taxableIncome, OLD_REGIME_SLABS);

  return {
    taxableIncome,
    tax: Math.round(tax * 1.04),
  };
}
