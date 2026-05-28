"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { computeBudgetDashboard } from "@/lib/budget/compute-from-transactions";
import { isMissingBudgetPlansTable } from "@/lib/budget/supabase-errors";
import {
  computeSpentByCategoryForMonth,
  distributeTotalBudget,
  fetchBudgetPlanRows,
  rowsToBudgetPlan,
  saveBudgetPlanRows,
  seedBudgetPlansFromTransactions,
  syncSpentFromTransactions,
} from "@/lib/budget/budget-plans-db";
import { serializeBudgetActionResult } from "@/lib/budget/budget-plan-storage";

async function loadBudgetPlanForMonth(supabase, userId, monthKey, transactions) {
  try {
    let rows = await fetchBudgetPlanRows(supabase, userId, monthKey);

    if (rows.length === 0 && (transactions?.length ?? 0) > 0) {
      rows = await seedBudgetPlansFromTransactions(
        supabase,
        userId,
        monthKey,
        transactions
      );
    } else if (rows.length > 0) {
      rows = await syncSpentFromTransactions(
        supabase,
        userId,
        monthKey,
        transactions
      );
    }

    return {
      plan: rowsToBudgetPlan(rows),
      budgetPlansAvailable: true,
      setupHint: null,
      connected: true,
      planRowCount: rows.length,
    };
  } catch (error) {
    if (isMissingBudgetPlansTable(error)) {
      return {
        plan: null,
        budgetPlansAvailable: false,
        setupHint: "budget_plans table not found in Supabase.",
        connected: false,
        planRowCount: 0,
      };
    }
    throw new Error(error.message);
  }
}

export async function getBudgetDashboardData(monthKey) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("id, transaction_date, description, amount, type, category")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  if (txError) {
    console.error("budget transactions:", txError.message);
  }

  const now = new Date();
  const key =
    monthKey ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { plan, budgetPlansAvailable, setupHint, connected, planRowCount } =
    await loadBudgetPlanForMonth(supabase, user.id, key, transactions ?? []);

  const dashboard = computeBudgetDashboard(transactions ?? [], plan, key);

  return {
    transactions: transactions ?? [],
    plan: plan ?? null,
    dashboard,
    budgetPlansAvailable,
    setupHint,
    connected,
    planRowCount,
  };
}

export async function saveBudgetPlan({
  monthKey,
  totalBudget,
  categoryBudgets,
  savingsGoal: _savingsGoal,
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  const key =
    monthKey ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, transaction_date, description, amount, type, category")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  const spentByCategory = computeSpentByCategoryForMonth(transactions ?? [], key);

  let budgets = { ...(categoryBudgets || {}) };
  const total = Math.round(Number(totalBudget) || 0);

  if (Object.keys(budgets).length === 0 && total > 0) {
    const existingRows = await fetchBudgetPlanRows(supabase, user.id, key).catch(() => []);
    const existingPlan = rowsToBudgetPlan(existingRows);
    budgets = distributeTotalBudget(
      total,
      existingPlan?.category_budgets ?? spentByCategory
    );
  } else if (total > 0 && Object.keys(budgets).length > 0) {
    const sum = Object.values(budgets).reduce((s, v) => s + Number(v), 0);
    if (sum !== total && sum > 0) {
      budgets = distributeTotalBudget(total, budgets);
    }
  }

  try {
    const rows = await saveBudgetPlanRows(
      supabase,
      user.id,
      key,
      budgets,
      spentByCategory
    );

    const plan = rowsToBudgetPlan(rows);
    const dashboard = computeBudgetDashboard(transactions ?? [], plan, key);

    revalidatePath("/budget-tracker");
    revalidatePath("/dashboard");

    return serializeBudgetActionResult({
      dashboard,
      plan,
      budgetPlansAvailable: true,
      setupHint: null,
      savedTo: "database",
    });
  } catch (error) {
    if (isMissingBudgetPlansTable(error)) {
      throw new Error(
        "budget_plans table not found. Create it in Supabase with category, monthly_limit, month, and year columns."
      );
    }
    throw new Error(error.message);
  }
}
