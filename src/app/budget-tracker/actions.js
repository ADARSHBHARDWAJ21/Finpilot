"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { computeBudgetDashboard } from "@/lib/budget/compute-from-transactions";
import { isMissingBudgetPlansTable } from "@/lib/budget/supabase-errors";
import {
  computeSpentByCategoryForMonth,
  categoryBudgetsForSave,
  fetchBudgetPlanRows,
  rowsToBudgetPlan,
  saveBudgetPlanRows,
  seedBudgetPlansFromTransactions,
  syncSpentFromTransactions,
} from "@/lib/budget/budget-plans-db";
import { serializeBudgetActionResult } from "@/lib/budget/budget-plan-storage";
import { currentMonthKey } from "@/lib/dashboard/period";
import { loadOwnedTransactions } from "@/lib/transactions/records";

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

  const transactions = await loadOwnedTransactions(supabase, user.id);
  const key = monthKey || currentMonthKey();

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
  savingsGoal,
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const key = monthKey || currentMonthKey();
  const transactions = await loadOwnedTransactions(supabase, user.id);

  const spentByCategory = computeSpentByCategoryForMonth(transactions ?? [], key);

  let existingPlan = null;
  if (categoryBudgets === undefined) {
    const existingRows = await fetchBudgetPlanRows(supabase, user.id, key);
    existingPlan = rowsToBudgetPlan(existingRows);
  }
  // An explicit map is authoritative, including {} and zero amounts. Only
  // total-only requests redistribute the existing active category amounts.
  const budgets = categoryBudgetsForSave({ categoryBudgets, totalBudget }, existingPlan, spentByCategory);

  try {
    const rows = await saveBudgetPlanRows(
      supabase,
      user.id,
      key,
      budgets,
      spentByCategory,
      { savingsGoal }
    );

    const plan = rowsToBudgetPlan(rows);
    const dashboard = computeBudgetDashboard(transactions ?? [], plan, key);

    revalidatePath("/budget-tracker");
    revalidatePath("/dashboard");
    revalidatePath("/taxation/ai-copilot");

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
