import { calculateDeductionUtilization } from "@/lib/tax/deduction-utilization";
import { computeLiveRegimeCompare } from "@/lib/taxation/build-regime-compare-data";

function n(value) {
  return Number(value) || 0;
}

export async function loadTaxContext(supabase, userId) {
  const [
    { data: salaryProfile },
    { data: deductions },
    { data: taxCalculation },
    { data: onboardingProfile },
  ] = await Promise.all([
    supabase
      .from("salary_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("deductions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("tax_calculations").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("onboarding_profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const annualCtc = n(salaryProfile?.annual_ctc ?? onboardingProfile?.annual_ctc);
  const hraMonthly = n(salaryProfile?.hra ?? onboardingProfile?.hra);
  const rentMonthly = n(onboardingProfile?.monthly_rent);
  const payingRent = Boolean(onboardingProfile?.paying_rent);
  const hraExemption = payingRent ? Math.min(rentMonthly * 12, hraMonthly * 12) : 0;

  const taxHealthScore =
    onboardingProfile?.ai_summary?.taxHealthScore ??
    (taxCalculation
      ? Math.min(100, Math.round(60 + (taxCalculation.tax_savings > 0 ? 20 : 0)))
      : salaryProfile || onboardingProfile
        ? 45
        : 20);

  const deductionUtilization = calculateDeductionUtilization(deductions ?? []);

  const liveCompare = computeLiveRegimeCompare({
    salaryProfile,
    onboardingProfile,
    deductions: deductions ?? [],
    annualCtc,
    hraExemption,
  });

  const userName =
    onboardingProfile?.full_name ||
    authUser?.email?.split("@")[0] ||
    "User";

  return {
    userName,
    financialYear: onboardingProfile?.financial_year ?? "2024-25",
    salaryProfile,
    deductions: deductions ?? [],
    taxCalculation,
    onboardingProfile,
    annualCtc,
    taxHealthScore,
    deductionUtilization,
    liveCompare,
    recommendedRegime: liveCompare.recommended,
    estimatedTax:
      liveCompare.recommended === "old"
        ? liveCompare.oldResult.tax
        : liveCompare.newResult.tax,
    estimatedTaxOld: liveCompare.oldResult.tax,
    estimatedTaxNew: liveCompare.newResult.tax,
    hraExemption,
    payingRent,
    rentMonthly,
    hraMonthly,
  };
}
