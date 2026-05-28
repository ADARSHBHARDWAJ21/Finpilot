/** Normalize plan for client state (from DB rows or legacy shape). */
export function normalizeBudgetPlan(plan) {
  if (!plan) return null;
  return {
    total_budget: Number(plan.total_budget) || 0,
    category_budgets: plan.category_budgets || {},
    savings_goal: Number(plan.savings_goal) || 0,
  };
}

/** Payload safe to return from server actions (no transactions array). */
export function serializeBudgetActionResult(data) {
  return {
    dashboard: data.dashboard,
    plan: normalizeBudgetPlan(data.plan),
    budgetPlansAvailable: Boolean(data.budgetPlansAvailable),
    setupHint: data.setupHint ?? null,
    savedTo: data.savedTo ?? "database",
  };
}
