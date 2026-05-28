"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  Bell,
  FileText,
  Percent,
  ChevronRight,
  Sparkles,
  MessageCircle,
  BarChart3,
  Bot,
  Scale,
  FileCheck,
  AlertTriangle,
  Calendar,
  Target,
  Info,
  Wallet,
  ShieldCheck,
  Upload,
  Calculator,
  Home,
  Star,
  Sun,
} from "lucide-react";
import { TAX_CATEGORIES } from "@/lib/taxation/categories";

function ReadinessRing({ percent }) {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="52" height="52" className="-rotate-90 shrink-0">
      <circle cx="26" cy="26" r="20" fill="none" stroke="#f3f4f6" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r="20"
        fill="none"
        stroke="#22c55e"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function RegimeBars() {
  const bars = [72, 48, 85, 60];
  return (
    <div className="flex items-end gap-1.5 h-10 mt-2">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-sm bg-indigo-400/80" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

export default function TaxationOverviewSection({ taxContext, categoryProgress }) {
  const {
    userName,
    financialYear,
    taxHealthScore,
    annualCtc,
    recommendedRegime,
    estimatedTax,
    deductions,
    liveCompare,
  } = taxContext;

  const annualTds = Math.round(
    (Number(taxContext.salaryProfile?.monthly_tds || 0) ||
      Number(taxContext.onboardingProfile?.monthly_tds || 0)) * 12
  );
  const extraTax = Math.max(0, Math.round(Number(estimatedTax || 0) - annualTds));
  const potentialSavings = Math.max(
    0,
    Math.round(
      (taxContext.deductionUtilization ?? []).reduce((sum, d) => sum + (Number(d.potentialSavings) || 0), 0)
    )
  );

  const deadlines = [
    { task: "Submit rent receipts for Apr–Jun", days: 15 },
    { task: "Upload 80C investment proof", days: 22 },
    { task: "File Advance Tax – Q4", days: 28 },
  ];

  const simulationTags = ["Salary Hike", "Bonus", "Home Loan", "New Investment", "Side Income"];

  const totalChecklist = Object.values(categoryProgress).reduce((acc, p) => acc + p.completed, 0);
  const totalItems = Object.values(categoryProgress).reduce((acc, p) => acc + p.total, 0);
  const missingCount = totalItems - totalChecklist;

  const isOldRecommended = String(recommendedRegime).toLowerCase() === "old";
  const regimeLabel = recommendedRegime ? String(recommendedRegime).toUpperCase() : "—";

  const util = taxContext.deductionUtilization ?? [];
  const hraExemption = Number(taxContext.hraExemption) || 0;
  const npsUsed =
    util.find((d) => d.key === "80CCD_1B")?.used ??
    (Number(taxContext.onboardingProfile?.nps_contribution) || 0);
  const deductionClaimed =
    util.reduce((s, d) => s + d.used, 0) + hraExemption;
  const deductionEligible = util.reduce((s, d) => s + d.limit, 0) + (hraExemption > 0 ? hraExemption : 120000);
  const deductionPercent =
    deductionEligible > 0 ? Math.min(100, Math.round((deductionClaimed / deductionEligible) * 100)) : 0;

  const deductionChecklist = [
    {
      key: "80C",
      label: "Section 80C",
      amount: util.find((d) => d.key === "80C")?.used || 0,
    },
    {
      key: "80D",
      label: "Section 80D",
      amount: util.find((d) => d.key === "80D")?.used || 0,
    },
    { key: "HRA", label: "HRA Exemption", amount: hraExemption },
    { key: "NPS", label: "NPS (80CCD)", amount: npsUsed },
  ].filter((d) => d.amount > 0);

  const aiInsights = [
    {
      icon: Star,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      text:
        recommendedRegime === "old"
          ? "You are on track to save maximum tax with your current deductions."
          : "New regime works best — keep salary proofs updated for accurate TDS.",
    },
    {
      icon: ShieldCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      text: "Your 80C investments are well optimized. Consider NPS for additional ₹50,000 deduction.",
    },
    {
      icon: Home,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      text:
        hraExemption > 0
          ? "HRA exemption is active. Keep rent receipts ready for employer submission."
          : "Add rent details to unlock HRA exemption under the old regime.",
    },
    {
      icon: AlertTriangle,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      text:
        extraTax > 0
          ? `You may owe extra ${formatInr(extraTax)}. Plan advance tax before 31 Mar.`
          : "No extra tax expected from current TDS and advance payments.",
    },
  ];

  const quickActions = [
    { label: "AI Tax Copilot", href: "/taxation/ai-copilot", icon: Bot },
    { label: "Upload Documents", href: "/documents", icon: Upload },
    { label: "Tax Saving Calculator", href: "/taxation/deductions", icon: Calculator },
    { label: "Tax Regime Calculator", href: "/taxation/compare-regimes", icon: Scale },
    { label: "Check Refund Status", href: "/taxation/liability-tracker", icon: FileCheck },
  ];

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const progressBarColors = [
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-blue-500",
    "bg-red-500",
  ];

  return (
    <div className="w-full max-w-[1500px] min-w-0">
      {/* Top bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-2xl order-2 xl:order-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search for categories, insights, reports..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 order-1 xl:order-2 xl:ml-auto">
          <Link
            href="/taxation/salary-documents"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Salary Details
          </Link>
          <button
            type="button"
            suppressHydrationWarning
            className="relative w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            <Bell size={18} className="text-gray-500" />
            {missingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {Math.min(missingCount, 9)}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight capitalize">{userName}</p>
              <p className="text-xs text-gray-400">FY {financialYear}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight">Taxation Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Plan, optimize, and file your taxes with confidence.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Annual CTC</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{annualCtc ? formatInr(annualCtc) : "—"}</p>
              <Link href="/taxation/salary-documents" className="text-[11px] font-semibold text-indigo-600 mt-2 inline-block hover:underline">
                View Salary Details →
              </Link>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-2">Tax Readiness</p>
          <div className="flex items-center gap-3">
            <ReadinessRing percent={taxHealthScore} />
            <div>
              <p className="text-xl font-bold text-gray-900">{taxHealthScore}%</p>
              <p className="text-[11px] font-semibold text-emerald-600">Well Planned</p>
              <p className="text-[10px] text-gray-400">Keep it up! 🎉</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Items</p>
              <p className="text-lg font-bold text-red-500 mt-1">{missingCount} Action Required</p>
              <Link href="/taxation" className="text-[11px] font-semibold text-indigo-600 mt-2 inline-block hover:underline">
                View all →
              </Link>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Recommended Regime</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1 tracking-wide">{regimeLabel}</p>
              {liveCompare.savings > 0 && (
                <p className="text-[11px] font-semibold text-emerald-600 mt-1 leading-snug">
                  You save {formatInr(liveCompare.savings)} vs {isOldRecommended ? "New" : "Old"} Regime
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Est. Tax (New)</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{estimatedTax ? formatInr(estimatedTax) : "—"}</p>
              <p className="text-[10px] text-gray-400 mt-1">Incl. cess & surcharge</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Percent size={18} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 5 Key Tax Problems */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-bold text-gray-900">5 Key Tax Problems We Solve For You</h2>
          <Info size={16} className="text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Card 1 */}
          <div className="md:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <span className="text-[10px] font-bold text-white bg-indigo-600 w-6 h-6 rounded-full flex items-center justify-center mb-3">
              1
            </span>
            <h3 className="text-sm font-bold text-gray-900">Which Tax Regime Is Better?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed flex-1">
              Confused between old and new tax regime? We compare and show which one saves you more.
            </p>
            <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-800">
                {liveCompare.savings > 0
                  ? `You save ${formatInr(liveCompare.savings)} (${isOldRecommended ? "vs New Regime" : "vs Old Regime"})`
                  : "Add salary and deductions to compare regimes."}
              </p>
              <RegimeBars />
            </div>
            <Link
              href="/taxation/compare-regimes"
              className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl text-center"
            >
              Compare Regimes →
            </Link>
          </div>

          {/* Card 2 */}
          <div className="md:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <span className="text-[10px] font-bold text-white bg-emerald-600 w-6 h-6 rounded-full flex items-center justify-center mb-3">
              2
            </span>
            <h3 className="text-sm font-bold text-gray-900">Am I Missing Any Deductions?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed flex-1">
              We find deductions you&apos;re eligible for but may be missing.
            </p>
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-emerald-800">
                {potentialSavings > 0
                  ? `Potential tax saving: ${formatInr(potentialSavings)} from available deductions`
                  : "Add proofs to unlock more savings."}
              </p>
              <FileCheck size={20} className="text-emerald-600 shrink-0" />
            </div>
            <Link
              href="/taxation/deductions"
              className="mt-4 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl text-center"
            >
              View Deductions →
            </Link>
          </div>

          {/* Card 3 */}
          <div className="md:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <span className="text-[10px] font-bold text-white bg-orange-500 w-6 h-6 rounded-full flex items-center justify-center mb-3">
              3
            </span>
            <h3 className="text-sm font-bold text-gray-900">Will I Owe Extra Tax?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed flex-1">
              Track your tax in real-time and avoid last-minute surprises.
            </p>
            <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-orange-800">
                {extraTax > 0
                  ? `You may pay extra ${formatInr(extraTax)} if no action is taken`
                  : "No extra tax expected from current data."}
              </p>
              <AlertTriangle size={20} className="text-orange-500 shrink-0" />
            </div>
            <Link
              href="/taxation/liability-tracker"
              className="mt-4 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl text-center"
            >
              Tax Liability Tracker →
            </Link>
          </div>

          {/* Card 4 */}
          <div className="md:col-span-3 bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <span className="text-[10px] font-bold text-white bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center mb-3">
              4
            </span>
            <h3 className="text-sm font-bold text-gray-900">Am I Missing Any Deadlines?</h3>
            <p className="text-xs text-gray-500 mt-2">Never miss important tax deadlines and document submissions.</p>
            <div className="mt-4 flex gap-4 flex-1">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-700 mb-2">Upcoming ({deadlines.length})</p>
                <ul className="space-y-2.5">
                  {deadlines.map((d) => (
                    <li key={d.task} className="flex items-start gap-2">
                      <input type="checkbox" readOnly className="mt-0.5 rounded border-gray-300" />
                      <div>
                        <p className="text-xs text-gray-800">{d.task}</p>
                        <span className="inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">
                          Due in {d.days} days
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Calendar size={28} className="text-blue-600" />
              </div>
            </div>
            <Link
              href="/calendar"
              className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl text-center"
            >
              View My Calendar →
            </Link>
          </div>

          {/* Card 5 */}
          <div className="md:col-span-3 bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <span className="text-[10px] font-bold text-white bg-indigo-700 w-6 h-6 rounded-full flex items-center justify-center mb-3">
              5
            </span>
            <h3 className="text-sm font-bold text-gray-900">How Do My Decisions Affect Tax?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              See tax impact before you take any financial decision.
            </p>
            <div className="mt-4 flex-1">
              <p className="text-xs font-semibold text-gray-700 mb-2">Try a quick simulation</p>
              <div className="flex flex-wrap gap-2">
                {simulationTags.map((tag) => (
                  <Link
                    key={tag}
                    href="/taxation/ai-copilot"
                    className="text-xs bg-white hover:bg-indigo-50 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/taxation/ai-copilot"
              className="mt-4 w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold rounded-xl text-center"
            >
              Run Simulation →
            </Link>
          </div>
        </div>
      </section>

      {/* Tax Categories */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900">Tax Categories</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">Click a category for details, tools, and checklists</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TAX_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const progress = categoryProgress[cat.slug];
            const itemCount = String(progress?.total ?? 4).padStart(2, "0");
            return (
              <Link
                key={cat.slug}
                href={`/taxation/${cat.slug}`}
                className={`bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all block ${cat.border}`}
              >
                <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={cat.iconColor} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight">{cat.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug line-clamp-2">{cat.desc}</p>
                <p className="text-xs font-semibold text-gray-400 mt-3">{itemCount} items</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Regime | Deductions | AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Regime Comparison</h2>
          </div>
          <div className="p-5 text-sm">
            <div className="grid grid-cols-2 gap-3 mb-3 text-xs font-semibold text-gray-500">
              <span />
              <span className="text-right">
                Old Regime
                {isOldRecommended && (
                  <span className="ml-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                    Recommended
                  </span>
                )}
              </span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <span className="text-gray-600">Taxable Income</span>
                <span className="text-right font-semibold text-gray-900">{formatInr(liveCompare.oldResult.taxableIncome)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <span className="text-gray-600">Est. Tax</span>
                <span className="text-right font-bold text-gray-900">{formatInr(liveCompare.oldResult.tax)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                <span className="text-gray-600">Taxable Income</span>
                <span className="text-right font-semibold text-gray-500">{formatInr(liveCompare.newResult.taxableIncome)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <span className="text-gray-600">Est. Tax</span>
                <span className="text-right font-bold text-gray-500">{formatInr(liveCompare.newResult.tax)}</span>
              </div>
            </div>
            {liveCompare.savings > 0 && (
              <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                <p className="text-xs font-semibold text-emerald-800">
                  You save {formatInr(liveCompare.savings)} with {isOldRecommended ? "Old" : "New"} Regime
                </p>
                <Link href="/taxation/compare-regimes" className="text-xs font-bold text-emerald-700 whitespace-nowrap hover:underline">
                  Details →
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Deductions Summary</h2>
          <p className="text-xs text-gray-600 mb-2">
            <span className="font-bold text-gray-900">{formatInr(deductionClaimed)}</span> of{" "}
            <span className="font-bold text-gray-900">{formatInr(deductionEligible)}</span> limit ({deductionPercent}%)
          </p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deductionPercent}%` }} />
          </div>
          {deductionChecklist.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {deductionChecklist.map((d) => (
                <li key={d.key} className="flex items-center justify-between text-xs gap-2">
                  <span className="flex items-center gap-2 text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                    {d.label}
                  </span>
                  <span className="font-semibold text-gray-900">{formatInr(d.amount)}</span>
                </li>
              ))}
            </ul>
          ) : deductions?.length ? (
            <ul className="space-y-2 mb-4">
              {deductions.slice(0, 4).map((d) => (
                <li key={d.id} className="flex justify-between text-xs">
                  <span className="text-gray-600">{d.key}</span>
                  <span className="font-semibold">{formatInr(d.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 mb-4">No deductions saved yet.</p>
          )}
          <Link href="/taxation/deductions" className="text-xs font-bold text-indigo-600 hover:underline">
            Manage Deductions →
          </Link>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">AI Tax Insights</h2>
          </div>
          <ul className="space-y-3 mb-4">
            {aiInsights.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon size={14} className={item.iconColor} />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed pt-0.5">{item.text}</p>
                </li>
              );
            })}
          </ul>
          <Link
            href="/taxation/ai-copilot"
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 bg-indigo-50/50 text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-50"
          >
            <MessageCircle size={16} />
            Ask AI Copilot
          </Link>
        </section>
      </div>

      {/* Category Progress + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Category Progress</h2>
          <ul className="space-y-4">
            {TAX_CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              const progress = categoryProgress[cat.slug];
              const barColor = progressBarColors[idx % progressBarColors.length];
              return (
                <li key={cat.slug}>
                  <Link href={`/taxation/${cat.slug}`} className="flex items-center gap-3 group">
                    <div className={`w-9 h-9 rounded-lg ${cat.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={cat.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{cat.title}</p>
                        <span className="text-xs font-semibold text-gray-500">{progress?.percent ?? 0}%</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${progress?.percent ?? 0}%` }} />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
          <ul className="space-y-0.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.label}>
                  <Link
                    href={action.href}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <Icon size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 flex-1">{action.label}</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Footer banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0">
            <Sun size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Stay ahead of deadlines!</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Complete your tax filing early to avoid last-minute rush.
            </p>
          </div>
        </div>
        <Link
          href="/calendar"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 whitespace-nowrap"
        >
          Go to Calendar →
        </Link>
      </div>
    </div>
  );
}
