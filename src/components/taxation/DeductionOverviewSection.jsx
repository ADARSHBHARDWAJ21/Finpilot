"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Download,
  HeartPulse,
  House,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Accessibility,
  GraduationCap,
} from "lucide-react";

function n(value) {
  return Number(value) || 0;
}

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function totalByKey(deductions, key) {
  return (deductions ?? [])
    .filter((r) => String(r.key || "").toUpperCase() === String(key).toUpperCase())
    .reduce((sum, r) => sum + n(r.amount), 0);
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

export default function DeductionOverviewSection({ taxContext }) {
  const [showAll, setShowAll] = useState(false);
  const onboardingProfile = taxContext.onboardingProfile ?? {};
  const deductions = taxContext.deductions ?? [];

  const data = useMemo(() => {
    const annualCtc = n(taxContext.annualCtc);
    const estimatedTax = n(taxContext.estimatedTax);
    const effectiveTaxRate =
      annualCtc > 0 ? Math.min(0.35, Math.max(0.05, estimatedTax / annualCtc)) : 0.2;

    const claimed80c = Math.min(
      150000,
      Math.max(totalByKey(deductions, "80C"), section80cFromOnboarding(onboardingProfile))
    );
    const insuranceSelfFamily = Math.max(
      totalByKey(deductions, "80D"),
      n(onboardingProfile.health_insurance)
    );
    const insuranceParents = n(onboardingProfile.parents_health_insurance);
    const section80dLimit = insuranceParents > 0 ? 50000 : 25000;
    const claimed80d = Math.min(
      section80dLimit,
      insuranceSelfFamily + insuranceParents
    );
    const claimedNps = Math.min(
      50000,
      totalByKey(deductions, "80CCD_1B") + n(onboardingProfile.nps_contribution)
    );
    const claimedHra = Math.max(0, n(taxContext.hraExemption));
    const hraEligible = taxContext.payingRent
      ? Math.max(claimedHra, n(onboardingProfile.monthly_rent) * 12)
      : 0;
    const claimed80e = Math.max(
      totalByKey(deductions, "80E"),
      n(onboardingProfile.education_loan_interest)
    );
    const claimed24b = Math.max(
      totalByKey(deductions, "24B") + totalByKey(deductions, "24b"),
      n(onboardingProfile.home_loan_interest)
    );
    const claimed80dd = totalByKey(deductions, "80DD");

    const rows = [
      {
        id: "80C",
        title: "Section 80C",
        desc: "Investments in ELSS, PPF, EPF, Life insurance, Tax Saver FD, etc.",
        action: "View Eligible Investments",
        typeLabel: "Claimed",
        claimed: claimed80c,
        eligible: 150000,
        limitLabel: "₹1,50,000",
        progressColor: "bg-emerald-500",
        Icon: ShieldCheck,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        id: "80D",
        title: "Section 80D",
        desc: "Health insurance premium for self, family & parents.",
        action: "View Eligible Expenses",
        typeLabel: "Claimed",
        claimed: claimed80d,
        eligible: section80dLimit,
        limitLabel: formatInr(section80dLimit),
        progressColor: "bg-blue-500",
        Icon: HeartPulse,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        id: "HRA",
        title: "House Rent Allowance",
        desc: "Exemption on rent paid if you live in a rented house.",
        action: "View HRA Calculation",
        typeLabel: "Eligible",
        claimed: claimedHra,
        eligible: hraEligible,
        limitLabel: hraEligible > 0 ? formatInr(hraEligible) : "Not eligible",
        progressColor: "bg-indigo-500",
        Icon: House,
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-600",
      },
      {
        id: "80CCD_1B",
        title: "Section 80CCD(1B)",
        desc: "Additional deduction for NPS contribution.",
        action: "View Details",
        typeLabel: "Claimed",
        claimed: claimedNps,
        eligible: 50000,
        limitLabel: "₹50,000",
        progressColor: "bg-orange-500",
        Icon: PiggyBank,
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
      },
      {
        id: "80E",
        title: "Section 80E",
        desc: "Interest on education loan.",
        action: "View Details",
        typeLabel: "Claimed",
        claimed: claimed80e,
        eligible: 0,
        limitLabel: "No Limit",
        progressColor: "bg-violet-500",
        Icon: GraduationCap,
        iconBg: "bg-violet-50",
        iconColor: "text-violet-600",
      },
      {
        id: "24B",
        title: "Home Loan Interest",
        desc: "Interest paid on home loan.",
        action: "View Details",
        typeLabel: "Claimed",
        claimed: claimed24b,
        eligible: 200000,
        limitLabel: "₹2,00,000",
        progressColor: "bg-cyan-500",
        Icon: Landmark,
        iconBg: "bg-cyan-50",
        iconColor: "text-cyan-600",
      },
      {
        id: "80DD",
        title: "Section 80DD",
        desc: "Deduction for disabled dependents.",
        action: "View Details",
        typeLabel: "Claimed",
        claimed: claimed80dd,
        eligible: 75000,
        limitLabel: "₹75,000",
        progressColor: "bg-pink-500",
        Icon: Accessibility,
        iconBg: "bg-pink-50",
        iconColor: "text-pink-600",
      },
    ];

    const totalEligible = rows
      .filter((r) => r.eligible > 0)
      .reduce((sum, r) => sum + r.eligible, 0);
    const totalClaimed = rows
      .filter((r) => r.eligible > 0)
      .reduce((sum, r) => sum + Math.min(r.claimed, r.eligible), 0);
    const totalRemaining = Math.max(0, totalEligible - totalClaimed);
    const potentialTaxSaving = Math.round(totalRemaining * effectiveTaxRate);
    const claimedTaxSaving = Math.round(totalClaimed * effectiveTaxRate);
    const overallPercent = totalEligible > 0 ? Math.round((totalClaimed / totalEligible) * 100) : 0;

    const insights = rows
      .filter((r) => r.eligible > 0)
      .map((r) => ({ ...r, remaining: Math.max(0, r.eligible - Math.min(r.claimed, r.eligible)) }))
      .filter((r) => r.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 3)
      .map((r) => ({
        title:
          r.id === "80C"
            ? "Invest more in 80C"
            : r.id === "80D"
              ? "Increase Health Insurance"
              : r.id === "80CCD_1B"
                ? "Consider NPS Voluntary"
                : `Increase ${r.title}`,
        desc: `Add ${formatInr(r.remaining)} to save ${formatInr(Math.round(r.remaining * effectiveTaxRate))}`,
      }));

    return {
      rows,
      totalEligible,
      totalClaimed,
      totalRemaining,
      potentialTaxSaving,
      claimedTaxSaving,
      overallPercent,
      insights,
    };
  }, [
    deductions,
    onboardingProfile,
    taxContext.annualCtc,
    taxContext.estimatedTax,
    taxContext.hraExemption,
    taxContext.payingRent,
  ]);

  const initials = String(taxContext.userName || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const visibleRows = showAll ? data.rows : data.rows.slice(0, 5);

  return (
    <div className="w-full max-w-[1500px] min-w-0 pb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <Link
            href="/taxation"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-indigo-600 mb-3"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Deduction Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s a breakdown of all deductions you can claim and your current utilization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <CircleHelp size={16} />
            Need Help?
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="p-5 md:border-r border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Potential Tax Saving</p>
                <p className="text-4xl font-bold text-emerald-600 mt-1">{formatInr(data.potentialTaxSaving)}</p>
                <p className="text-xs text-gray-500 mt-1">from available deductions</p>
              </div>
              <div className="p-5 md:border-r border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Deductions Claimed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatInr(data.totalClaimed)}</p>
                <p className="text-xs text-gray-500 mt-0.5">of {formatInr(data.totalEligible)}</p>
                <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.overallPercent}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{data.overallPercent}%</p>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Deductions Remaining</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatInr(data.totalRemaining)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{Math.max(0, 100 - data.overallPercent)}%</p>
                    <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden w-40">
                      <div
                        className="h-full bg-gray-300 rounded-full"
                        style={{ width: `${Math.max(0, 100 - data.overallPercent)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <WalletCards size={26} className="text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Deductions You Can Claim</h2>
            <div className="space-y-2">
              {visibleRows.map((row) => {
                const claimed = row.eligible > 0 ? Math.min(row.claimed, row.eligible) : row.claimed;
                const percent = row.eligible > 0 ? Math.round((claimed / row.eligible) * 100) : 0;
                const Icon = row.Icon;
                return (
                  <div key={row.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl ${row.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon size={20} className={row.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{row.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{row.desc}</p>
                            <Link href="/taxation/ai-copilot" className="text-xs text-emerald-600 font-medium mt-1 inline-block">
                              {row.action}
                            </Link>
                          </div>
                          <button type="button" className="text-gray-300 hover:text-gray-500">
                            <ChevronRight size={18} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-500">{row.typeLabel}</span>
                          <span className="font-semibold text-gray-900">
                            {formatInr(claimed)} <span className="text-gray-500 font-normal">of {row.limitLabel}</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full ${row.progressColor} rounded-full`} style={{ width: `${percent}%` }} />
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{percent}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {data.rows.length > 5 && (
              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {showAll ? "Show Less Deductions" : "Show More Deductions"}
                  <ChevronDown size={16} className={showAll ? "rotate-180 transition-transform" : "transition-transform"} />
                </button>
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <p className="text-base font-semibold text-gray-900">Want to maximize your tax savings?</p>
              <p className="text-sm text-gray-500 mt-1">
                Let our AI analyze your profile and suggest the best investment options.
              </p>
            </div>
            <Link
              href="/taxation/ai-copilot"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm whitespace-nowrap"
            >
              Get AI Recommendations
              <Sparkles size={16} />
            </Link>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Sparkles size={16} className="text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">AI Deduction Insights</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              You can save more tax by claiming these missed deductions.
            </p>
            <div className="space-y-2">
              {(data.insights.length ? data.insights : [{ title: "No major gaps found", desc: "Your deductions look healthy." }]).map((insight) => (
                <button
                  key={insight.title}
                  type="button"
                  className="w-full text-left border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">{insight.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{insight.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
            <Link
              href="/taxation/ai-copilot"
              className="mt-3 block w-full text-center py-2.5 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-50"
            >
              Optimize My Deductions ✨
            </Link>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Deduction Summary</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-500">Total Eligible Deductions</span>
                <span className="font-semibold text-gray-900">{formatInr(data.totalEligible)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Total Claimed</span>
                <span className="font-semibold text-gray-900">{formatInr(data.totalClaimed)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Total Remaining</span>
                <span className="font-semibold text-gray-900">{formatInr(data.totalRemaining)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Tax Saving (Claimed)</span>
                <span className="font-semibold text-emerald-600">{formatInr(data.claimedTaxSaving)}</span>
              </li>
            </ul>
            <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold">Potential Additional Tax Saving</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{formatInr(data.potentialTaxSaving)}</p>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">*Tax savings calculated as per your tax slab.</p>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 capitalize">{taxContext.userName}</p>
                <p className="text-xs text-gray-400">FY {taxContext.financialYear}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
