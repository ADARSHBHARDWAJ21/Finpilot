"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCw, Search, FileText, CalendarDays } from "lucide-react";
import FinancialYearSelect from "@/components/finance/FinancialYearSelect";
import DownloadButton from "@/components/finance/DownloadButton";
import { TAX_CATEGORIES } from "@/lib/taxation/categories";
import { TAX_SOURCES, estimateTax } from "@/lib/copilot/tax-engine";
import { displayDate, csvExport } from "@/lib/finance/model";
import { saveTaxDetails } from "@/app/finance/actions";

const card = "rounded-2xl border border-slate-200 bg-white p-5 md:p-6";
const button = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50";
const money = (v) => v == null ? "Not supplied" : `₹${Math.round(v).toLocaleString("en-IN")}`;
const links = [
  ["overview", "Tax overview", "/taxation"],
  ["compare", "Compare regimes", "/taxation/compare-regimes"],
  ["deductions", "Deductions", "/taxation/deductions"],
  ["liability", "Tax payments", "/taxation/liability-tracker"],
  ["simulation", "What-if calculator", "/taxation/simulation"],
];
const deductionLabels = {
  standard: "Standard deduction", section80c: "80C / 80CCC",
  healthInsurance: "80D health insurance", personalNps: "NPS extra deduction",
  personalNpsWithin80c: "NPS within the shared 80C pool", employerNps: "Employer NPS",
  hra: "HRA exemption", homeLoanInterest: "Self-occupied home loan interest",
  educationLoanInterest: "Education loan interest",
};

function Figures({ rows }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{rows.map(([label, value]) => <div className={card} key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold tracking-tight">{value}</p></div>)}</div>;
}

export function TaxEstimateTable({ tax }) {
  if (!tax.available) return <div role="status" className="rounded-xl bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">{tax.reason}</div>;
  const deductionKeys = Object.keys(deductionLabels);
  const rows = [
    ["Annual gross salary", tax.annualSalary, tax.annualSalary],
    ...deductionKeys.map((key) => [deductionLabels[key], tax.old.deductions[key] || 0, tax.new.deductions[key] || 0]),
    ["Taxable income (rounded)", tax.old.taxableIncome, tax.new.taxableIncome],
    ["Slab tax", tax.old.baseTax, tax.new.baseTax],
    ["Rebate", tax.old.rebate, tax.new.rebate],
    ["Rebate marginal relief", tax.old.marginalRelief, tax.new.marginalRelief],
    ["Surcharge", tax.old.surcharge, tax.new.surcharge],
    ["Surcharge marginal relief", tax.old.surchargeRelief, tax.new.surchargeRelief],
    ["Health & education cess", tax.old.cess, tax.new.cess],
    ["Annual salary tax (rounded)", tax.old.tax, tax.new.tax],
  ];
  return <div className="overflow-x-auto"><table className="w-full min-w-[430px] text-sm"><caption className="mb-4 text-left font-semibold">Tax calculation · FY {tax.financialYear} · amounts in INR</caption><thead><tr className="border-b border-slate-200 text-left"><th className="py-3 font-medium text-slate-500">Calculation</th><th className="px-3 text-right">Old regime</th><th className="px-3 text-right">New regime</th></tr></thead><tbody>{rows.map(([label, old, next], i) => <tr key={label} className={i === rows.length - 1 ? "bg-violet-50 font-bold" : "border-b border-slate-100"}><td className="py-3 pr-3">{label}</td><td className="px-3 text-right tabular-nums">{money(old)}</td><td className="px-3 text-right tabular-nums">{money(next)}</td></tr>)}</tbody></table></div>;
}

function Assumptions({ tax }) {
  return <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm"><summary className="cursor-pointer font-semibold">Calculation scope and official references</summary><ul className="my-4 list-disc space-y-2 pl-5 text-xs leading-relaxed text-slate-600">{(tax.warnings || [tax.reason]).map((w) => <li key={w}>{w}</li>)}</ul><p className="mb-3 text-xs text-slate-500">Supported tax years: 2024–25, 2025–26 and 2026–27. This is a salary estimate, not an assessment or an income-tax return. Other income and special tax treatments need separate review.</p><div className="flex flex-wrap gap-3">{TAX_SOURCES.slice(0, 4).map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-xs text-violet-600 underline">{s.title}</a>)}</div></details>;
}

