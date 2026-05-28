"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  TextInput,
  SelectInput,
  CheckRow,
} from "@/components/onboarding/form-fields";
import {
  INDIAN_CITIES,
  FINANCIAL_YEARS,
  EMPLOYMENT_TYPES,
  TAX_REGIME_OPTIONS,
  CREDIT_CARD_USAGE_OPTIONS,
} from "@/lib/onboarding/constants";
import { updateSettingsAndSync } from "@/app/settings/actions";
import {
  ShieldCheck,
  Settings,
  Wallet,
  Calendar,
  Home,
  Sparkles,
  Lock,
} from "lucide-react";

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function jsonDownload(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const tabs = [
  { id: "account", label: "Account" },
  { id: "tax", label: "Salary & Tax Regime" },
  { id: "deductions", label: "Investments & Deductions" },
  { id: "expenses", label: "Rent & Expenses" },
  { id: "planning", label: "Planning" },
  { id: "data", label: "Data" },
];

export default function SettingsSection({ taxContext }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useTransition();
  const [status, setStatus] = useState(null);

  const onboarding = taxContext?.onboardingProfile ?? {};
  const salary = taxContext?.salaryProfile ?? {};

  const initialForm = useMemo(() => {
    return {
      full_name: onboarding.full_name ?? "",
      phone_number: onboarding.phone_number ?? "",
      alternate_phone_number: onboarding.alternate_phone_number ?? "",
      age: onboarding.age ?? "",
      city: onboarding.city ?? "Mumbai",
      company_name: onboarding.company_name ?? "",
      employment_type: onboarding.employment_type ?? "salaried",
      financial_year: onboarding.financial_year ?? taxContext?.financialYear ?? "2024-25",

      annual_ctc: onboarding.annual_ctc ?? salary.annual_ctc ?? "",
      monthly_inhand_salary: onboarding.monthly_inhand_salary ?? "",
      basic_salary: onboarding.basic_salary ?? salary.basic_salary ?? "",
      hra: onboarding.hra ?? salary.hra ?? "",
      special_allowance: onboarding.special_allowance ?? salary.special_allowance ?? "",
      bonus: onboarding.bonus ?? salary.bonus ?? "",
      employer_pf: onboarding.employer_pf ?? salary.employer_pf ?? "",
      employer_nps: onboarding.employer_nps ?? salary.employer_nps ?? "",
      monthly_tds: onboarding.monthly_tds ?? salary.monthly_tds ?? "",

      tax_regime: onboarding.tax_regime ?? salary.tax_regime ?? "unsure",

      elss_investments: onboarding.elss_investments ?? "",
      ppf: onboarding.ppf ?? "",
      epf: onboarding.epf ?? "",
      tax_saver_fd: onboarding.tax_saver_fd ?? "",
      life_insurance: onboarding.life_insurance ?? "",

      health_insurance: onboarding.health_insurance ?? "",
      parents_health_insurance: onboarding.parents_health_insurance ?? "",
      nps_contribution: onboarding.nps_contribution ?? "",
      home_loan_interest: onboarding.home_loan_interest ?? "",
      education_loan_interest: onboarding.education_loan_interest ?? "",

      paying_rent: Boolean(onboarding.paying_rent ?? false),
      monthly_rent: onboarding.monthly_rent ?? "",

      home_loan_active: Boolean(onboarding.home_loan_active ?? false),
      monthly_food_spend: onboarding.monthly_food_spend ?? "",
      monthly_transport_spend: onboarding.monthly_transport_spend ?? "",
      monthly_shopping_spend: onboarding.monthly_shopping_spend ?? "",

      sip_amount: onboarding.sip_amount ?? "",
      emi_obligations: onboarding.emi_obligations ?? "",

      credit_card_usage: onboarding.credit_card_usage ?? "medium",

      expecting_salary_hike: Boolean(onboarding.expecting_salary_hike ?? false),
      planning_home_loan: Boolean(onboarding.planning_home_loan ?? false),
      planning_car_loan: Boolean(onboarding.planning_car_loan ?? false),
      planning_investments: Boolean(onboarding.planning_investments ?? false),
      planning_side_income: Boolean(onboarding.planning_side_income ?? false),
      side_income: onboarding.side_income ?? "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxContext?.onboardingProfile, taxContext?.salaryProfile]);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const estimatedTax = useMemo(() => {
    return taxContext?.estimatedTax ?? 0;
  }, [taxContext?.estimatedTax]);

  async function handleSave() {
    setStatus({ type: "pending" });
    try {
      await updateSettingsAndSync(form);
      setStatus({ type: "success" });
      router.refresh();
    } catch (e) {
      setStatus({ type: "error", message: e?.message ?? "Failed to save" });
    }
  }

  const titleChip = (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
        <Settings size={18} className="text-indigo-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">Settings</p>
        <p className="text-xs text-gray-500">Update your profile inputs anytime</p>
      </div>
    </div>
  );

  function formatInr(value) {
    return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
  }

  return (
    <div className="w-full max-w-[1500px] min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {titleChip}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-500 font-semibold">Estimated Tax</p>
            <p className="text-lg font-extrabold text-gray-900 mt-0.5">{formatInr(estimatedTax)}</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || status?.type === "pending"}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
          >
            {status?.type === "pending" ? "Saving…" : "Save & Recalculate"}
          </button>
        </div>
      </div>

      {status?.type === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {status.message}
        </div>
      )}
      {status?.type === "success" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          Saved. We recalculated your taxes using your updated data.
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border border-gray-200 bg-white rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-5">
        {/* Main */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {activeTab === "account" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name">
                  <TextInput value={form.full_name} onChange={(v) => setField("full_name", v)} />
                </Field>
                <Field label="Age">
                  <TextInput value={toStr(form.age)} onChange={(v) => setField("age", v)} type="number" min="18" />
                </Field>
                <Field label="Phone Number">
                  <TextInput value={form.phone_number} onChange={(v) => setField("phone_number", v)} type="tel" />
                </Field>
                <Field label="Alternate Phone">
                  <TextInput
                    value={form.alternate_phone_number}
                    onChange={(v) => setField("alternate_phone_number", v)}
                    type="tel"
                  />
                </Field>
                <Field label="City">
                  <SelectInput value={form.city} onChange={(v) => setField("city", v)} options={INDIAN_CITIES} />
                </Field>
                <Field label="Company Name">
                  <TextInput value={form.company_name} onChange={(v) => setField("company_name", v)} />
                </Field>
                <Field label="Employment Type">
                  <SelectInput
                    value={form.employment_type}
                    onChange={(v) => setField("employment_type", v)}
                    options={EMPLOYMENT_TYPES.map((e) => ({ value: e, label: e }))}
                  />
                </Field>
                <Field label="Financial Year">
                  <SelectInput
                    value={form.financial_year}
                    onChange={(v) => setField("financial_year", v)}
                    options={FINANCIAL_YEARS.map((fy) => ({ value: fy, label: fy }))}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Preferred Tax Regime">
                  <SelectInput
                    value={form.tax_regime}
                    onChange={(v) => setField("tax_regime", v)}
                    options={TAX_REGIME_OPTIONS}
                  />
                </Field>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{taxContext?.taxHealthScore ?? 0}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">Tax readiness score</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tax" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["annual_ctc", "Annual CTC (₹)"],
                  ["monthly_inhand_salary", "Monthly In-Hand (₹)"],
                  ["basic_salary", "Basic Salary / month (₹)"],
                  ["hra", "HRA / month (₹)"],
                  ["special_allowance", "Special Allowance / month (₹)"],
                  ["bonus", "Bonus / year (₹)"],
                  ["employer_pf", "Employer PF / month (₹)"],
                  ["employer_nps", "Employer NPS / month (₹)"],
                  ["monthly_tds", "Monthly TDS (₹)"],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <TextInput
                      value={toStr(form[key])}
                      onChange={(v) => setField(key, v)}
                      type="number"
                      min="0"
                    />
                  </Field>
                ))}
              </div>
            </div>
          )}

          {activeTab === "deductions" && (
            <div className="space-y-5">
              <p className="text-xs text-gray-500">
                These inputs drive your deductions and therefore your tax calculation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["elss_investments", "ELSS Investments (₹/year)"],
                  ["ppf", "PPF (₹/year)"],
                  ["epf", "EPF (₹/year)"],
                  ["tax_saver_fd", "Tax Saver FD (₹/year)"],
                  ["life_insurance", "Life Insurance (₹/year)"],
                  ["health_insurance", "Health Insurance (₹)"],
                  ["parents_health_insurance", "Parents Health Insurance (₹)"],
                  ["nps_contribution", "NPS (80CCD) (₹)"],
                  ["home_loan_interest", "Home Loan Interest (₹)"],
                  ["education_loan_interest", "Education Loan Interest (₹)"],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <TextInput
                      value={toStr(form[key])}
                      onChange={(v) => setField(key, v)}
                      type="number"
                      min="0"
                    />
                  </Field>
                ))}
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Do you pay rent?">
                  <CheckRow label="Paying rent" checked={form.paying_rent} onChange={(v) => setField("paying_rent", v)} />
                </Field>
                <Field label="Monthly Rent (₹)">
                  <TextInput
                    value={toStr(form.monthly_rent)}
                    onChange={(v) => setField("monthly_rent", v)}
                    type="number"
                    min="0"
                    disabled={!form.paying_rent}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ["monthly_food_spend", "Monthly Food Spend (₹)"],
                  ["monthly_transport_spend", "Monthly Transport Spend (₹)"],
                  ["monthly_shopping_spend", "Monthly Shopping Spend (₹)"],
                  ["sip_amount", "SIP Amount / month (₹)"],
                  ["emi_obligations", "EMI Obligations / month (₹)"],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <TextInput
                      value={toStr(form[key])}
                      onChange={(v) => setField(key, v)}
                      type="number"
                      min="0"
                    />
                  </Field>
                ))}
                <Field label="Credit Card Usage">
                  <SelectInput
                    value={form.credit_card_usage}
                    onChange={(v) => setField("credit_card_usage", v)}
                    options={CREDIT_CARD_USAGE_OPTIONS}
                  />
                </Field>
                <Field label="Home Loan Active?">
                  <CheckRow
                    label="Has active home loan"
                    checked={form.home_loan_active}
                    onChange={(v) => setField("home_loan_active", v)}
                  />
                </Field>
              </div>
            </div>
          )}

          {activeTab === "planning" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Expecting salary hike in future?">
                  <CheckRow
                    label="Yes"
                    checked={form.expecting_salary_hike}
                    onChange={(v) => setField("expecting_salary_hike", v)}
                  />
                </Field>
                <Field label="Side income?">
                  <TextInput value={toStr(form.side_income)} onChange={(v) => setField("side_income", v)} type="number" min="0" />
                </Field>

                <Field label="Planning a home loan?">
                  <CheckRow
                    label="Yes"
                    checked={form.planning_home_loan}
                    onChange={(v) => setField("planning_home_loan", v)}
                  />
                </Field>
                <Field label="Planning a car loan?">
                  <CheckRow
                    label="Yes"
                    checked={form.planning_car_loan}
                    onChange={(v) => setField("planning_car_loan", v)}
                  />
                </Field>
                <Field label="Planning new investments?">
                  <CheckRow
                    label="Yes"
                    checked={form.planning_investments}
                    onChange={(v) => setField("planning_investments", v)}
                  />
                </Field>
                <Field label="Planning side income?">
                  <CheckRow
                    label="Yes"
                    checked={form.planning_side_income}
                    onChange={(v) => setField("planning_side_income", v)}
                  />
                </Field>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center">
                  <Lock size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Download your settings snapshot</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Useful if you want to keep a local backup before changing inputs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    jsonDownload("finCopilot-settings-snapshot.json", {
                      onboardingProfile: taxContext?.onboardingProfile,
                      salaryProfile: taxContext?.salaryProfile,
                      taxContext,
                      exportedAt: new Date().toISOString(),
                    })
                  }
                  className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 text-left"
                >
                  Download JSON snapshot
                </button>
                <button
                  type="button"
                  onClick={() => setForm(initialForm)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 text-left"
                >
                  Reset form to last saved values
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Sparkles size={18} className="text-indigo-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Tax Preview</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Recalculates after you save
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500 font-medium">Recommended Regime</span>
                <span className="text-gray-900 font-bold">{String(taxContext?.recommendedRegime ?? "—").toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500 font-medium">Estimated Tax</span>
                <span className="text-gray-900 font-bold">{formatInr(taxContext?.estimatedTax)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500 font-medium">Tax Readiness</span>
                <span className="text-emerald-600 font-bold">{taxContext?.taxHealthScore ?? 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                <Wallet size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">What gets updated</p>
                <p className="text-xs text-gray-500 mt-0.5">Based on your SaaS model</p>
              </div>
            </div>
            <ul className="text-xs text-gray-600 space-y-2">
              <li>• Salary inputs → `salary_profiles`</li>
              <li>• Investments/deductions → `deductions`</li>
              <li>• Tax calculations → `tax_calculations`</li>
              <li>• AI summary & insights → `ai_insights`</li>
              <li>• Budget category plans → `budget_plans`</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

