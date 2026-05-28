export function calculateTaxBySlabs(income, slabs) {
  const taxableIncome = Math.max(0, Number(income) || 0);

  let tax = 0;
  let previousLimit = 0;

  for (const slab of slabs) {
    if (taxableIncome > slab.limit) {
      tax += (slab.limit - previousLimit) * slab.rate;
      previousLimit = slab.limit;
    } else {
      tax += (taxableIncome - previousLimit) * slab.rate;
      break;
    }
  }

  return Math.max(0, tax);
}
