"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { computeOnboardingFinancialSummary } from "@/lib/onboarding/compute-financial-summary";
import { syncOnboardingToModules } from "@/lib/onboarding/sync-to-modules";

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isBlank(value) {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function normalizePayload(data) {
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
    "current_step",
  ];

  for (const key of numericKeys) {
    if (!(key in out)) continue;
    const raw = out[key];
    if (isBlank(raw)) {
      // Postgres rejects "" for numeric columns
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
    if (key in out) {
      out[key] = Boolean(out[key]);
    }
  }

  if (out.documents && typeof out.documents === "object") {
    out.documents = out.documents;
  }

  return out;
}

export async function getOnboardingState() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error } = await supabase
    .from("onboarding_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && !String(error.message).includes("onboarding_profiles")) {
    throw new Error(error.message);
  }

  return {
    email: user.email ?? "",
    profile: profile ?? null,
    completed: Boolean(profile?.onboarding_completed),
  };
}

export async function saveOnboardingStep(step, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const payload = normalizePayload({
    ...formData,
    email: user.email,
    current_step: step,
    updated_at: new Date().toISOString(),
  });

  const { data: existing } = await supabase
    .from("onboarding_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let profile;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("onboarding_profiles")
      .update(payload)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    profile = data;
  } else {
    const { data, error } = await supabase
      .from("onboarding_profiles")
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    profile = data;
  }

  return { profile, step };
}

export async function completeOnboarding(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await saveOnboardingStep(6, formData);

  const { data: profile, error: fetchError } = await supabase
    .from("onboarding_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const summary = await syncOnboardingToModules(supabase, user.id, profile);

  const { error: updateError } = await supabase
    .from("onboarding_profiles")
    .update({
      onboarding_completed: true,
      completed_at: new Date().toISOString(),
      current_step: 7,
      ai_summary: summary,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/taxation");
  revalidatePath("/budget-tracker");

  return { summary };
}

