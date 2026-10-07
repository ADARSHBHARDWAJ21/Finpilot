import { loadTaxWorkspace } from "./data.js";
import { loadOwnedTransactions } from "../transactions/records.js";
import { buildFinanceReport } from "./reports.js";
export async function loadFinanceProfile(supabase, userId) {
  const [profile, salary, deductions] = await Promise.all([
    supabase
      .from("onboarding_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("salary_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("deductions").select("*").eq("user_id", userId).limit(1000),
  ]);
  if ([profile, salary, deductions].some((r) => r.error))
    throw new Error(
      "Your financial profile could not be loaded. Please refresh.",
    );
  return {
    profile: profile.data || {},
    salary: salary.data,
    deductions: deductions.data || [],
  };
}
export async function loadFinanceReport(supabase, userId, year) {
  const [base, workspace, transactions] = await Promise.all([
    loadFinanceProfile(supabase, userId),
    loadTaxWorkspace(supabase, userId, year),
    loadOwnedTransactions(supabase, userId),
  ]);
  return buildFinanceReport({ ...base, workspace, transactions });
}
