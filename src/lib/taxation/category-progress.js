import { TAX_CATEGORIES } from "@/lib/taxation/categories";

function n(value) {
  return Number(value) || 0;
}

function totalByKey(deductions, key) {
  return (deductions ?? [])
    .filter((r) => r.key === key)
    .reduce((sum, r) => sum + n(r.amount), 0);
}

/** Returns { completed, total, percent } per category slug from real profile data. */
export function getCategoryProgress(ctx) {
  const { salaryProfile, onboardingProfile, deductions, taxCalculation } = ctx;
  const profile = salaryProfile ?? onboardingProfile;

  const checks = {
    "salary-documents": {
      form16: false,
      salary_slips: false,
      offer_letter: false,
      salary_profile: Boolean(salaryProfile?.annual_ctc || onboardingProfile?.annual_ctc),
    },
    "tax-saving-proofs": {
      "80c": totalByKey(deductions, "80C") > 0 || n(onboardingProfile?.elss_investments) > 0,
      "80d":
        totalByKey(deductions, "80D") > 0 ||
        n(onboardingProfile?.health_insurance) > 0,
      nps:
        totalByKey(deductions, "80CCD_1B") > 0 ||
        n(onboardingProfile?.nps_contribution) > 0,
      deductions_db: (deductions?.length ?? 0) > 0,
    },
    "rent-hra": {
      rent_receipts: false,
      lease: false,
      hra_declared: n(profile?.hra) > 0,
      paying_rent: Boolean(onboardingProfile?.paying_rent),
    },
    "banking-investments": {
      fd_interest: n(onboardingProfile?.tax_saver_fd) > 0,
      capital_gains: false,
      demat: false,
      sip: n(onboardingProfile?.sip_amount) > 0,
    },
    "compliance-filing": {
      ais: false,
      regime: Boolean(taxCalculation?.recommended_regime || profile?.tax_regime),
      tax_paid: n(profile?.monthly_tds) > 0 || n(onboardingProfile?.monthly_tds) > 0,
      itr: Boolean(onboardingProfile?.onboarding_completed),
    },
  };

  const bySlug = {};
  for (const cat of TAX_CATEGORIES) {
    const map = checks[cat.slug] ?? {};
    const ids = cat.checklist.map((c) => c.id);
    const completed = ids.filter((id) => map[id]).length;
    bySlug[cat.slug] = {
      completed,
      total: ids.length,
      percent: Math.round((completed / ids.length) * 100),
      items: cat.checklist.map((item) => ({
        ...item,
        done: Boolean(map[item.id]),
      })),
    };
  }

  return bySlug;
}