function Scenario({ report }) {
  const original = report.taxInputs;
  const [values, setValues] = useState(original);
  const [hraOverride, setHraOverride] = useState(original.confirmedHraExemption ?? report.hra.exemption);
  const [confirmed, setConfirmed] = useState(false);
  const fields = [
    ["annualSalary", "Annual gross salary"], ["section80c", "Eligible 80C / 80CCC total"],
    ["healthInsurance", "Self / family health deduction"], ["parentsHealthInsurance", "Parents health deduction"],
    ["personalNps", "Personal NPS contribution"], ["employerNps", "Employer NPS contribution"],
    ["confirmedHomeLoanInterest", "Eligible home-loan interest"], ["educationLoanInterest", "Eligible education-loan interest"],
  ];
  const invalid = [...fields.map(([key]) => values[key]), hraOverride].some((v) => v === "" || !Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 100000000);
  const scenario = invalid ? { available: false, reason: "Enter valid annual amounts between 0 and ₹10 crore." } : estimateTax({ ...values, confirmedHraExemption: hraOverride, salaryIsCtcProxy: false, ...(confirmed ? { deductionConflicts: [], employerNpsUnconfirmed: false } : {}) });
  function download() {
    if (!scenario.available) return;
    const rows = [["What-if estimate", `FY ${report.year}; hypothetical inputs, not saved declarations`], ...fields.map(([key, label]) => [label, values[key]]), ["HRA exemption", hraOverride], ["Old regime salary tax", scenario.old?.tax], ["New regime salary tax", scenario.new?.tax], ...scenario.warnings.map((w) => ["Assumption", w])];
    const url = URL.createObjectURL(new Blob([csvExport(rows)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `Finpilot-scenario-${report.year}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-5"><div className={card}><h2 className="text-lg font-semibold">Explore a change before saving it</h2><p className="mb-5 mt-2 text-sm text-slate-500">Amounts are annual, in rupees. This calculator does not change your saved records. Basic salary, age, residency and employer type stay as saved in Salary Documents.</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{fields.map(([key, label]) => <label key={key} className="text-sm text-slate-600">{label}<input type="number" min="0" max="100000000" step="0.01" value={values[key] ?? 0} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>)}<label className="text-sm text-slate-600">Eligible annual HRA exemption<input type="number" min="0" max="100000000" step="0.01" value={hraOverride} onChange={(e) => setHraOverride(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label></div><label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={!!values.parentsSenior} onChange={(e) => setValues((v) => ({ ...v, parentsSenior: e.target.checked }))} />A covered parent is an Indian resident aged 60 or older</label><label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />Use the entered eligible totals to resolve any conflicting profile declarations for this scenario</label><div className="mt-5 flex flex-wrap gap-3"><button className={button} onClick={() => { setValues(original); setHraOverride(original.confirmedHraExemption ?? report.hra.exemption); setConfirmed(false); }}>Reset to saved inputs</button><button className={button} disabled={!scenario.available} onClick={download}>Download scenario CSV</button><Link className={button} href={`/taxation/salary-documents?year=${report.year}`}>Edit saved salary</Link></div></div>{scenario.available && report.tax.available && <Figures rows={[["Saved old-regime estimate", money(report.tax.old?.tax)], ["Scenario old-regime estimate", money(scenario.old?.tax)], ["Saved new-regime estimate", money(report.tax.new?.tax)], ["Scenario new-regime estimate", money(scenario.new?.tax)]]} />}<div className={card}><TaxEstimateTable tax={scenario} /></div><Assumptions tax={scenario} /></div>;
}

export default function TaxHub({ mode = "overview", report, workspace, events = [] }) {
  const router = useRouter();
  const [refreshing, refresh] = useTransition();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [filingVersion, setFilingVersion] = useState(workspace.sections["compliance-filing"]?.updated_at || null);
  const [selectedRegime, setSelectedRegime] = useState(report.filing.regime);
  const tax = report.tax, year = report.year;
  const completed = report.checklist.reduce((s, c) => s + c.completed, 0);
  const total = report.checklist.reduce((s, c) => s + c.total, 0);
  const progress = total ? Math.round(completed / total * 100) : 0;
  const title = links.find(([id]) => id === mode)?.[1] || "Tax overview";
  const categories = TAX_CATEGORIES.filter((c) => `${c.title} ${c.desc}`.toLowerCase().includes(query.toLowerCase()));
  async function choose(regime) {
    setBusy(true); setMessage("");
    try {
      const result = await saveTaxDetails(year, "compliance-filing", { ...report.filing, regime }, filingVersion);
      if (result.error) throw Error(result.error);
      setFilingVersion(result.section.updated_at); setSelectedRegime(regime);
      setMessage(`${regime === "old" ? "Old" : "New"} regime saved for FY ${year}.`); router.refresh();
    } catch (e) { setMessage(e.message || "Could not save the regime. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-7xl space-y-6 p-1 md:p-3">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Your yearly tax workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm text-slate-500">FY {year} · Saved records · Updated {report.asOf}</p></div><FinancialYearSelect year={year} /></header>
    <nav aria-label="Tax tools" className="flex flex-wrap gap-2">{links.map(([id, label, href]) => <Link key={id} href={`${href}?year=${year}`} aria-current={mode === id ? "page" : undefined} className={`${button} ${mode === id ? "border-violet-200 bg-violet-50 text-violet-700" : "text-slate-600"}`}>{label}</Link>)}</nav>
    <div className="flex flex-wrap gap-3"><button className={button} disabled={refreshing} onClick={() => refresh(() => router.refresh())}><RefreshCw size={15} />{refreshing ? "Refreshing…" : "Refresh calculations"}</button><DownloadButton url={`/api/finance-export?year=${year}&format=pdf`} filename={`Finpilot-tax-${year}.pdf`}>Download tax report</DownloadButton><Link className={button} href={`/taxation/ai-copilot?year=${year}`}>Ask Gemini Copilot<ArrowUpRight size={15} /></Link><Link className={button} href={`/reports?year=${year}`}>All yearly reports</Link></div>
    {message && <p role="status" className="rounded-xl bg-violet-50 p-4 text-sm text-violet-900">{message}</p>}
    {mode === "overview" && <>
      <Figures rows={[["Annual gross salary / profile estimate", tax.available ? money(tax.annualSalary) : "Needs review"], ["Old-regime salary estimate", tax.available ? money(tax.old.tax) : "Needs review"], ["New-regime salary estimate", tax.available ? money(tax.new.tax) : "Needs review"], ["Checklist reviewed", `${completed}/${total} · ${progress}%`]]} />
      <div className={`${card} flex flex-wrap items-center justify-between gap-4`}><div><h2 className="font-semibold">{tax.available ? tax.recommended === "equal" ? "Both regimes have the same salary estimate" : `${tax.recommended === "old" ? "Old" : "New"} regime has a lower salary estimate` : "Complete your tax inputs"}</h2><p className="mt-2 max-w-3xl text-sm text-slate-500">{tax.available ? `Difference: ${money(tax.difference)} per year. Review assumptions and eligible deductions before selecting a regime.` : tax.reason}</p></div><Link className={button} href={`/taxation/${tax.available ? "compare-regimes" : "salary-documents"}?year=${year}`}>{tax.available ? "Review comparison" : "Edit salary details"}</Link></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Your tax sections</h2><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><Search size={16} className="text-slate-400" /><input aria-label="Search tax sections" placeholder="Find salary, rent, proofs…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56 text-sm outline-none" /></label></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categories.map((c) => { const check = report.checklist.find((s) => s.section === c.slug); const Icon = c.icon; return <Link key={c.slug} href={`/taxation/${c.slug}?year=${year}`} className={`${card} transition-colors hover:border-violet-300`}><Icon size={22} className={c.iconColor} /><h3 className="mt-4 font-semibold">{c.title}</h3><p className="mt-2 text-sm text-slate-500">{c.desc}</p><div className="mt-5 flex justify-between text-xs text-slate-500"><span>{check.completed}/{check.total} reviewed</span><span>{report.documents.filter((d) => d.section === c.slug).length} documents</span></div><div className="mt-2 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-violet-500" style={{ width: `${check.completed / check.total * 100}%` }} /></div></Link>; })}</div>
      {!categories.length && <p className="text-sm text-slate-500">No matching section. Try salary, rent or filing.</p>}
      <div className="grid gap-5 lg:grid-cols-2"><div className={card}><h2 className="flex items-center gap-2 font-semibold"><CalendarDays size={18} />Your saved deadlines</h2><p className="mt-3 text-sm">Filing deadline: {displayDate(report.filing.filingDueDate)}</p>{events.length ? <ul className="mt-4 divide-y divide-slate-100">{events.slice(0, 8).map((event) => <li key={event.id} className="flex justify-between gap-4 py-3 text-sm"><Link href="/reminders" className="text-violet-600">{event.title}</Link><span className="shrink-0 text-slate-500">{displayDate(event.due_date)}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No pending tax reminders for this year.</p>}<div className="mt-5 flex flex-wrap gap-3"><Link className={button} href={`/taxation/compliance-filing?year=${year}`}>Set filing deadline</Link><Link className={button} href="/calendar">Open calendar</Link></div></div><div className={card}><h2 className="flex items-center gap-2 font-semibold"><FileText size={18} />Preparation progress</h2><p className="mt-3 text-sm text-slate-500">{completed} of {total} checklist items have been manually reviewed. This tracks your preparation; it does not certify a return.</p><ul className="mt-4 space-y-3">{report.checklist.filter((c) => c.completed < c.total).map((c) => <li key={c.section}><Link className="text-sm text-violet-600" href={`/taxation/${c.section}?year=${year}`}>{TAX_CATEGORIES.find((s) => s.slug === c.section)?.title}: {c.total - c.completed} items to review →</Link></li>)}</ul></div></div>
      <Assumptions tax={tax} />
    </>}
    {mode === "compare" && <><Figures rows={[["Old-regime salary estimate", tax.available ? money(tax.old.tax) : "Needs review"], ["New-regime salary estimate", tax.available ? money(tax.new.tax) : "Needs review"], ["Annual difference", tax.available ? money(tax.difference) : "Not calculated"], ["Your saved choice", selectedRegime === "undecided" ? "Not selected" : selectedRegime.toUpperCase()]]} /><div className={card}><TaxEstimateTable tax={tax} /></div><div className="flex flex-wrap gap-3">{["old", "new"].map((regime) => <button key={regime} className={button} disabled={busy || !tax.available} aria-pressed={selectedRegime === regime} onClick={() => choose(regime)}>{selectedRegime === regime ? "Selected: " : "Choose "}{regime} regime</button>)}<Link className={button} href={`/taxation/salary-documents?year=${year}`}>Edit salary</Link><Link className={button} href={`/taxation/tax-saving-proofs?year=${year}`}>Edit deductions</Link></div><p className="text-xs text-slate-500">This saves a planning preference in Finpilot. It does not elect a regime on the government portal.</p><Assumptions tax={tax} /></>}
    {mode === "deductions" && <><div className={card}><h2 className="text-xl font-semibold">Deductions and proofs for this year</h2><p className="mt-2 text-sm text-slate-500">Amounts below come from the same calculation used in the regime comparison. Eligibility caps are applied; duplicate legacy declarations must be confirmed before calculating.</p><div className="my-5 flex flex-wrap gap-3"><Link className={button} href={`/taxation/tax-saving-proofs?year=${year}`}>Add or edit deductions</Link><Link className={button} href={`/taxation/rent-hra?year=${year}`}>Calculate HRA</Link><Link className={button} href={`/taxation/tax-saving-proofs?year=${year}`}>Upload deduction proofs</Link></div><TaxEstimateTable tax={tax} /></div><Assumptions tax={tax} /></>}
    {mode === "liability" && <><Figures rows={[["Selected regime", report.filing.regime === "undecided" ? "Not selected" : report.filing.regime.toUpperCase()], ["Annual TDS declared", money(report.filing.annualTds)], ["Advance tax declared", money(report.filing.advanceTax)], ["Filing status", { "not-started": "Not started", draft: "Draft prepared", filed: "Filed (self-reported)" }[report.filing.status]]]} /><div className={card}><h2 className="text-xl font-semibold">Salary tax reconciliation</h2>{report.reconciliation.available ? <div className="mt-5 grid gap-5 sm:grid-cols-3">{[["Salary tax estimate", report.reconciliation.liability], ["Balance against salary estimate", report.reconciliation.balance], ["Excess payments against salary estimate", report.reconciliation.excess]].map(([label, value]) => <div key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{money(value)}</p></div>)}</div> : <p role="status" className="mt-4 text-sm text-slate-600">{report.reconciliation.reason}</p>}<p className="mt-5 text-xs leading-relaxed text-slate-500">Uses only the annual payments you entered. Excess payments are not an approved refund. Other income, tax credits, late fees and interest can change the final balance. Verify Form 26AS/AIS and the government assessment.</p><div className="mt-5 flex flex-wrap gap-3"><Link className={button} href={`/taxation/compliance-filing?year=${year}`}>Edit tax payments and filing</Link><a className={button} target="_blank" rel="noreferrer" href="https://www.incometax.gov.in/iec/foportal/">Open Income Tax portal<ArrowUpRight size={15} /></a></div></div><Assumptions tax={tax} /></>}
    {mode === "simulation" && <Scenario report={report} />}
  </section>;
}
