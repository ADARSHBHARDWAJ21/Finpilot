"use server";

import { createClient } from "@/lib/supabase/server-client";
import { computeFinancialSummary } from "@/lib/dashboard/compute-summary";
import { computeDashboardCharts } from "@/lib/dashboard/compute-charts";

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
