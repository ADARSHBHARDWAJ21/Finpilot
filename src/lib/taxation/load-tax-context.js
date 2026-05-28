import { compareRegimes } from "@/lib/tax/compare-regimes";
import { calculateDeductionUtilization } from "@/lib/tax/deduction-utilization";

function n(value) {
  return Number(value) || 0;
}

function section80cFromOnboarding(profile) {
  if (!profile) return 0;
  return (
    n(profile.elss_investments) +
    n(profile.ppf) +
    n(profile.epf) +
    n(profile.tax_saver_fd) +
    n(profile.life_insurance)
  );
}

function totalByKey(deductions, key) {
  return (deductions ?? [])
    .filter((r) => r.key === key)
    .reduce((sum, r) => sum + n(r.amount), 0);
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

  const profile = salaryProfile ?? onboardingProfile;
  const annualCtc = n(salaryProfile?.annual_ctc ?? onboardingProfile?.annual_ctc);
  const section80c = Math.max(
    totalByKey(deductions, "80C"),
    Math.min(150000, section80cFromOnboarding(onboardingProfile))
  );
  const hraMonthly = n(salaryProfile?.hra ?? onboardingProfile?.hra);
  const rentMonthly = n(onboardingProfile?.monthly_rent);
  const payingRent = Boolean(onboardingProfile?.paying_rent);

  const section80d = Math.min(
    25000,
    Math.max(totalByKey(deductions, "80D"), n(onboardingProfile?.health_insurance))
  );

  const liveCompare = compareRegimes({
    annual_ctc: annualCtc,
    section80c,
    section80d,
    nps: totalByKey(deductions, "80CCD_1B") + n(onboardingProfile?.nps_contribution),
    hra_exemption: payingRent ? Math.min(rentMonthly * 12, hraMonthly * 12) : 0,
  });

  const taxHealthScore =
    onboardingProfile?.ai_summary?.taxHealthScore ??
    (taxCalculation
      ? Math.min(100, Math.round(60 + (taxCalculation.tax_savings > 0 ? 20 : 0)))
      : salaryProfile || onboardingProfile
        ? 45
        : 20);

  const deductionUtilization = calculateDeductionUtilization(deductions ?? []);

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
    recommendedRegime:
      taxCalculation?.recommended_regime ?? liveCompare.recommended,
    estimatedTax:
      taxCalculation?.new_regime_tax ??
      liveCompare.newResult.tax,
    hraExemption: payingRent ? Math.min(rentMonthly * 12, hraMonthly * 12) : 0,
    payingRent,
    rentMonthly,
    hraMonthly,
  };
}
