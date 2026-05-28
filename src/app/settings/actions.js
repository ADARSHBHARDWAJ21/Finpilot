"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { syncOnboardingToModules } from "@/lib/onboarding/sync-to-modules";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isBlank(value) {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function normalizeOnboardingPayload(data) {
  const out = { ...data };

  const numericKeys = [
    "age",
    "annual_ctc",
    "monthly_inhand_salary",
    "basic_salary",
    "hra",
    "special_allowance",
    "bonus",
    "employer_pf",
    "employer_nps",
    "monthly_tds",
    "elss_investments",
    "ppf",
    "epf",
    "tax_saver_fd",
    "life_insurance",
    "health_insurance",
    "parents_health_insurance",
    "nps_contribution",
    "home_loan_interest",
    "education_loan_interest",
    "monthly_rent",
    "monthly_food_spend",
    "monthly_transport_spend",
    "monthly_shopping_spend",
    "sip_amount",
    "emi_obligations",
    "savings_goal",
    "side_income",
  ];

  for (const key of numericKeys) {
    if (!(key in out)) continue;
    const raw = out[key];
    if (isBlank(raw)) {
      out[key] = key === "age" ? null : 0;
      continue;
    }
    out[key] = key === "age" ? Math.round(toNum(raw)) : toNum(raw);
  }

  const boolKeys = [
    "paying_rent",
    "home_loan_active",
    "expecting_salary_hike",
    "planning_home_loan",
    "planning_car_loan",
    "planning_investments",
    "planning_side_income",
  ];

  for (const key of boolKeys) {
    if (key in out) out[key] = Boolean(out[key]);
  }

  return out;
}

export async function updateSettingsAndSync(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const normalized = normalizeOnboardingPayload(formData || {});

  // Keep these stable fields safe.
  normalized.user_id = user.id;
  normalized.email = user.email ?? normalized.email ?? "";

  const { data: existing } = await supabase
    .from("onboarding_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let profileRow = existing?.id
    ? (
        await supabase
          .from("onboarding_profiles")
          .update({ ...normalized, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .select("*")
          .single()
      ).data
    : (
        await supabase
          .from("onboarding_profiles")
          .insert({ ...normalized, onboarding_completed: false, current_step: 7 })
          .select("*")
          .single()
      ).data;

  if (!profileRow) throw new Error("Failed to update onboarding profile");

  // Recompute salary/deductions/tax calculations from onboarding data.
  const summary = await syncOnboardingToModules(supabase, user.id, profileRow);

  const nowIso = new Date().toISOString();
  await supabase
    .from("onboarding_profiles")
    .update({
      onboarding_completed: true,
      completed_at: nowIso,
      current_step: 7,
      ai_summary: summary,
      updated_at: nowIso,
    })
    .eq("user_id", user.id);

  const taxContext = await loadTaxContext(supabase, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/taxation");
  revalidatePath("/budget-tracker");
  revalidatePath("/reports");

  return { taxContext };
}

