"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Upload,
  Sparkles,
  MessageCircle,
  Download,
  Calculator,
} from "lucide-react";
import SalaryForm from "@/components/taxation/salary-form";
import { TAX_CATEGORIES } from "@/lib/taxation/categories";

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function ChecklistCard({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex items-start gap-3 p-3 rounded-xl border ${
            item.done ? "bg-emerald-50/50 border-emerald-100" : "bg-gray-50/50 border-gray-100"
          }`}
        >
          {item.done ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Circle size={18} className="text-gray-300 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{item.label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{item.hint}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function TaxCategoryDetailSection({
  categorySlug,
  taxContext,
  progress,
  salaryFormProps,
}) {
  const [uploadMsg, setUploadMsg] = useState("");
  const category = TAX_CATEGORIES.find((c) => c.slug === categorySlug);
  const Icon = category.icon;

  const otherCategories = TAX_CATEGORIES.filter((c) => c.slug !== categorySlug);

  function handleUpload(label) {
    setUploadMsg(`${label} marked for upload — vault integration coming soon.`);
    setTimeout(() => setUploadMsg(""), 4000);
  }

  return (
    <div className="w-full max-w-[1200px] min-w-0">
      <Link
        href="/taxation"
        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-4"
      >
        <ChevronLeft size={16} />
        Back to Taxation
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl ${category.iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={24} className={category.iconColor} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{category.title}</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">{category.subtitle}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${category.badgeBg}`}>
              {progress.completed}/{progress.total} checklist complete
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
              FY {taxContext.financialYear}
            </span>
          </div>
        </div>
      </div>

      {uploadMsg && (
        <p className="mb-4 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
          {uploadMsg}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-5">
          {category.slug === "salary-documents" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Annual CTC"
                  value={taxContext.annualCtc ? formatInr(taxContext.annualCtc) : "Not set"}
                />
                <StatCard
                  label="Basic / month"
                  value={formatInr(
                    taxContext.salaryProfile?.basic_salary ??
                      taxContext.onboardingProfile?.basic_salary
                  )}
                />
                <StatCard
                  label="HRA / month"
                  value={formatInr(taxContext.hraMonthly)}
                />
              </div>
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Salary structure</h2>
                <SalaryForm {...salaryFormProps} />
              </section>
            </>
          )}

          {category.slug === "tax-saving-proofs" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {taxContext.deductionUtilization.map((d) => (
                  <StatCard
                    key={d.key}
                    label={d.key}
                    value={`${formatInr(d.used)} / ${formatInr(d.limit)}`}
                    sub={`${formatInr(d.remaining)} room left`}
                  />
                ))}
              </div>
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Onboarding investments</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["ELSS", taxContext.onboardingProfile?.elss_investments],
                    ["PPF", taxContext.onboardingProfile?.ppf],
                    ["EPF", taxContext.onboardingProfile?.epf],
                    ["Tax saver FD", taxContext.onboardingProfile?.tax_saver_fd],
                    ["Life insurance", taxContext.onboardingProfile?.life_insurance],
                    ["Health (80D)", taxContext.onboardingProfile?.health_insurance],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-900">{formatInr(val)}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/taxation/salary-documents"
                  className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:underline"
                >
                  Add deductions via salary profile →
                </Link>
              </section>
            </>
          )}

          {category.slug === "rent-hra" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Paying rent"
                  value={taxContext.payingRent ? "Yes" : "No"}
                />
                <StatCard label="Rent / month" value={formatInr(taxContext.rentMonthly)} />
                <StatCard
                  label="HRA exemption (est.)"
                  value={formatInr(taxContext.hraExemption)}
                  sub="Annual estimate"
                />
              </div>
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator size={18} className="text-orange-600" />
                  <h2 className="text-base font-semibold text-gray-900">HRA calculator</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Exemption is estimated as the lower of actual HRA received, 50% of basic (metro), or
                  rent paid minus 10% of basic. Your profile shows{" "}
                  <strong>{formatInr(taxContext.rentMonthly * 12)}</strong> annual rent and{" "}
                  <strong>{formatInr(taxContext.hraMonthly * 12)}</strong> annual HRA.
                </p>
                {!taxContext.payingRent && (
                  <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    Mark &quot;paying rent&quot; in onboarding to unlock full HRA tracking.
                  </p>
                )}
              </section>
            </>
          )}

          {category.slug === "banking-investments" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Monthly SIP"
                  value={formatInr(taxContext.onboardingProfile?.sip_amount)}
                />
                <StatCard
                  label="Side income"
                  value={formatInr(taxContext.onboardingProfile?.side_income)}
                />
                <StatCard
                  label="EMI obligations"
                  value={formatInr(taxContext.onboardingProfile?.emi_obligations)}
                />
              </div>
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Document uploads</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {["Bank statement", "Capital gains", "FD interest certificate", "Demat statement"].map(
                    (label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleUpload(label)}
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                      >
                        <Upload size={16} className="text-indigo-600 shrink-0" />
                        {label}
                      </button>
                    )
                  )}
                </div>
              </section>
            </>
          )}

          {category.slug === "compliance-filing" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Old regime tax"
                  value={formatInr(taxContext.liveCompare.oldResult.tax)}
                />
                <StatCard
                  label="New regime tax"
                  value={formatInr(taxContext.liveCompare.newResult.tax)}
                />
                <StatCard
                  label="Recommended"
                  value={String(taxContext.recommendedRegime || "—").toUpperCase()}
                />
              </div>
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Filing timeline</h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Advance tax Q4</span>
                    <span className="font-medium text-gray-900">15 Mar</span>
                  </li>
                  <li className="flex justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">ITR due (non-audit)</span>
                    <span className="font-medium text-gray-900">31 Jul</span>
                  </li>
                  <li className="flex justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Revise return</span>
                    <span className="font-medium text-gray-900">31 Dec</span>
                  </li>
                </ul>
                <Link
                  href="/taxation/ai-copilot"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700"
                >
                  <Sparkles size={16} />
                  Get filing help from AI
                </Link>
              </section>
            </>
          )}

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Checklist</h2>
            <ChecklistCard items={progress.items} />
          </section>

          {category.slug !== "salary-documents" && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Upload proofs</h2>
              <div className="flex flex-wrap gap-2">
                {category.checklist.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleUpload(item.label)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
                  >
                    <Upload size={14} className="text-indigo-600" />
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 h-fit">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Other categories</h3>
            <ul className="space-y-1">
              {otherCategories.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <li key={cat.slug}>
                    <Link
                      href={`/taxation/${cat.slug}`}
                      className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700"
                    >
                      <CatIcon size={16} className={cat.iconColor} />
                      <span className="flex-1">{cat.title}</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/taxation/ai-copilot"
                  className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 text-sm"
                >
                  <MessageCircle size={16} className="text-indigo-600" />
                  AI Copilot
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleUpload("Tax package")}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 text-sm text-left"
                >
                  <Download size={16} className="text-gray-500" />
                  Download package
                </button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
