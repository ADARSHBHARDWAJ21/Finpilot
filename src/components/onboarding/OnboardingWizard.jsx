"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import {
  saveOnboardingStep,
  completeOnboarding,
} from "@/app/onboarding/actions";
import {
  ONBOARDING_STEPS,
  INDIAN_CITIES,
  FINANCIAL_YEARS,
  EMPLOYMENT_TYPES,
  TAX_REGIME_OPTIONS,
  CREDIT_CARD_USAGE_OPTIONS,
  DOCUMENT_TYPES,
} from "@/lib/onboarding/constants";
import { Field, TextInput, SelectInput, CheckRow } from "@/components/onboarding/form-fields";

function profileToForm(profile, email) {
  return {
    full_name: profile?.full_name ?? "",
    email: profile?.email ?? email ?? "",
    phone_number: profile?.phone_number ?? "",
    alternate_phone_number: profile?.alternate_phone_number ?? "",
    age: profile?.age ?? "",
    city: profile?.city ?? "Mumbai",
    company_name: profile?.company_name ?? "",
    employment_type: profile?.employment_type ?? "salaried",
    financial_year: profile?.financial_year ?? "2025-26",
    annual_ctc: profile?.annual_ctc ?? "",
    monthly_inhand_salary: profile?.monthly_inhand_salary ?? "",
    basic_salary: profile?.basic_salary ?? "",
    hra: profile?.hra ?? "",
    special_allowance: profile?.special_allowance ?? "",
    bonus: profile?.bonus ?? "",
    employer_pf: profile?.employer_pf ?? "",
    employer_nps: profile?.employer_nps ?? "",
    monthly_tds: profile?.monthly_tds ?? "",
    tax_regime: profile?.tax_regime ?? "unsure",
    elss_investments: profile?.elss_investments ?? "",
    ppf: profile?.ppf ?? "",
    epf: profile?.epf ?? "",
    tax_saver_fd: profile?.tax_saver_fd ?? "",
    life_insurance: profile?.life_insurance ?? "",
    health_insurance: profile?.health_insurance ?? "",
    parents_health_insurance: profile?.parents_health_insurance ?? "",
    nps_contribution: profile?.nps_contribution ?? "",
    home_loan_interest: profile?.home_loan_interest ?? "",
    education_loan_interest: profile?.education_loan_interest ?? "",
    paying_rent: profile?.paying_rent ?? false,
    monthly_rent: profile?.monthly_rent ?? "",
    home_loan_active: profile?.home_loan_active ?? false,
    monthly_food_spend: profile?.monthly_food_spend ?? "",
    monthly_transport_spend: profile?.monthly_transport_spend ?? "",
    monthly_shopping_spend: profile?.monthly_shopping_spend ?? "",
    sip_amount: profile?.sip_amount ?? "",
    emi_obligations: profile?.emi_obligations ?? "",
    credit_card_usage: profile?.credit_card_usage ?? "medium",
    savings_goal: profile?.savings_goal ?? "",
    side_income: profile?.side_income ?? "",
    expecting_salary_hike: profile?.expecting_salary_hike ?? false,
    planning_home_loan: profile?.planning_home_loan ?? false,
    planning_car_loan: profile?.planning_car_loan ?? false,
    planning_investments: profile?.planning_investments ?? false,
    planning_side_income: profile?.planning_side_income ?? false,
    documents: profile?.documents ?? {},
  };
}

function setField(setForm, key, value) {
  setForm((prev) => ({ ...prev, [key]: value }));
}

function formatInr(v) {
  return `₹${Math.round(Number(v) || 0).toLocaleString("en-IN")}`;
}

