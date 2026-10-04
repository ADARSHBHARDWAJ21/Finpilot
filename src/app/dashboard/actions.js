"use server";

import { createClient } from "@/lib/supabase/server-client";
import { computeFinancialSummary } from "@/lib/dashboard/compute-summary";
import { computeDashboardCharts } from "@/lib/dashboard/compute-charts";
import { computeDashboardOverview } from "@/lib/dashboard/compute-overview";
import { currentMonthKey, resolveMonthKey, shiftMonth } from "@/lib/dashboard/period";
import { fetchBudgetPlanRows } from "@/lib/budget/budget-plans-db";

export async function getOnboardingProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("onboarding_profiles")
    .select("full_name, ai_summary, onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

async function loadUserTransactions(supabase, userId) {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("transaction_date, amount, type, category")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return transactions ?? [];
}

async function loadFinancialProfile(supabase, userId) {
  const { data } = await supabase
    .from("onboarding_profiles")
    .select(
      "annual_ctc, monthly_inhand_salary, elss_investments, ppf, epf, tax_saver_fd, life_insurance, nps_contribution, employer_nps, sip_amount, emi_obligations, home_loan_active, monthly_food_spend, monthly_transport_spend, monthly_shopping_spend"
    )
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

export async function getFinancialSummary() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const transactions = await loadUserTransactions(supabase, user.id);

  return computeFinancialSummary(transactions);
}

export async function getDashboardChartsData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [transactions, profile] = await Promise.all([
    loadUserTransactions(supabase, user.id),
    loadFinancialProfile(supabase, user.id),
  ]);

  return computeDashboardCharts(transactions, profile);
}

export async function getDashboardOverview(requestedMonth) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const now = new Date();
  const selectedMonth = resolveMonthKey(requestedMonth, now);
  const transactions = [];
  // Read every page: Supabase's default row limit must not truncate a bank history.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("transactions")
      .select("id, transaction_date, description, amount, type, category")
      .eq("user_id", user.id)
      .lt("transaction_date", `${shiftMonth(currentMonthKey(now), 1)}-01`)
      .order("transaction_date", { ascending: true }).order("id", { ascending: true })
      .range(offset, offset + 999);
    if (error) throw new Error("Dashboard transactions could not be loaded.");
    transactions.push(...(data || []));
    if ((data?.length || 0) < 1000) break;
  }
  const [profileResult, budgetResult] = await Promise.allSettled([
    supabase.from("onboarding_profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    fetchBudgetPlanRows(supabase, user.id, selectedMonth),
  ]);
  return {
    ...computeDashboardOverview(transactions, budgetResult.status === "fulfilled" ? budgetResult.value : [], selectedMonth, now),
    fullName: profileResult.status === "fulfilled" ? profileResult.value.data?.full_name : "",
    budgetAvailable: budgetResult.status === "fulfilled",
    updatedAt: now.toISOString(),
  };
}
