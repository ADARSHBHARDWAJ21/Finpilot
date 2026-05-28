"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { compareRegimes } from "@/lib/tax/compare-regimes";

function n(v) {
  return Number(v) || 0;
}

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function totalByKey(deductions, key) {
  return (deductions ?? [])
    .filter((d) => String(d.key || "").toUpperCase() === key.toUpperCase())
    .reduce((sum, d) => sum + n(d.amount), 0);
}

function section80cFromOnboarding(profile) {
  return (
    n(profile?.elss_investments) +
    n(profile?.ppf) +
    n(profile?.epf) +
    n(profile?.tax_saver_fd) +
    n(profile?.life_insurance)
  );
}

export default function TaxSimulationSection({ taxContext }) {
  const profile = taxContext.onboardingProfile ?? {};
  const deductions = taxContext.deductions ?? [];

  const baseAnnualCtc = n(taxContext.annualCtc);
  const base80c = Math.min(150000, Math.max(totalByKey(deductions, "80C"), section80cFromOnboarding(profile)));
  const base80d = Math.min(50000, totalByKey(deductions, "80D") + n(profile.health_insurance) + n(profile.parents_health_insurance));
  const baseNps = Math.min(50000, totalByKey(deductions, "80CCD_1B") + n(profile.nps_contribution) + n(profile.employer_nps));
  const baseHraExemption = n(taxContext.hraExemption);
  const baseSideIncome = n(profile.side_income);
  const preferredRegime = String(profile.tax_regime || taxContext.recommendedRegime || "new").toLowerCase() === "old" ? "old" : "new";

  const [inputs, setInputs] = useState({
    salaryHikePct: 0,
    annualBonusDelta: 0,
    sideIncomeDelta: 0,
    invest80cMore: 0,
    invest80dMore: 0,
    investNpsMore: 0,
    additionalHomeLoanInterest: 0,
    rentChangePerMonth: 0,
  });

  function updateField(key, value) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  const report = useMemo(() => {
    const simulatedAnnualCtc =
      baseAnnualCtc * (1 + n(inputs.salaryHikePct) / 100) + n(inputs.annualBonusDelta);
    const simulatedSideIncome = Math.max(0, baseSideIncome + n(inputs.sideIncomeDelta));
    const simulated80c = Math.min(150000, base80c + n(inputs.invest80cMore));
    const simulated80d = Math.min(50000, base80d + n(inputs.invest80dMore));
    const simulatedNps = Math.min(50000, baseNps + n(inputs.investNpsMore));
    const simulatedHra = Math.max(0, baseHraExemption + n(inputs.rentChangePerMonth) * 12);
    const homeLoanInterest = Math.max(0, n(profile.home_loan_interest) + n(inputs.additionalHomeLoanInterest));

    const before = compareRegimes({
      annual_ctc: baseAnnualCtc + baseSideIncome,
      section80c: base80c,
      section80d: base80d,
      nps: baseNps,
      hra_exemption: baseHraExemption,
      home_loan_interest: n(profile.home_loan_interest),
    });

    const after = compareRegimes({
      annual_ctc: simulatedAnnualCtc + simulatedSideIncome,
      section80c: simulated80c,
      section80d: simulated80d,
      nps: simulatedNps,
      hra_exemption: simulatedHra,
      home_loan_interest: homeLoanInterest,
    });

    const beforeTax = preferredRegime === "old" ? before.oldResult.tax : before.newResult.tax;
    const afterTax = preferredRegime === "old" ? after.oldResult.tax : after.newResult.tax;
    const delta = Math.round(afterTax - beforeTax);

    const pros = [];
    const cons = [];

    if (n(inputs.invest80cMore) > 0) pros.push(`Extra 80C investment can reduce tax by up to ${formatInr(Math.round(n(inputs.invest80cMore) * 0.2))}.`);
    if (n(inputs.invest80dMore) > 0) pros.push(`Additional 80D helps optimize health insurance deduction.`);
    if (n(inputs.investNpsMore) > 0) pros.push(`NPS contribution improves long-term retirement corpus and can reduce taxable income.`);
    if (delta < 0) pros.push(`Net tax impact improves by ${formatInr(Math.abs(delta))} under your selected changes.`);

    if (n(inputs.salaryHikePct) > 0 || n(inputs.annualBonusDelta) > 0) cons.push("Higher salary/bonus can push total tax liability upward.");
    if (n(inputs.sideIncomeDelta) > 0) cons.push("Extra side income increases taxable income unless offset by deductions.");
    if (delta > 0) cons.push(`Net tax increases by ${formatInr(delta)} with the selected scenario.`);
    if (pros.length === 0) pros.push("No major tax-saving benefit detected in this simulation yet.");
    if (cons.length === 0) cons.push("No major downside detected for this simulation.");

    return {
      beforeTax: Math.round(beforeTax),
      afterTax: Math.round(afterTax),
      delta,
      beforeRecommended: before.recommended,
      afterRecommended: after.recommended,
      pros,
      cons,
      simulatedAnnualCtc: Math.round(simulatedAnnualCtc),
      simulatedSideIncome: Math.round(simulatedSideIncome),
      simulated80c: Math.round(simulated80c),
      simulated80d: Math.round(simulated80d),
      simulatedNps: Math.round(simulatedNps),
      simulatedHra: Math.round(simulatedHra),
      simulatedHomeLoan: Math.round(homeLoanInterest),
    };
  }, [inputs, baseAnnualCtc, baseSideIncome, base80c, base80d, baseNps, baseHraExemption, preferredRegime, profile.home_loan_interest]);

  const inputFields = [
    ["salaryHikePct", "Salary Hike (%)"],
    ["annualBonusDelta", "Bonus Change (Annual ₹)"],
    ["sideIncomeDelta", "Side Income Change (Annual ₹)"],
    ["invest80cMore", "Additional 80C Investment (₹)"],
    ["invest80dMore", "Additional 80D Investment (₹)"],
    ["investNpsMore", "Additional NPS (80CCD) (₹)"],
    ["additionalHomeLoanInterest", "Additional Home Loan Interest (₹)"],
    ["rentChangePerMonth", "Monthly Rent Change (₹)"],
  ];

  return (
    <div className="w-full max-w-[1500px] min-w-0 space-y-5">
      <div>
        <Link href="/taxation" className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-indigo-600 mb-3">
          <ArrowLeft size={14} />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tax Impact Simulation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tell us what changes you plan to make. We generate a scenario report with tax impact, pros, and cons.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Simulation Form</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputFields.map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium text-gray-600">{label}</span>
                <input
                  type="number"
                  value={inputs[key]}
                  onChange={(e) => updateField(key, Number(e.target.value) || 0)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Report</h2>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-gray-500">Current Tax</span><span className="font-semibold">{formatInr(report.beforeTax)}</span></p>
            <p className="flex justify-between"><span className="text-gray-500">After Changes</span><span className="font-semibold">{formatInr(report.afterTax)}</span></p>
            <p className="flex justify-between border-t pt-2"><span className="text-gray-700 font-semibold">Net Impact</span><span className={`font-bold ${report.delta > 0 ? "text-red-600" : "text-emerald-600"}`}>{report.delta > 0 ? "+" : ""}{formatInr(report.delta)}</span></p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-emerald-700 mb-2">Pros</p>
            <ul className="space-y-2">
              {report.pros.map((p) => (
                <li key={p} className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{p}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-orange-700 mb-2">Cons</p>
            <ul className="space-y-2">
              {report.cons.map((c) => (
                <li key={c} className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">{c}</li>
              ))}
            </ul>
          </div>

          <Link href="/taxation/ai-copilot" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline">
            Ask AI to optimize this scenario
            <Sparkles size={14} />
          </Link>
        </section>
      </div>
    </div>
  );
}

