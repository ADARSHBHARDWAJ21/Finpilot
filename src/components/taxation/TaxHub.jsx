"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCw, Search, FileText, CalendarDays, ArrowRight, ShieldCheck } from "lucide-react";
import FinancialYearSelect from "@/components/finance/FinancialYearSelect";
import DownloadButton from "@/components/finance/DownloadButton";
import { TAX_CATEGORIES } from "@/lib/taxation/categories";
import { TAX_SOURCES, estimateTax } from "@/lib/copilot/tax-engine";
import { displayDate, csvExport } from "@/lib/finance/model";
import { saveTaxDetails } from "@/app/finance/actions";
import { WorkspaceHeader } from "@/components/layout/WorkspaceUI";
import { RegimeCards, PreparationJourney, DeductionRows, TaxReadiness, TaxPaymentSummary } from "./TaxVisuals";

const card = "fp-card p-5 sm:p-6";
const button = "fp-button";
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
  return <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[430px] text-sm"><caption className="mb-4 text-left font-semibold">Tax calculation · FY {tax.financialYear} · amounts in INR</caption><thead><tr className="border-b border-border text-left"><th className="py-3 font-medium text-muted-foreground">Calculation</th><th className="px-3 text-right">Old regime</th><th className="px-3 text-right">New regime</th></tr></thead><tbody>{rows.map(([label, old, next], i) => <tr key={label} className={i === rows.length - 1 ? "bg-primary/5 font-semibold" : "border-b border-border"}><td className="py-3 pr-3">{label}</td><td className="px-3 text-right tabular-nums">{money(old)}</td><td className="px-3 text-right tabular-nums">{money(next)}</td></tr>)}</tbody></table></div>;
}

