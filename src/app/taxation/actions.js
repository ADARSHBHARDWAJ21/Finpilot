"use server";

import { createClient } from "@/lib/supabase/server-client";
import { compareRegimes } from "@/lib/tax/compare-regimes";
import { calculateDeductionUtilization } from "@/lib/tax/deduction-utilization";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildAiInsightsFromDeductions(deductionSummary) {
  const insights = [];

  const deduction80c = deductionSummary.find((d) => d.key === "80C");
  if (deduction80c && deduction80c.remaining > 50000) {
    insights.push(
      "You are underutilizing 80C deductions. Add eligible investments to reduce tax."
    );
  }

  const deduction80d = deductionSummary.find((d) => d.key === "80D");
  if (deduction80d && deduction80d.remaining > 10000) {
    insights.push(
      "You can still claim 80D benefits through health insurance premiums."
    );
  }

  const deductionNps = deductionSummary.find((d) => d.key === "80CCD_1B");
  if (deductionNps && deductionNps.remaining > 25000) {
    insights.push("NPS (80CCD(1B)) is underused and can improve your tax savings.");
  }

  return insights;
}

async function getCurrentUserOrThrow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

export async function saveSalaryProfile(formData) {
  const { supabase, user } = await getCurrentUserOrThrow();

  const payload = {
    user_id: user.id,
    annual_ctc: toNumber(formData.annual_ctc),
    basic_salary: toNumber(formData.basic_salary),
    hra: toNumber(formData.hra),
    special_allowance: toNumber(formData.special_allowance),
    bonus: toNumber(formData.bonus),
    employer_pf: toNumber(formData.employer_pf),
    employer_nps: toNumber(formData.employer_nps),
    tax_regime: formData.tax_regime || "new",
  };

  const { data, error } = await supabase.from("salary_profiles").insert([payload]).select();

  if (error) {
    throw new Error(error.message);
  }

  const result = compareRegimes({
    annual_ctc: payload.annual_ctc,
    section80c: payload.employer_pf,
    nps: payload.employer_nps,
    hra_exemption: payload.hra,
  });

  const { error: calcError } = await supabase.from("tax_calculations").upsert(
    {
      user_id: user.id,
      old_regime_tax: result.oldResult.tax,
      new_regime_tax: result.newResult.tax,
      old_taxable_income: result.oldResult.taxableIncome,
      new_taxable_income: result.newResult.taxableIncome,
      recommended_regime: result.recommended,
      tax_savings: result.savings,
    },
    { onConflict: "user_id" }
  );

  if (calcError) {
    throw new Error(calcError.message);
  }

  return { profile: data?.[0] ?? null, taxResult: result };
}

export async function addDeduction(input) {
  const { supabase, user } = await getCurrentUserOrThrow();

  const payload = {
    user_id: user.id,
    key: input.key,
    amount: toNumber(input.amount),
  };

  const { data, error } = await supabase.from("deductions").insert([payload]).select().single();
  if (error) {
    throw new Error(error.message);
  }

  await refreshAiInsights(supabase, user.id);
  return data;
}

export async function updateDeduction(id, input) {
  const { supabase, user } = await getCurrentUserOrThrow();

  const { data, error } = await supabase
    .from("deductions")
    .update({
      key: input.key,
      amount: toNumber(input.amount),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await refreshAiInsights(supabase, user.id);
  return data;
}

export async function deleteDeduction(id) {
  const { supabase, user } = await getCurrentUserOrThrow();

  const { error } = await supabase.from("deductions").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    throw new Error(error.message);
  }

  await refreshAiInsights(supabase, user.id);
}

export async function setPreferredTaxRegime(regime) {
  const { supabase, user } = await getCurrentUserOrThrow();
  const normalized = regime === "old" || regime === "new" ? regime : null;
  if (!normalized) {
    throw new Error("Invalid tax regime");
  }

  const { error: profileError } = await supabase
    .from("onboarding_profiles")
    .update({ tax_regime: normalized })
    .eq("user_id", user.id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: latestSalary } = await supabase
    .from("salary_profiles")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSalary?.id) {
    const { error: salaryError } = await supabase
      .from("salary_profiles")
      .update({ tax_regime: normalized })
      .eq("id", latestSalary.id)
      .eq("user_id", user.id);

    if (salaryError) {
      throw new Error(salaryError.message);
    }
  }

  return { regime: normalized };
}

export async function listDeductions() {
  const { supabase, user } = await getCurrentUserOrThrow();

  const { data, error } = await supabase
    .from("deductions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function refreshAiInsights(supabase, userId) {
  const { data: deductions, error } = await supabase.from("deductions").select("*").eq("user_id", userId);
  if (error) return;

  const utilization = calculateDeductionUtilization(deductions ?? []);
  const messages = buildAiInsightsFromDeductions(utilization);
  if (!messages.length) return;

  // Best-effort insight persistence. Do not break core flow if table shape differs.
  await supabase.from("ai_insights").upsert(
    messages.map((message) => ({
      user_id: userId,
      insight_type: "deduction",
      message,
    })),
    { onConflict: "user_id,message" }
  );
}

