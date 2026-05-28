import {
  DEFAULT_CATEGORY_KEYS,
  getCategoryMeta,
  normalizeCategoryName,
} from "@/lib/budget/category-meta";

export function parseMonthKey(monthKey) {
  const [y, m] = String(monthKey).split("-");
  const monthNum = Number(m);
  return {
    year: Number(y),
    month: String(monthNum).padStart(2, "0"),
    monthNum,
  };
}

export function txMonthKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function defaultBudgetForSpent(spent) {
  if (spent <= 0) return 5000;
  return Math.ceil((spent * 1.25) / 500) * 500;
}

export function computeSpentByCategoryForMonth(transactions, monthKey) {
  const map = {};
  for (const tx of transactions || []) {
    if (txMonthKey(tx.transaction_date) !== monthKey || tx.type !== "expense") continue;
    const cat = normalizeCategoryName(tx.category);
    map[cat] = (map[cat] || 0) + (Number(tx.amount) || 0);
  }
  return map;
}

/** DB rows → shape used by computeBudgetDashboard */
export function rowsToBudgetPlan(rows) {
  if (!rows?.length) return null;

  const category_budgets = {};
  for (const row of rows) {
    const key = normalizeCategoryName(row.category);
    category_budgets[key] = Math.round(Number(row.monthly_limit) || 0);
  }

  const total_budget = Object.values(category_budgets).reduce((sum, v) => sum + v, 0);

  return {
    total_budget,
    category_budgets,
    savings_goal: 0,
  };
}

export function distributeTotalBudget(totalBudget, existingBudgets = {}) {
  const total = Math.round(Number(totalBudget) || 0);
  const keys = Object.keys(existingBudgets).filter((k) => existingBudgets[k] > 0);

  if (keys.length > 0) {
    const existingSum = keys.reduce((s, k) => s + existingBudgets[k], 0);
    const map = {};
    let assigned = 0;
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        map[k] = total - assigned;
      } else {
        const share = Math.round((existingBudgets[k] / existingSum) * total);
        map[k] = share;
        assigned += share;
      }
    });
    return map;
  }

  const per = Math.floor(total / DEFAULT_CATEGORY_KEYS.length);
  const map = {};
  DEFAULT_CATEGORY_KEYS.forEach((k, i) => {
    map[k] =
      i === DEFAULT_CATEGORY_KEYS.length - 1
        ? total - per * (DEFAULT_CATEGORY_KEYS.length - 1)
        : per;
  });
  return map;
}

export async function fetchBudgetPlanRows(supabase, userId, monthKey) {
  const { year, month, monthNum } = parseMonthKey(monthKey);

  const { data, error } = await supabase
    .from("budget_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("year", year)
    .or(`month.eq.${month},month.eq.${String(monthNum)}`);

  if (error) {
    throw error;
  }

  return dedupeBudgetRows(data ?? []);
}

/** One row per category (handles duplicate month formats / re-seeds). */
export function dedupeBudgetRows(rows) {
  const byCategory = new Map();

  for (const row of rows) {
    const key = normalizeCategoryName(row.category);
    const prev = byCategory.get(key);
    if (!prev) {
      byCategory.set(key, row);
      continue;
    }
    const prevTime = new Date(prev.updated_at || prev.created_at || 0).getTime();
    const rowTime = new Date(row.updated_at || row.created_at || 0).getTime();
    if (rowTime >= prevTime) {
      byCategory.set(key, row);
    }
  }

  return Array.from(byCategory.values());
}

export async function saveBudgetPlanRows(
  supabase,
  userId,
  monthKey,
  categoryBudgets,
  spentByCategory = {}
) {
  const { year, month } = parseMonthKey(monthKey);
  const now = new Date().toISOString();

  const existing = await fetchBudgetPlanRows(supabase, userId, monthKey);
  const existingByCategory = new Map(
    existing.map((row) => [normalizeCategoryName(row.category), row])
  );

  const entries = Object.entries(categoryBudgets).filter(
    ([, limit]) => Number(limit) > 0
  );

  const savedKeys = new Set(entries.map(([k]) => normalizeCategoryName(k)));

  for (const row of existing) {
    const key = normalizeCategoryName(row.category);
    if (!savedKeys.has(key) && row.id) {
      await supabase.from("budget_plans").delete().eq("id", row.id).eq("user_id", userId);
    }
  }

  for (const [catKey, limit] of entries) {
    const meta = getCategoryMeta(catKey);
    const monthlyLimit = Math.round(Number(limit) || 0);
    const spent = Math.round(spentByCategory[catKey] || 0);
    const payload = {
      user_id: userId,
      category: catKey,
      monthly_limit: monthlyLimit,
      spent,
      color: meta.iconColor,
      icon: meta.iconKey,
      month,
      year,
      updated_at: now,
    };

    const existingRow = existingByCategory.get(catKey);
    if (existingRow?.id) {
      const { error } = await supabase
        .from("budget_plans")
        .update(payload)
        .eq("id", existingRow.id)
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("budget_plans").insert(payload);
      if (error) throw error;
    }
  }

  return fetchBudgetPlanRows(supabase, userId, monthKey);
}

/** Keep `spent` column aligned with real transactions. */
export async function syncSpentFromTransactions(
  supabase,
  userId,
  monthKey,
  transactions
) {
  const spentByCategory = computeSpentByCategoryForMonth(transactions, monthKey);
  const rows = await fetchBudgetPlanRows(supabase, userId, monthKey);
  const now = new Date().toISOString();

  for (const row of rows) {
    const key = normalizeCategoryName(row.category);
    const spent = Math.round(spentByCategory[key] || 0);
    if (Number(row.spent) !== spent) {
      const { error } = await supabase
        .from("budget_plans")
        .update({ spent, updated_at: now })
        .eq("id", row.id)
        .eq("user_id", userId);
      if (error) throw error;
    }
  }

  return fetchBudgetPlanRows(supabase, userId, monthKey);
}

/** Create Supabase rows from transaction spending when table is empty for this month. */
export async function seedBudgetPlansFromTransactions(
  supabase,
  userId,
  monthKey,
  transactions
) {
  const existing = await fetchBudgetPlanRows(supabase, userId, monthKey);
  if (existing.length > 0) return existing;

  const spentByCategory = computeSpentByCategoryForMonth(transactions, monthKey);
  const budgets = {};

  for (const [cat, amount] of Object.entries(spentByCategory)) {
    if (amount > 0) {
      budgets[cat] = defaultBudgetForSpent(amount);
    }
  }

  if (Object.keys(budgets).length === 0) return [];

  return saveBudgetPlanRows(supabase, userId, monthKey, budgets, spentByCategory);
}
