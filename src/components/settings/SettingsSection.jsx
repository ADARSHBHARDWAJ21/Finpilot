"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
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
  ChevronRight,
  Settings2,
} from "lucide-react";

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function formatInr(value) {
  return value == null ? "Not calculated" : `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
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
const emptyProfile = {};

export default function SettingsSection({ taxContext: initialTaxContext }) {
  const [taxContext, setTaxContext] = useState(initialTaxContext);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [status, setStatus] = useState(null);
  const [isSaving, startTransition] = useTransition();
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEmployment, setEditEmployment] = useState(false);

  const onboarding = taxContext?.onboardingProfile ?? emptyProfile;
  const salary = taxContext?.salaryProfile ?? emptyProfile;

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

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setStatus({ type: "pending" });
    startTransition(async () => {
      try {
        const result = await updateSettingsAndSync(form);
        setTaxContext(result.taxContext);
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
          <h1 className="text-3xl leading-tight tracking-[-.04em] font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile, financial details and preferences</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white rounded-2xl border border-border  px-4 py-3">
            <p className="text-[11px] text-muted-foreground font-semibold">Estimated Tax</p>
            <p className="text-3xl font-semibold text-foreground mt-0.5">{formatInr(taxContext?.estimatedTax)}</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-[52px] px-6 rounded-xl bg-primary hover:bg-[#193e35] text-white text-sm font-semibold  disabled:opacity-60"
          >
            {isSaving || status?.type === "pending" ? "Saving..." : "Save & Recalculate"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-1 mb-4 overflow-x-auto">
        <div className="flex items-center min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap ${
                activeTab === tab.id ? "bg-[#edf2eb] text-primary" : "text-[#647268] hover:bg-muted"
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
              <section className="bg-white border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
                  <button type="button" onClick={() => setEditPersonal((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-[#647268] border border-border rounded-lg px-3 py-1.5 hover:bg-muted">
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

              <section className="bg-white border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold text-foreground">Employment & Tax Details</h2>
                  <button type="button" onClick={() => setEditEmployment((v) => !v)} className="inline-flex items-center gap-1.5 text-sm text-[#647268] border border-border rounded-lg px-3 py-1.5 hover:bg-muted">
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
                    <div className="border border-border rounded-xl px-3 py-2.5 bg-emerald-50/50">
                      <p className="text-[11px] text-muted-foreground">Tax Readiness Score</p>
                      <p className="text-2xl font-semibold text-emerald-600 leading-tight">{taxContext?.taxHealthScore ?? 0}%</p>
                      <p className="text-xs text-muted-foreground">Keep going! You&apos;re on the right track.</p>
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <ActionBtn icon={Sparkles} title="Recalculate Tax" subtitle="Update calculations with latest inputs" onClick={handleSave} />
                  <ActionBtn icon={Eye} title="Tax Preview" subtitle="Explore saved yearly tax inputs" onClick={() => router.push(`/taxation/simulation?year=${taxContext.financialYear}`)} />
                  <ActionBtn icon={Download} title="Download Report" subtitle="Download your tax summary report" onClick={() => jsonDownload("finpilot-settings-report.json", { form, taxContext, exportedAt: new Date().toISOString() })} />
                  <ActionBtn icon={RotateCcw} title="Discard Unsaved Edits" subtitle="Restore your last saved profile" onClick={() => setForm(initialForm)} />
                </div>
              </section>

              <section className="bg-white border border-border rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Secure & Private</p>
                    <p className="text-xs text-muted-foreground">Review your saved information and download a copy in Data & Backup.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActiveTab("data")} className="shrink-0 text-xs font-semibold text-primary inline-flex items-center gap-1">Manage data <ChevronRight size={12} /></button>
              </section>
            </>
          )}

          {(activeTab === "tax" || activeTab === "deductions") && (
            <SettingsFormCard title={activeTab === "tax" ? "Salary & Tax Regime" : "Investments & Deductions"}>
              <p className="text-sm leading-relaxed text-muted-foreground">Tax inputs are saved for each financial year. Edit them in the year workspace so Taxation, Reports and Copilot use the same confirmed amounts.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white" href={`/taxation/${activeTab === "tax" ? "salary-documents" : "tax-saving-proofs"}?year=${taxContext.financialYear}`}>Edit {activeTab === "tax" ? "salary" : "deductions"} for FY {taxContext.financialYear}</Link>
                <Link className="rounded-xl border border-border px-4 py-3 text-sm" href={`/taxation/compare-regimes?year=${taxContext.financialYear}`}>Compare and choose regime</Link>
              </div>
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
                <div className="bg-[#edf2eb] border border-[#dbe3da] rounded-xl p-4 text-xs text-primary">
                  Preferences use your existing profile options and directly influence analytics outputs.
                </div>
              </div>
            </SettingsFormCard>
          )}
        </div>

        <aside className="space-y-4">
          <section className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#edf2eb] flex items-center justify-center"><Sparkles size={15} className="text-primary" /></div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tax Preview</p>
                <p className="text-xs text-muted-foreground">Recalculates after you save</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Recommended Regime</span><span className="font-semibold text-foreground">{String(taxContext?.recommendedRegime ?? "—").toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Estimated Tax</span><span className="font-semibold text-foreground">{formatInr(taxContext?.estimatedTax)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax Readiness</span><span className="font-semibold text-emerald-600">{taxContext?.taxHealthScore ?? 0}%</span></div>
            </div>
          </section>

          <section className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#edf2eb] flex items-center justify-center"><Database size={15} className="text-primary" /></div>
              <div>
                <p className="text-sm font-semibold text-foreground">What gets updated</p>
                <p className="text-xs text-muted-foreground">One connected workspace</p>
              </div>
            </div>
            <ul className="text-xs text-[#647268] space-y-2">
              <li>Salary and profile details</li>
              <li>Annual deduction information</li>
              <li>Your latest tax estimates</li>
              <li>Financial insights and summaries</li>
              <li>Spending plans and category budgets</li>
            </ul>
          </section>

          <section className="bg-white border border-border rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Settings Shortcuts</h3>
            <Shortcut onClick={() => setActiveTab("account")} label="Profile" sub="Manage your personal details" icon={User} />
            <Shortcut onClick={() => setActiveTab("preferences")} label="Preferences" sub="Customize app experience" icon={Settings2} />
            <Shortcut onClick={() => setActiveTab("data")} label="Data & Backup" sub="Download or reset your data" icon={Database} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function SettingsFormCard({ title, children }) {
  return (
    <section className="bg-white border border-border rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
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
    <div className="border border-border rounded-xl px-3 py-2.5">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#edf2eb] flex items-center justify-center mt-0.5">
          <Icon size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-left border border-border rounded-xl p-3 hover:bg-muted transition-colors w-full">
      <div className="w-8 h-8 rounded-lg bg-[#edf2eb] flex items-center justify-center mb-2">
        <Icon size={14} className="text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
    </button>
  );
}

function Shortcut({ icon: Icon, label, sub, onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted text-left">
      <div className="w-7 h-7 rounded-lg bg-[#edf2eb] flex items-center justify-center"><Icon size={13} className="text-primary" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight size={14} className="text-gray-300" />
    </button>
  );
}
