import { estimateTax, profileTaxInputs } from "../copilot/tax-engine.js";
import { computeOnboardingFinancialSummary } from "./compute-financial-summary.js";
import { currentMonthKey } from "../dashboard/period.js";
import { fetchBudgetPlanRows, parseMonthKey } from "../budget/budget-plans-db.js";
import { BUDGET_PLAN_META_CATEGORY } from "../budget/category-plan.js";
import { normalizeCategoryName } from "../budget/category-meta.js";

function n(value) {
  return Number(value) || 0;
}

function section80cTotal(profile) {
  return (
    n(profile.elss_investments) +
    n(profile.ppf) +
    n(profile.epf) +
    n(profile.tax_saver_fd) +
    n(profile.life_insurance)
  );
}

/** Push onboarding profile into taxation, budget, and insights tables. */
export async function syncOnboardingToModules(supabase, userId, profile, now = new Date()) {
  const summary = computeOnboardingFinancialSummary(profile);
  const regime = summary.chosenRegime === "old" ? "old" : "new";

  const { error: salaryError } = await supabase.from("salary_profiles").insert({
    user_id: userId,
    annual_ctc: n(profile.annual_ctc),
    basic_salary: n(profile.basic_salary),
    hra: n(profile.hra),
    special_allowance: n(profile.special_allowance),
    bonus: n(profile.bonus),
    employer_pf: n(profile.employer_pf),
    employer_nps: n(profile.employer_nps),
    tax_regime: regime,
  });

  if (salaryError) throw new Error("Your profile was saved, but salary records could not be updated. Please retry.");

  // Onboarding is a declaration source, not a new deduction transaction.
  // Do not insert duplicate deduction rows whenever Settings is saved.
  const tax = estimateTax(profileTaxInputs(profile));
  if (tax.available) {
    const { error } = await supabase.from("tax_calculations").upsert({
      user_id: userId, old_regime_tax: tax.old.tax, new_regime_tax: tax.new.tax,
      old_taxable_income: tax.old.taxableIncome, new_taxable_income: tax.new.taxableIncome,
      recommended_regime: tax.recommended === "equal" ? regime : tax.recommended, tax_savings: tax.difference,
    }, { onConflict: "user_id" });
    if (error) throw new Error("Your profile was saved, but the tax summary could not be updated. Please retry.");
  }

  await syncOnboardingBudgetDefaults(supabase, userId, profile, now);

  const insightMessages = summary.insights.map((message) => ({
    user_id: userId,
    insight_type: "onboarding",
    message,
  }));

  if (insightMessages.length) {
    await supabase.from("ai_insights").upsert(insightMessages, { onConflict: "user_id,message" });
  }

  return summary;
}

/** Profile spending supplies initial defaults, never user-managed budgets. */
export async function syncOnboardingBudgetDefaults(supabase, userId, profile, now = new Date()) {
  const key = currentMonthKey(now);
  const { month, year } = parseMonthKey(key);
  let existingRows;
  try {
    // The shared reader checks both month formats and propagates read errors.
    // Unknown saved state must never be treated as an empty budget plan.
    existingRows = await fetchBudgetPlanRows(supabase, userId, key);
  } catch {
    throw new Error("Your profile was saved, but budget records could not be checked. Please retry.");
  }
  if (existingRows.some((row) => row.category === BUDGET_PLAN_META_CATEGORY)) return;

  const existingByCategory = new Map(existingRows.map((row) => [normalizeCategoryName(row.category), row]));

  const budgetCategories = [
    { category: "Food", monthly_limit: n(profile.monthly_food_spend), icon: "utensils" },
    { category: "Transport", monthly_limit: n(profile.monthly_transport_spend), icon: "car" },
    { category: "Shopping", monthly_limit: n(profile.monthly_shopping_spend), icon: "shopping-bag" },
  ].filter((b) => b.monthly_limit > 0);

  for (const row of budgetCategories) {
    const existing = existingByCategory.get(row.category);

    const payload = {
      user_id: userId,
      category: row.category,
      monthly_limit: row.monthly_limit,
      spent: 0,
      icon: row.icon,
      month,
      year,
      updated_at: new Date(now).toISOString(),
    };

    const result = existing?.id
      ? await supabase.from("budget_plans").update(payload).eq("id", existing.id).eq("user_id", userId)
      : await supabase.from("budget_plans").insert(payload);
    if (result.error) throw new Error("Your profile was saved, but budget records could not be updated. Please retry.");
  }
}
