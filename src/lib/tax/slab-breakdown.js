import { calculateTaxBySlabs } from "./calculate-tax-by-slabs";

function formatSlabLabel(from, to) {
  if (!Number.isFinite(to)) return `>${formatLakh(from)}`;
  if (from === 0) return `0-${formatLakh(to)}`;
  return `${formatLakh(from)}-${formatLakh(to)}`;
}

function formatLakh(amount) {
  if (amount >= 100000) {
    const l = amount / 100000;
    return Number.isInteger(l) ? `${l}L` : `${l.toFixed(1)}L`;
  }
  if (amount >= 1000) return `${amount / 1000}k`;
  return String(amount);
}

export function getSlabTaxBreakdown(taxableIncome, slabs) {
  const income = Math.max(0, Number(taxableIncome) || 0);
  const rows = [];
  let previousLimit = 0;

  for (const slab of slabs) {
    const upper = slab.limit === Infinity ? income : slab.limit;
    const amountInBand = Math.max(0, Math.min(income, upper) - previousLimit);
    if (amountInBand > 0 || slab.rate === 0) {
      rows.push({
        label: formatSlabLabel(previousLimit, slab.limit === Infinity ? Infinity : slab.limit),
        tax: Math.round(amountInBand * slab.rate),
        rate: slab.rate,
      });
    }
    previousLimit = slab.limit === Infinity ? income : slab.limit;
    if (income <= slab.limit) break;
  }

  return rows;
}

export function getBaseTaxAndCess(taxableIncome, slabs) {
  const baseTax = calculateTaxBySlabs(taxableIncome, slabs);
  const cess = Math.round(baseTax * 0.04);
  return { baseTax, cess, totalTax: Math.round(baseTax * 1.04) };
}
