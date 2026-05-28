import { compareRegimes } from "@/lib/tax/compare-regimes";
import { computeOnboardingFinancialSummary } from "@/lib/onboarding/compute-financial-summary";

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
export async function syncOnboardingToModules(supabase, userId, profile) {
  const summary = computeOnboardingFinancialSummary(profile);
  const regime = summary.chosenRegime === "old" ? "old" : "new";

  await supabase.from("salary_profiles").insert({
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

  const deductionRows = [
    { key: "80C", amount: Math.min(150000, section80cTotal(profile)) },
    { key: "80D", amount: n(profile.health_insurance) + n(profile.parents_health_insurance) },
    { key: "80CCD_1B", amount: n(profile.nps_contribution) },
  ].filter((d) => d.amount > 0);

  if (deductionRows.length) {
    await supabase.from("deductions").insert(
      deductionRows.map((d) => ({ user_id: userId, key: d.key, amount: d.amount }))
    );
  }

  const taxCompare = compareRegimes({
    annual_ctc: n(profile.annual_ctc),
    section80c: Math.min(150000, section80cTotal(profile)),
    nps: n(profile.nps_contribution) + n(profile.employer_nps),
    hra_exemption: profile.paying_rent
      ? Math.min(n(profile.monthly_rent) * 12, n(profile.hra) * 12)
      : 0,
  });

  await supabase.from("tax_calculations").upsert(
    {
      user_id: userId,
      old_regime_tax: taxCompare.oldResult.tax,
      new_regime_tax: taxCompare.newResult.tax,
      old_taxable_income: taxCompare.oldResult.taxableIncome,
      new_taxable_income: taxCompare.newResult.taxableIncome,
      recommended_regime: taxCompare.recommended,
      tax_savings: taxCompare.savings,
    },
    { onConflict: "user_id" }
  );

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const budgetCategories = [
    { category: "Food", monthly_limit: n(profile.monthly_food_spend), icon: "utensils" },
    { category: "Transport", monthly_limit: n(profile.monthly_transport_spend), icon: "car" },
    { category: "Shopping", monthly_limit: n(profile.monthly_shopping_spend), icon: "shopping-bag" },
  ].filter((b) => b.monthly_limit > 0);

  for (const row of budgetCategories) {
    const { data: existing } = await supabase
      .from("budget_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month)
      .eq("category", row.category)
      .maybeSingle();

    const payload = {
      user_id: userId,
      category: row.category,
      monthly_limit: row.monthly_limit,
      spent: 0,
      icon: row.icon,
      month,
      year,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from("budget_plans").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("budget_plans").insert(payload);
    }
  }

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
