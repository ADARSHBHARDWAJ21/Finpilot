import {
  DEFAULT_CATEGORY_KEYS,
  getCategoryMeta,
  normalizeCategoryName,
} from "./category-meta.js";
import { transactionMonthKey, validMonthKey } from "../dashboard/period.js";
import { BUDGET_PLAN_META_CATEGORY, normalizeCategoryBudgets, validateBudgetAmount, validateBudgetCategoryName } from "./category-plan.js";

export function parseMonthKey(monthKey) {
  if (!validMonthKey(monthKey)) throw new Error("Choose a valid budget month.");
  const [y, m] = String(monthKey).split("-");
  const monthNum = Number(m);
  return {
    year: Number(y),
    month: String(monthNum).padStart(2, "0"),
    monthNum,
  };
}

export function txMonthKey(dateStr) {
  return transactionMonthKey(dateStr);
}

function defaultBudgetForSpent(spent) {
  if (spent <= 0) return 5000;
  return Math.ceil((spent * 1.25) / 500) * 500;
}

export function computeSpentByCategoryForMonth(transactions, monthKey) {
  const map = new Map();
  for (const tx of transactions || []) {
    if (txMonthKey(tx.transaction_date) !== monthKey || tx.type !== "expense") continue;
    const cat = normalizeCategoryName(tx.category);
    const amount = Math.abs(Number(tx.amount));
    if (!Number.isFinite(amount)) continue;
    map.set(cat, (map.get(cat) || 0) + amount);
  }
  return Object.fromEntries([...map].map(([category, amount]) => [category, Math.round(amount * 100) / 100]));
}

/** DB rows → shape used by computeBudgetDashboard */
export function rowsToBudgetPlan(rows) {
  if (!rows?.length) return null;

  const category_budgets = {};
  const uniqueRows = dedupeBudgetRows(rows);
  const metadata = uniqueRows.find((row) => row.category === BUDGET_PLAN_META_CATEGORY);
  for (const row of uniqueRows) {
    if (row.category === BUDGET_PLAN_META_CATEGORY) continue;
    const key = normalizeCategoryName(row.category);
    const limit = Number(row.monthly_limit);
    if (!Number.isFinite(limit) || limit < 0 || ["__proto__", "constructor", "prototype"].includes(key.toLowerCase())) continue;
    category_budgets[key] = Math.round(limit * 100) / 100;
  }

  const total_budget = Math.round(Object.values(category_budgets).reduce((sum, v) => sum + v, 0) * 100) / 100;

  return {
    total_budget,
    category_budgets,
    savings_goal: Math.max(0, Number(metadata?.spent) || 0),
    categories_managed: Boolean(metadata),
  };
}

export function distributeTotalBudget(totalBudget, existingBudgets = {}) {
  const total = Math.round(validateBudgetAmount(totalBudget) * 100);
  const budgets = normalizeCategoryBudgets(existingBudgets);
  const keys = Object.keys(budgets);

  if (keys.length > 0) {
    const existingSum = keys.reduce((s, k) => s + budgets[k], 0);
    const map = {};
    let assigned = 0;
    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        map[k] = (total - assigned) / 100;
      } else {
        const share = Math.min(total - assigned, Math.round((existingSum > 0 ? budgets[k] / existingSum : 1 / keys.length) * total));
        map[k] = share / 100;
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
        ? (total - per * (DEFAULT_CATEGORY_KEYS.length - 1)) / 100
        : per / 100;
  });
  return map;
}

export function categoryBudgetsForSave({ categoryBudgets, totalBudget }, existingPlan = null, spentByCategory = {}) {
  if (categoryBudgets !== undefined) return normalizeCategoryBudgets(categoryBudgets);
  const total = validateBudgetAmount(totalBudget, "Total monthly budget");
  if (existingPlan?.categories_managed && !Object.keys(existingPlan.category_budgets).length) {
    if (total > 0) throw new Error("Add a category before setting a monthly budget.");
    return {};
  }
  return distributeTotalBudget(total, existingPlan?.category_budgets ?? spentByCategory);
}

async function readBudgetPlanRows(supabase, userId, monthKey) {
  if (!userId) throw new Error("Please sign in again to manage budgets.");
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

  return data ?? [];
}

export async function fetchBudgetPlanRows(supabase, userId, monthKey) {
  return dedupeBudgetRows(await readBudgetPlanRows(supabase, userId, monthKey));
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
  spentByCategory = {},
  { manageCategories = true, savingsGoal } = {}
) {
  const { year, month } = parseMonthKey(monthKey);
  const now = new Date().toISOString();
  const budgets = normalizeCategoryBudgets(categoryBudgets);

  const existingRaw = await readBudgetPlanRows(supabase, userId, monthKey);
  const existing = dedupeBudgetRows(existingRaw);
  const existingPlan = rowsToBudgetPlan(existing);
  const goal = validateBudgetAmount(savingsGoal ?? existingPlan?.savings_goal ?? 0, "Savings goal");
  const existingByCategory = new Map(
    existing.map((row) => [normalizeCategoryName(row.category), row])
  );

  const entries = Object.entries(budgets);
  if (manageCategories || existingPlan?.categories_managed) entries.push([BUDGET_PLAN_META_CATEGORY, 0]);

  const savedKeys = new Set(entries.map(([k]) => normalizeCategoryName(k)));

  for (const [catKey, limit] of entries) {
    const meta = getCategoryMeta(catKey);
    const monthlyLimit = limit;
    const spent = catKey === BUDGET_PLAN_META_CATEGORY ? goal : Math.round((Number(spentByCategory[catKey]) || 0) * 100) / 100;
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

  // Remove omitted categories and stale duplicate rows in both supported month
  // formats. Leaving an older duplicate would resurrect a deleted category.
  for (const row of existingRaw) {
    const key = normalizeCategoryName(row.category);
    if (row.id && (!savedKeys.has(key) || existingByCategory.get(key)?.id !== row.id)) {
      const { error } = await supabase.from("budget_plans").delete().eq("id", row.id).eq("user_id", userId);
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
    if (row.category === BUDGET_PLAN_META_CATEGORY) continue;
    const key = normalizeCategoryName(row.category);
    const spent = Math.round((Number(spentByCategory[key]) || 0) * 100) / 100;
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
      // Imported spending can carry a legacy or reserved label. Keep that
      // spending in totals without making it an invalid editable budget key.
      try {
        budgets[validateBudgetCategoryName(cat)] = Math.min(1_000_000_000, defaultBudgetForSpent(amount));
      } catch {
        continue;
      }
    }
  }

  if (Object.keys(budgets).length === 0) return [];

  return saveBudgetPlanRows(supabase, userId, monthKey, budgets, spentByCategory, { manageCategories: false });
}
