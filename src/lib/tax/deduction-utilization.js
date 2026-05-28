import { DEDUCTIONS } from "@/constants/deductions";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function calculateDeductionUtilization(deductions) {
  const grouped = new Map();

  for (const row of deductions ?? []) {
    const key = row.key;
    grouped.set(key, (grouped.get(key) || 0) + toNumber(row.amount));
  }

  return DEDUCTIONS.map((def) => {
    const used = Math.min(grouped.get(def.key) || 0, def.limit);
    const remaining = Math.max(def.limit - used, 0);
    const potentialSavings = Math.round(remaining * 0.312);

    return {
      key: def.key,
      limit: def.limit,
      used,
      remaining,
      potentialSavings,
    };
  });
}