function Assumptions({ tax }) {
  return <details className="rounded-xl border border-border bg-white p-4 text-sm"><summary className="cursor-pointer font-semibold">Calculation scope and official references</summary><ul className="my-4 list-disc space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground">{(tax.warnings || [tax.reason]).map((w) => <li key={w}>{w}</li>)}</ul><p className="mb-3 text-xs text-muted-foreground">Supported tax years: 2024–25, 2025–26 and 2026–27. This is a salary estimate, not an assessment or an income-tax return. Other income and special tax treatments need separate review.</p><div className="flex flex-wrap gap-3">{TAX_SOURCES.slice(0, 4).map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{s.title}</a>)}</div></details>;
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
  return <div className="space-y-5">
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
      <section className={card} aria-labelledby="scenario-inputs"><p className="fp-eyebrow">Your scenario</p><h2 id="scenario-inputs" className="mt-2 text-xl font-medium">Explore a change before saving it.</h2><p className="mb-6 mt-3 text-sm leading-relaxed text-muted-foreground">Annual amounts in rupees. This scenario keeps your saved age, residency and employer type and leaves your records unchanged.</p>
        <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key, label]) => <label key={key} className="text-sm text-muted-foreground">{label}<input aria-label={label} type="number" min="0" max="100000000" step="0.01" value={values[key] ?? 0} onChange={event => setValues(previous => ({...previous, [key]:event.target.value}))} className="fp-input mt-2" /></label>)}<label className="text-sm text-muted-foreground">Eligible annual HRA exemption<input aria-label="Eligible annual HRA exemption" type="number" min="0" max="100000000" step="0.01" value={hraOverride} onChange={event=>setHraOverride(event.target.value)} className="fp-input mt-2" /></label></div>
        <label className="mt-5 flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={!!values.parentsSenior} onChange={event=>setValues(previous=>({...previous,parentsSenior:event.target.checked}))} />A covered parent is an Indian resident aged 60 or older</label>
        <label className="mt-4 flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} />Use these eligible totals to resolve any conflicting declarations for this scenario</label>
        <div className="mt-6 flex flex-wrap gap-3"><button type="button" className={button} onClick={()=>{setValues(original);setHraOverride(original.confirmedHraExemption ?? report.hra.exemption);setConfirmed(false);}}>Reset scenario</button><Link className={button} href={`/taxation/salary-documents?year=${report.year}`}>Edit saved salary</Link></div>
      </section>
      <section className="fp-sticky-result space-y-4" aria-label="Live scenario results"><div><p className="fp-eyebrow mb-3">Live result · FY {report.year}</p><RegimeCards tax={scenario} /></div>{scenario.available && report.tax.available && <div className={card}><h2 className="text-lg font-medium">Change from your saved estimate</h2><dl className="mt-4 space-y-3">{["old","new"].map(regime=>{const delta=scenario[regime].tax-report.tax[regime].tax;return <div key={regime} className="flex flex-wrap justify-between gap-3 text-sm"><dt>{regime==="old"?"Old":"New"} regime</dt><dd className="font-medium tabular-nums">{money(Math.abs(delta))} {delta<0?"less":delta>0?"more":"change"}</dd></div>;})}</dl></div>}{!scenario.available && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{scenario.reason}</p>}<button className="fp-primary-link w-full disabled:opacity-50" disabled={!scenario.available} onClick={download}>Download scenario CSV<ArrowRight size={15} /></button></section>
    </div>
    <details className={card}><summary className="font-medium">Detailed scenario calculation</summary><div className="mt-5"><TaxEstimateTable tax={scenario} /></div></details><Assumptions tax={scenario} />
  </div>;
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
  return <section className="mx-auto w-full max-w-7xl space-y-7 py-2">
    <WorkspaceHeader eyebrow="Your annual tax workspace" title={title} description="Your salary, deductions and records. A clear path through the year." meta={`FY ${year} · Updated ${report.asOf}`}><FinancialYearSelect year={year} /></WorkspaceHeader>
    <nav aria-label="Tax tools" className="fp-tax-navigation">{links.map(([id, label, href]) => <Link key={id} href={`${href}?year=${year}`} aria-current={mode === id ? "page" : undefined}>{label}</Link>)}</nav>
    <div className="flex flex-wrap items-center gap-2"><DownloadButton url={`/api/finance-export?year=${year}&format=pdf`} filename={`Finpilot-tax-${year}.pdf`}>Download report</DownloadButton><Link className={button} href={`/taxation/ai-copilot?year=${year}`}>Ask Copilot<ArrowUpRight size={15} /></Link><Link className={button} href={`/reports?year=${year}`}>Yearly reports</Link><button className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 sm:ml-auto" disabled={refreshing} onClick={() => refresh(() => router.refresh())}><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Refreshing…" : "Refresh"}</button></div>
    {message && <p role="status" className="rounded-xl bg-primary/5 p-4 text-sm text-primary">{message}</p>}
    {mode === "overview" && <>
      <PreparationJourney report={report} filingChecklist={workspace.sections["compliance-filing"]?.checklist} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]"><div className="space-y-4"><RegimeCards tax={tax} /><div className="flex flex-wrap justify-between gap-3 px-1 text-sm text-muted-foreground"><span>Annual gross salary: {tax.available ? money(tax.annualSalary) : "Needs review"}</span><span>{completed}/{total} preparation items reviewed · {progress}%</span></div></div><TaxReadiness report={report} /></div>
      <div className="flex flex-col gap-6 rounded-[20px] border border-primary/10 bg-[#edf2eb] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div className="max-w-2xl"><div className="mb-4 flex items-center gap-2 text-xs font-medium text-primary"><ShieldCheck size={17} />Your planning outlook</div><h2 className="text-xl font-medium leading-snug tracking-tight text-primary">{tax.available ? tax.recommended === "equal" ? "Both regimes have the same salary estimate" : `${tax.recommended === "old" ? "Old" : "New"} regime has a lower salary estimate` : "A clearer picture starts with your details"}</h2><p className="mt-3 text-sm leading-relaxed text-primary/75">{tax.available ? `Difference: ${money(tax.difference)} per year. Review your eligible deductions and the calculation assumptions before choosing.` : tax.reason}</p></div><Link className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:self-center" href={`/taxation/${tax.available ? "compare-regimes" : "salary-documents"}?year=${year}`}>{tax.available ? "Review comparison" : "Add salary details"}<ArrowRight size={16} /></Link></div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-medium tracking-tight">Your tax workspace</h2><p className="mt-1 text-sm text-muted-foreground">Work through each section at your own pace.</p></div><label className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 sm:w-auto"><Search size={16} className="shrink-0 text-muted-foreground" /><input aria-label="Search tax sections" placeholder="Find a section…" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent text-sm outline-none sm:w-44" /></label></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categories.map((c) => { const check = report.checklist.find((s) => s.section === c.slug); const Icon = c.icon; return <Link key={c.slug} href={`/taxation/${c.slug}?year=${year}`} className={`${card} group flex flex-col transition-colors hover:border-primary/30`}><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary"><Icon size={21} strokeWidth={1.7} /></span><ArrowUpRight size={18} className="text-muted-foreground/60 transition-colors group-hover:text-primary" /></div><h3 className="mt-5 font-semibold">{c.title}</h3><p className="mb-6 mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.desc}</p><div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{check.completed}/{check.total} reviewed</span><span>{report.documents.filter((d) => d.section === c.slug).length} documents</span></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/65" style={{ width: `${check.completed / check.total * 100}%` }} /></div></Link>; })}</div>
      {!categories.length && <p className="text-sm text-muted-foreground">No matching section. Try salary, rent or filing.</p>}
      <div className="grid gap-5 lg:grid-cols-2"><div className={card}><h2 className="flex items-center gap-2 font-semibold"><CalendarDays size={18} />Your saved deadlines</h2><p className="mt-3 text-sm">Filing deadline: {displayDate(report.filing.filingDueDate)}</p>{events.length ? <ul className="mt-4 divide-y divide-border">{events.slice(0, 8).map((event) => <li key={event.id} className="flex justify-between gap-4 py-3 text-sm"><Link href="/reminders" className="text-primary">{event.title}</Link><span className="shrink-0 text-muted-foreground">{displayDate(event.due_date)}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No pending tax reminders for this year.</p>}<div className="mt-5 flex flex-wrap gap-3"><Link className={button} href={`/taxation/compliance-filing?year=${year}`}>Set filing deadline</Link><Link className={button} href="/calendar">Open calendar</Link></div></div><div className={card}><h2 className="flex items-center gap-2 font-semibold"><FileText size={18} />Preparation progress</h2><p className="mt-3 text-sm text-muted-foreground">{completed} of {total} checklist items have been manually reviewed. This tracks your preparation; it does not certify a return.</p><ul className="mt-4 space-y-3">{report.checklist.filter((c) => c.completed < c.total).map((c) => <li key={c.section}><Link className="text-sm text-primary" href={`/taxation/${c.section}?year=${year}`}>{TAX_CATEGORIES.find((s) => s.slug === c.section)?.title}: {c.total - c.completed} items to review →</Link></li>)}</ul></div></div>
      <Assumptions tax={tax} />
    </>}
    {mode === "compare" && <><RegimeCards tax={tax} selected={selectedRegime} onChoose={choose} busy={busy} /><div className="fp-attention"><div><p className="fp-eyebrow">Annual difference</p><h2>{tax.available ? money(tax.difference) : "Needs valid inputs"}</h2></div><div><p className="text-sm text-muted-foreground">{tax.available ? tax.recommended === "equal" ? "Both salary estimates are equal." : `${tax.recommended === "old" ? "Old" : "New"} regime has the lower salary estimate. Review the inputs before making your planning choice.` : tax.reason}</p><div className="mt-4 flex flex-wrap gap-3"><Link className={button} href={`/taxation/salary-documents?year=${year}`}>Edit salary</Link><Link className={button} href={`/taxation/tax-saving-proofs?year=${year}`}>Edit deductions</Link></div></div></div><details className={card}><summary className="font-medium">Explore the detailed calculation</summary><div className="mt-5"><TaxEstimateTable tax={tax} /></div></details><p className="text-xs text-muted-foreground">Your saved choice is a planning preference in Finpilot. It does not elect a regime on the government portal.</p><Assumptions tax={tax} /></>}
    {mode === "deductions" && <><DeductionRows report={report} labels={deductionLabels} /><details className={card}><summary className="font-medium">Compare deductions across regimes</summary><div className="mt-5"><TaxEstimateTable tax={tax} /></div></details><Assumptions tax={tax} /></>}
    {mode === "liability" && <><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]"><TaxPaymentSummary report={report} /><section className={card}><p className="fp-eyebrow">Your filing record</p><h2 className="mt-2 text-xl font-medium">A clear record of the year.</h2><dl className="my-5 space-y-4 text-sm">{[["Selected regime",report.filing.regime === "undecided" ? "Not selected" : report.filing.regime.toUpperCase()],["Filing status",{"not-started":"Not started",draft:"Draft prepared",filed:"Filed · self-reported"}[report.filing.status]],["Date filed",displayDate(report.filing.filedDate)]].map(([label,value])=><div key={label} className="flex flex-wrap justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}</dl><p className="mb-5 text-sm leading-relaxed text-muted-foreground">Payments are stored as annual declared totals. Dated payment receipts stay in your filing documents.</p><Link className={button} href={`/taxation/compliance-filing?year=${year}`}>Review receipts and status</Link><a className="mt-4 flex items-center gap-2 text-sm text-primary underline" target="_blank" rel="noreferrer" href="https://www.incometax.gov.in/iec/foportal/">Open Income Tax portal<ArrowUpRight size={15} /></a></section></div><Assumptions tax={tax} /></>}
    {mode === "simulation" && <Scenario report={report} />}
  </section>;
}
