import { NEW_REGIME_SLABS } from "./tax-slabs";
import { calculateTaxBySlabs } from "./calculate-tax-by-slabs";

export function calculateNewRegime(data) {
  const annualCtc = Number(data.annual_ctc || 0);
  const standardDeduction = 75000;

  const taxableIncome = Math.max(0, annualCtc - standardDeduction);

  const tax = calculateTaxBySlabs(taxableIncome, NEW_REGIME_SLABS);

  return {
    taxableIncome,
    tax: Math.round(tax * 1.04),
  };
}