export default function OnboardingWizard({ email, initialProfile }) {
  const router = useRouter();
  const startStep = initialProfile?.onboarding_completed
    ? 7
    : Math.min(7, Math.max(1, Number(initialProfile?.current_step) || 1));

  const [step, setStep] = useState(startStep);
  const [form, setForm] = useState(() => profileToForm(initialProfile, email));
  const [summary, setSummary] = useState(initialProfile?.ai_summary ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentMeta = ONBOARDING_STEPS[step - 1];
  const progress = Math.round((step / ONBOARDING_STEPS.length) * 100);

  async function persistStep(nextStep) {
    setSaving(true);
    setError("");
    try {
      const docPayload =
        step === 6
          ? {
              ...form,
              documents: {
                ...form.documents,
                marked: DOCUMENT_TYPES.filter((d) => form.documents?.[d.key]).map((d) => d.key),
              },
            }
          : form;

      await saveOnboardingStep(step, docPayload);
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    if (step < 6) {
      await persistStep(step + 1);
      return;
    }
    if (step === 6) {
      setSaving(true);
      setError("");
      try {
        const { summary: generated } = await completeOnboarding({
          ...form,
          documents: {
            ...form.documents,
            marked: DOCUMENT_TYPES.filter((d) => form.documents?.[d.key]).map((d) => d.key),
          },
        });
        setSummary(generated);
        setStep(7);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        setError(err.message || "Could not complete onboarding.");
      } finally {
        setSaving(false);
      }
    }
  }

  function handleBack() {
    if (step > 1 && step < 7) setStep(step - 1);
  }

  function renderStep() {
    if (step === 1) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Full Name">
              <TextInput value={form.full_name} onChange={(v) => setField(setForm, "full_name", v)} />
            </Field>
          </div>
          <Field label="Email">
            <TextInput value={form.email} onChange={() => {}} disabled />
          </Field>
          <Field label="Phone Number">
            <TextInput value={form.phone_number} onChange={(v) => setField(setForm, "phone_number", v)} type="tel" />
          </Field>
          <Field label="Alternate Phone">
            <TextInput value={form.alternate_phone_number} onChange={(v) => setField(setForm, "alternate_phone_number", v)} type="tel" />
          </Field>
          <Field label="Age">
            <TextInput value={form.age} onChange={(v) => setField(setForm, "age", v)} type="number" min="18" />
          </Field>
          <Field label="City">
            <SelectInput value={form.city} onChange={(v) => setField(setForm, "city", v)} options={INDIAN_CITIES} />
          </Field>
          <Field label="Company Name">
            <TextInput value={form.company_name} onChange={(v) => setField(setForm, "company_name", v)} />
          </Field>
          <Field label="Employment Type">
            <SelectInput value={form.employment_type} onChange={(v) => setField(setForm, "employment_type", v)} options={EMPLOYMENT_TYPES.map((e) => ({ value: e, label: e }))} />
          </Field>
          <Field label="Financial Year">
            <SelectInput value={form.financial_year} onChange={(v) => setField(setForm, "financial_year", v)} options={FINANCIAL_YEARS} />
          </Field>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["annual_ctc", "Annual CTC (₹)"],
            ["monthly_inhand_salary", "Monthly In-Hand (₹)"],
            ["basic_salary", "Basic Salary / month (₹)"],
            ["hra", "HRA / month (₹)"],
            ["special_allowance", "Special Allowance / month (₹)"],
            ["bonus", "Annual Bonus (₹)"],
            ["employer_pf", "Employer PF / month (₹)"],
            ["employer_nps", "Employer NPS / month (₹)"],
            ["monthly_tds", "Monthly TDS (₹)"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput value={form[key]} onChange={(v) => setField(setForm, key, v)} type="number" min="0" />
            </Field>
          ))}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-6">
          <Field label="Current Tax Regime">
            <SelectInput value={form.tax_regime} onChange={(v) => setField(setForm, "tax_regime", v)} options={TAX_REGIME_OPTIONS} />
          </Field>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">80C investments</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["elss_investments", "ELSS"],
              ["ppf", "PPF"],
              ["epf", "EPF (employee)"],
              ["tax_saver_fd", "Tax Saver FD"],
              ["life_insurance", "Life Insurance Premium"],
            ].map(([key, label]) => (
              <Field key={key} label={`${label} (₹/year)`}>
                <TextInput value={form[key]} onChange={(v) => setField(setForm, key, v)} type="number" min="0" />
              </Field>
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Additional deductions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["health_insurance", "Health Insurance (₹)"],
              ["parents_health_insurance", "Parents Health Insurance (₹)"],
              ["nps_contribution", "NPS (80CCD)"],
              ["home_loan_interest", "Home Loan Interest (₹)"],
              ["education_loan_interest", "Education Loan Interest (₹)"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <TextInput value={form[key]} onChange={(v) => setField(setForm, key, v)} type="number" min="0" />
              </Field>
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Housing</p>
          <CheckRow label="Paying rent?" checked={form.paying_rent} onChange={(v) => setField(setForm, "paying_rent", v)} />
          {form.paying_rent && (
            <Field label="Monthly Rent (₹)">
              <TextInput value={form.monthly_rent} onChange={(v) => setField(setForm, "monthly_rent", v)} type="number" min="0" />
            </Field>
          )}
          <CheckRow label="Home loan active?" checked={form.home_loan_active} onChange={(v) => setField(setForm, "home_loan_active", v)} />
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["monthly_food_spend", "Monthly Food Spend (₹)"],
            ["monthly_transport_spend", "Monthly Transport (₹)"],
            ["monthly_shopping_spend", "Monthly Shopping (₹)"],
            ["sip_amount", "SIP Amount / month (₹)"],
            ["emi_obligations", "EMI Obligations / month (₹)"],
            ["savings_goal", "Savings Goal / month (₹)"],
            ["side_income", "Side Income / month (₹)"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput value={form[key]} onChange={(v) => setField(setForm, key, v)} type="number" min="0" />
            </Field>
          ))}
          <Field label="Credit Card Usage">
            <SelectInput value={form.credit_card_usage} onChange={(v) => setField(setForm, "credit_card_usage", v)} options={CREDIT_CARD_USAGE_OPTIONS} />
          </Field>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="space-y-2">
          <CheckRow label="Expecting a salary hike?" checked={form.expecting_salary_hike} onChange={(v) => setField(setForm, "expecting_salary_hike", v)} />
          <CheckRow label="Planning a home loan?" checked={form.planning_home_loan} onChange={(v) => setField(setForm, "planning_home_loan", v)} />
          <CheckRow label="Planning a car loan?" checked={form.planning_car_loan} onChange={(v) => setField(setForm, "planning_car_loan", v)} />
          <CheckRow label="Planning new investments?" checked={form.planning_investments} onChange={(v) => setField(setForm, "planning_investments", v)} />
          <CheckRow label="Planning side income?" checked={form.planning_side_income} onChange={(v) => setField(setForm, "planning_side_income", v)} />
        </div>
      );
    }

    if (step === 6) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Mark documents you have ready. You can upload files from Documents later.
          </p>
          {DOCUMENT_TYPES.map((doc) => (
            <CheckRow
              key={doc.key}
              label={doc.label}
              checked={form.documents?.[doc.key]}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  documents: { ...prev.documents, [doc.key]: v },
                }))
              }
            />
          ))}
        </div>
      );
    }

    if (step === 7 && summary) {
      return (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <Sparkles className="text-indigo-600 shrink-0" size={24} />
            <div>
              <p className="text-sm font-semibold text-gray-900">Your AI Financial Summary</p>
              <p className="text-xs text-gray-500 mt-0.5">Based on your onboarding profile</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase font-medium">Recommended regime</p>
              <p className="text-lg font-bold text-indigo-600 capitalize mt-1">{summary.recommendedRegime}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase font-medium">Tax health score</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{summary.taxHealthScore}/100</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase font-medium">Est. tax liability</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatInr(summary.estimatedTaxLiability)}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase font-medium">Expected refund</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatInr(summary.expectedRefund)}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase font-medium">Unused 80C</p>
              <p className="text-lg font-bold text-amber-600 mt-1">{formatInr(summary.unused80c)}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase font-medium">Potential savings</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatInr(summary.potentialAnnualSavings)}/yr</p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-4 border border-gray-100">
            {summary.insights?.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        </div>
      );
    }

    return <p className="text-sm text-gray-500">Complete the previous steps to see your summary.</p>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>
            Step {step} of {ONBOARDING_STEPS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mt-4">{currentMeta?.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{currentMeta?.subtitle}</p>
      </div>

      <div className="px-6 py-6">{renderStep()}</div>

      {error && (
        <p className="px-6 pb-2 text-xs text-red-600 bg-red-50 border-t border-red-100 py-2">{error}</p>
      )}

      <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between gap-3">
        {step > 1 && step < 7 ? (
          <button type="button" onClick={handleBack} disabled={saving} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">
            <ChevronLeft size={16} /> Back
          </button>
        ) : (
          <span />
        )}

        {step < 7 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {step === 6 ? "Generate summary" : "Continue"}
            {step < 6 && !saving ? <ChevronRight size={16} /> : null}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
