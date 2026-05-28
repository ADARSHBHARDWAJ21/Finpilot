"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  User,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Pencil,
  Eye,
  Download,
  RotateCcw,
  Database,
  HelpCircle,
  ChevronRight,
  Settings2,
} from "lucide-react";

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
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
  { id: "data", label: "Data & Backup" },
  { id: "preferences", label: "Preferences" },
];

export default function SettingsSection({ taxContext }) {
  const [activeTab, setActiveTab] = useState("account");
  const [status, setStatus] = useState(null);
  const [isSaving, startTransition] = useTransition();
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEmployment, setEditEmployment] = useState(false);

  const onboarding = taxContext?.onboardingProfile ?? {};
  const salary = taxContext?.salaryProfile ?? {};

  const initialForm = useMemo(
    () => ({
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
    }),
    [onboarding, salary, taxContext?.financialYear]
  );

  const [form, setForm] = useState(initialForm);
  useEffect(() => setForm(initialForm), [initialForm]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setStatus({ type: "pending" });
    startTransition(async () => {
      try {
        await updateSettingsAndSync(form);
        setStatus({ type: "success" });
      } catch (e) {
        setStatus({ type: "error", message: e?.message ?? "Failed to save" });
      }
    });
  }

  return (
    <div className="w-full max-w-[1500px] min-w-0">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[36px] leading-tight font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your profile, financial details and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-[11px] text-gray-500 font-semibold">Estimated Tax</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">{formatInr(taxContext?.estimatedTax)}</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-[52px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60"
          >
            {isSaving || status?.type === "pending" ? "Saving..." : "Save & Recalculate"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap ${
                activeTab === tab.id ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {status?.type === "error" && <p className="text-sm text-red-600 mb-3">{status.message}</p>}
      {status?.type === "success" && <p className="text-sm text-emerald-600 mb-3">Settings saved and recalculated.</p>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          {activeTab === "account" && (
            <>
              <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  <button type="button" onClick={() => setEditPersonal((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                    <Pencil size={14} /> {editPersonal ? "Done" : "Edit"}
                  </button>
                </div>
                {editPersonal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name"><TextInput value={form.full_name} onChange={(v) => setField("full_name", v)} /></Field>
                    <Field label="Age"><TextInput type="number" value={toStr(form.age)} onChange={(v) => setField("age", v)} /></Field>
                    <Field label="Phone Number"><TextInput value={form.phone_number} onChange={(v) => setField("phone_number", v)} /></Field>
                    <Field label="Alternate Phone"><TextInput value={form.alternate_phone_number} onChange={(v) => setField("alternate_phone_number", v)} /></Field>
                    <Field label="City"><SelectInput value={form.city} onChange={(v) => setField("city", v)} options={INDIAN_CITIES} /></Field>
                    <Field label="Company"><TextInput value={form.company_name} onChange={(v) => setField("company_name", v)} /></Field>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoCard icon={User} label="Full Name" value={form.full_name || "—"} />
                    <InfoCard icon={CalendarDays} label="Age" value={toStr(form.age) || "—"} />
                    <InfoCard icon={Phone} label="Phone Number" value={form.phone_number || "—"} />
                    <InfoCard icon={Phone} label="Alternate Phone" value={form.alternate_phone_number || "—"} />
                    <InfoCard icon={MapPin} label="City" value={form.city || "—"} />
                    <InfoCard icon={Building2} label="Company" value={form.company_name || "—"} />
                  </div>
                )}
              </section>

              <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900">Employment & Tax Details</h2>
                  <button type="button" onClick={() => setEditEmployment((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                    <Pencil size={14} /> {editEmployment ? "Done" : "Edit"}
                  </button>
                </div>
                {editEmployment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Employment Type"><SelectInput value={form.employment_type} onChange={(v) => setField("employment_type", v)} options={EMPLOYMENT_TYPES.map((e) => ({ value: e, label: e }))} /></Field>
                    <Field label="Financial Year"><SelectInput value={form.financial_year} onChange={(v) => setField("financial_year", v)} options={FINANCIAL_YEARS.map((fy) => ({ value: fy, label: fy }))} /></Field>
                    <Field label="Preferred Tax Regime"><SelectInput value={form.tax_regime} onChange={(v) => setField("tax_regime", v)} options={TAX_REGIME_OPTIONS} /></Field>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoCard icon={Briefcase} label="Employment Type" value={String(form.employment_type || "—").replace("-", " ")} />
                    <InfoCard icon={CalendarDays} label="Financial Year" value={form.financial_year || "—"} />
                    <InfoCard icon={ShieldCheck} label="Preferred Tax Regime" value={String(form.tax_regime || "—").toUpperCase()} />
                    <div className="border border-gray-100 rounded-xl px-3 py-2.5 bg-emerald-50/50">
                      <p className="text-[11px] text-gray-500">Tax Readiness Score</p>
                      <p className="text-2xl font-bold text-emerald-600 leading-tight">{taxContext?.taxHealthScore ?? 0}%</p>
                      <p className="text-xs text-gray-500">Keep going! You&apos;re on the right track.</p>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <ActionBtn icon={Sparkles} title="Recalculate Tax" subtitle="Update calculations with latest inputs" onClick={handleSave} />
                  <ActionBtn icon={Eye} title="Tax Preview" subtitle="See updated tax estimate before saving" />
                  <ActionBtn icon={Download} title="Download Report" subtitle="Download your tax summary report" onClick={() => jsonDownload("finpilot-settings-report.json", { form, taxContext, exportedAt: new Date().toISOString() })} />
                  <ActionBtn icon={RotateCcw} title="Reset All Inputs" subtitle="Clear all inputs and start fresh" onClick={() => setForm(initialForm)} />
                </div>
              </section>

              <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Secure & Private</p>
                    <p className="text-xs text-gray-500">Your data is encrypted and secure. We never share your information.</p>
                  </div>
                </div>
                <button type="button" className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1">Privacy Policy <ChevronRight size={12} /></button>
              </section>
            </>
          )}

          {activeTab === "tax" && (
            <SettingsFormCard title="Salary & Tax Regime Inputs">
              <GridFields
                fields={[
                  ["annual_ctc", "Annual CTC (₹)"],
                  ["monthly_inhand_salary", "Monthly In-Hand (₹)"],
                  ["basic_salary", "Basic Salary / month (₹)"],
                  ["hra", "HRA / month (₹)"],
                  ["special_allowance", "Special Allowance / month (₹)"],
                  ["bonus", "Bonus / year (₹)"],
                  ["employer_pf", "Employer PF / month (₹)"],
                  ["employer_nps", "Employer NPS / month (₹)"],
                  ["monthly_tds", "Monthly TDS (₹)"],
                ]}
                form={form}
                setField={setField}
              />
            </SettingsFormCard>
          )}

          {activeTab === "deductions" && (
            <SettingsFormCard title="Investments & Deductions Inputs">
              <GridFields
                fields={[
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
                ]}
                form={form}
                setField={setField}
              />
            </SettingsFormCard>
          )}

          {activeTab === "expenses" && (
            <SettingsFormCard title="Rent & Expense Inputs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Do you pay rent?"><CheckRow label="Paying rent" checked={form.paying_rent} onChange={(v) => setField("paying_rent", v)} /></Field>
                <Field label="Monthly Rent (₹)"><TextInput type="number" value={toStr(form.monthly_rent)} onChange={(v) => setField("monthly_rent", v)} disabled={!form.paying_rent} /></Field>
                <Field label="Monthly Food Spend (₹)"><TextInput type="number" value={toStr(form.monthly_food_spend)} onChange={(v) => setField("monthly_food_spend", v)} /></Field>
                <Field label="Monthly Transport Spend (₹)"><TextInput type="number" value={toStr(form.monthly_transport_spend)} onChange={(v) => setField("monthly_transport_spend", v)} /></Field>
                <Field label="Monthly Shopping Spend (₹)"><TextInput type="number" value={toStr(form.monthly_shopping_spend)} onChange={(v) => setField("monthly_shopping_spend", v)} /></Field>
                <Field label="SIP Amount / month (₹)"><TextInput type="number" value={toStr(form.sip_amount)} onChange={(v) => setField("sip_amount", v)} /></Field>
                <Field label="EMI Obligations / month (₹)"><TextInput type="number" value={toStr(form.emi_obligations)} onChange={(v) => setField("emi_obligations", v)} /></Field>
                <Field label="Credit Card Usage"><SelectInput value={form.credit_card_usage} onChange={(v) => setField("credit_card_usage", v)} options={CREDIT_CARD_USAGE_OPTIONS} /></Field>
              </div>
            </SettingsFormCard>
          )}

          {activeTab === "planning" && (
            <SettingsFormCard title="Future Planning Inputs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Side income?"><TextInput type="number" value={toStr(form.side_income)} onChange={(v) => setField("side_income", v)} /></Field>
                <Field label="Expecting salary hike in future?"><CheckRow label="Yes" checked={form.expecting_salary_hike} onChange={(v) => setField("expecting_salary_hike", v)} /></Field>
                <Field label="Planning a home loan?"><CheckRow label="Yes" checked={form.planning_home_loan} onChange={(v) => setField("planning_home_loan", v)} /></Field>
                <Field label="Planning a car loan?"><CheckRow label="Yes" checked={form.planning_car_loan} onChange={(v) => setField("planning_car_loan", v)} /></Field>
                <Field label="Planning new investments?"><CheckRow label="Yes" checked={form.planning_investments} onChange={(v) => setField("planning_investments", v)} /></Field>
                <Field label="Planning side income?"><CheckRow label="Yes" checked={form.planning_side_income} onChange={(v) => setField("planning_side_income", v)} /></Field>
              </div>
            </SettingsFormCard>
          )}

          {activeTab === "data" && (
            <SettingsFormCard title="Data & Backup">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ActionBtn icon={Download} title="Download JSON Snapshot" subtitle="Export profile + tax context data" onClick={() => jsonDownload("finpilot-settings-snapshot.json", { onboardingProfile: taxContext?.onboardingProfile, salaryProfile: taxContext?.salaryProfile, taxContext, exportedAt: new Date().toISOString() })} />
                <ActionBtn icon={RotateCcw} title="Reset to Last Saved" subtitle="Undo unsaved edits in this session" onClick={() => setForm(initialForm)} />
              </div>
            </SettingsFormCard>
          )}

          {activeTab === "preferences" && (
            <SettingsFormCard title="Preferences">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Preferred Financial Year"><SelectInput value={form.financial_year} onChange={(v) => setField("financial_year", v)} options={FINANCIAL_YEARS.map((fy) => ({ value: fy, label: fy }))} /></Field>
                <Field label="Default Tax Regime"><SelectInput value={form.tax_regime} onChange={(v) => setField("tax_regime", v)} options={TAX_REGIME_OPTIONS} /></Field>
                <Field label="Credit Card Usage Mode"><SelectInput value={form.credit_card_usage} onChange={(v) => setField("credit_card_usage", v)} options={CREDIT_CARD_USAGE_OPTIONS} /></Field>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-700">
                  Preferences use your existing profile options and directly influence analytics outputs.
                </div>
              </div>
            </SettingsFormCard>
          )}
        </div>

        <aside className="space-y-4">
          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Sparkles size={15} className="text-indigo-600" /></div>
              <div>
                <p className="text-sm font-bold text-gray-900">Tax Preview</p>
                <p className="text-xs text-gray-500">Recalculates after you save</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Recommended Regime</span><span className="font-semibold text-gray-900">{String(taxContext?.recommendedRegime ?? "—").toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estimated Tax</span><span className="font-semibold text-gray-900">{formatInr(taxContext?.estimatedTax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax Readiness</span><span className="font-semibold text-emerald-600">{taxContext?.taxHealthScore ?? 0}%</span></div>
            </div>
          </section>

          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Database size={15} className="text-indigo-600" /></div>
              <div>
                <p className="text-sm font-bold text-gray-900">What gets updated</p>
                <p className="text-xs text-gray-500">Based on your SaaS model</p>
              </div>
            </div>
            <ul className="text-xs text-gray-600 space-y-2">
              <li>• Salary inputs → `salary_profiles`</li>
              <li>• Investments / deductions → `deductions`</li>
              <li>• Tax calculations → `tax_calculations`</li>
              <li>• AI summary & insights → `ai_insights`</li>
              <li>• Budget category plans → `budget_plans`</li>
            </ul>
          </section>

          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Settings Shortcuts</h3>
            <Shortcut label="Profile" sub="Manage your personal details" icon={User} />
            <Shortcut label="Preferences" sub="Customize app experience" icon={Settings2} />
            <Shortcut label="Data & Backup" sub="Download or reset your data" icon={Database} />
            <Shortcut label="Help & Support" sub="Get help and contact support" icon={HelpCircle} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function SettingsFormCard({ title, children }) {
  return (
    <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function GridFields({ fields, form, setField }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(([key, label]) => (
        <Field key={key} label={label}>
          <TextInput type="number" value={toStr(form[key])} onChange={(v) => setField(key, v)} min="0" />
        </Field>
      ))}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-gray-100 rounded-xl px-3 py-2.5">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center mt-0.5">
          <Icon size={14} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-[11px] text-gray-500">{label}</p>
          <p className="text-sm font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-left border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors w-full">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-2">
        <Icon size={14} className="text-indigo-600" />
      </div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
    </button>
  );
}

function Shortcut({ icon: Icon, label, sub }) {
  return (
    <button type="button" className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 text-left">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center"><Icon size={13} className="text-indigo-600" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-[11px] text-gray-500">{sub}</p>
      </div>
      <ChevronRight size={14} className="text-gray-300" />
    </button>
  );
}

