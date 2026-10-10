"use client";

import { ArrowRight, Calculator, Check, FileCheck2, FileText, FolderOpen, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { SAMPLE_TAX_PROOFS } from "./sample-tax-model";
import styles from "./SampleWorkspace.module.css";

const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
export const regimeLabel = regime => regime === "equal" ? "Equal estimate" : regime === "old" ? "Old regime" : "New regime";

export function SampleProofChecklist({ model, onChange, compact = false }) {
  return <div className={styles.taxChecklist}>
    <div className={styles.proofProgress}><span style={{ width: `${model.reviewed / SAMPLE_TAX_PROOFS.length * 100}%` }} /></div>
    <p className={styles.hint} role="status">{model.reviewed} of {SAMPLE_TAX_PROOFS.length} sample proof sections reviewed</p>
    {SAMPLE_TAX_PROOFS.map(proof => <label key={proof.id} className={styles.taxProofRow}>
      <input type="checkbox" checked={model.profile.proofs[proof.id]} onChange={event => onChange({ proofs: { ...model.profile.proofs, [proof.id]: event.target.checked } })} />
      <span><strong>{proof.label}</strong>{!compact && <small>{proof.file} · Illustrative record</small>}</span><span>{model.profile.proofs[proof.id] ? "Reviewed" : "To review"}</span>
    </label>)}
    {!compact && <p className={styles.hint}>These are sample checklist entries. No documents are uploaded or verified in this demo.</p>}
  </div>;
}

export function SampleRegimePair({ model }) {
  return <div className={styles.regimeComparison} aria-label="Sample tax regime estimates">{["old", "new"].map(regime => <div key={regime} data-recommended={model.available && model.tax.recommended === regime}>
    <span>{regimeLabel(regime)}</span><strong>{model.available ? money(model.tax[regime].tax) : "—"}</strong>
    <small>{model.available && model.tax.recommended === regime ? "Lower sample estimate" : "Estimated annual tax"}</small>
  </div>)}</div>;
}

function AmountField({ field, label, model, onChange, note }) {
  const error = model.errors[field];
  return <label className={styles.taxAmountField}><span>{label}</span><div><span aria-hidden="true">₹</span><input type="number" inputMode="numeric" min={field === "annualSalary" ? 1 : 0} max="10000000" step="1000" value={model.profile[field]} onChange={event => onChange({ [field]: event.target.value })} aria-label={label} aria-invalid={Boolean(error)} aria-describedby={error ? `sample-${field}-error` : undefined} /></div>{error ? <small id={`sample-${field}-error`} className={styles.error}>{error}</small> : note && <small>{note}</small>}</label>;
}

export default function SampleTaxWorkspace({ model, onChange, onAskCopilot }) {
  const deductions = model.available ? [
    { label: "Standard deduction", amount: model.tax.old.deductions.standard, note: "Old-regime salary deduction" },
    { label: "80C", amount: model.tax.old.deductions.section80c, note: "Eligible annual amount, capped by the engine" },
    { label: "Health insurance · 80D", amount: model.tax.old.deductions.healthInsurance, note: "Sample resident aged 35, self/family only" },
    { label: "Personal NPS", amount: model.tax.old.deductions.personalNps + model.tax.old.deductions.personalNpsWithin80c, note: "Eligible annual employee contribution" },
    { label: "Rent & HRA", amount: model.tax.old.deductions.hra, note: "12-month sample rental period, non-metro" },
  ] : [];
  return <>
    <div className={styles.taxIntro}><div><span className={styles.domainKicker}><FileCheck2 size={15} />Your tax year</span><h2>A calmer year, one detail at a time.</h2><p>Compare salary tax estimates, explore deductions and review the records behind them.</p></div><span className={styles.yearPill}>FY {model.year}</span></div>
    <div className={styles.taxGrid}>
      <section className={`${styles.card} ${styles.taxTint}`} aria-labelledby="sample-regime-heading"><div className={styles.cardHeading}><h2 id="sample-regime-heading"><Calculator size={18} />Old or new?</h2><span>Salary-only estimate</span></div><SampleRegimePair model={model} />
        <p className={styles.regimeDifference} role="status">{model.available ? model.tax.recommended === "equal" ? "Both regimes have the same sample estimate." : `${regimeLabel(model.tax.recommended)} is lower by ${money(model.tax.difference)} for this sample profile.` : "Complete the salary and deduction inputs to compare estimates."}</p>
        <button type="button" className={styles.textButton} onClick={() => onAskCopilot("regime")}>Let Copilot explain the difference<Sparkles size={15} /></button>
      </section>
      <section className={styles.card} aria-labelledby="sample-salary-heading"><div className={styles.cardHeading}><h2 id="sample-salary-heading"><ReceiptText size={18} />Try your salary scenario.</h2><span>Annual amounts</span></div><div className={styles.taxInputGrid}><AmountField field="annualSalary" label="Annual gross salary" model={model} onChange={onChange} /><AmountField field="section80c" label="Annual 80C amount" model={model} onChange={onChange} /><AmountField field="healthInsurance" label="Annual health premium" model={model} onChange={onChange} /><AmountField field="personalNps" label="Annual personal NPS" model={model} onChange={onChange} /></div><p className={styles.hint}>Change an amount to recalculate both regimes. Each tax year keeps its own sample values.</p></section>
      <section className={styles.card} aria-labelledby="sample-deductions-heading"><div className={styles.cardHeading}><h2 id="sample-deductions-heading">The details behind the estimate.</h2><span>Old regime</span></div><dl className={styles.taxDeductionList}>{deductions.map(item => <div key={item.label}><dt>{item.label}<small>{item.note}</small></dt><dd>{money(item.amount)}</dd></div>)}</dl>{model.available ? <div className={styles.deductionTotal}><span>Total eligible deductions</span><strong>{money(model.totalOldDeductions)}</strong></div> : <p className={styles.hint}>Valid inputs are needed to show eligible deductions.</p>}<p className={styles.hint}>The new-regime estimate uses its own standard deduction. These old-regime deductions are not carried across.</p></section>
      <section className={styles.card} aria-labelledby="sample-hra-heading"><div className={styles.cardHeading}><h2 id="sample-hra-heading">Give rent its context.</h2><span>Rent & HRA</span></div><div className={styles.taxInputGrid}><AmountField field="monthlyRent" label="Monthly rent" model={model} onChange={onChange} /><AmountField field="annualHra" label="Annual HRA received" model={model} onChange={onChange} /><AmountField field="annualBasic" label="Annual basic salary" model={model} onChange={onChange} /></div><div className={styles.hraSummary}><span>Sample eligible HRA exemption</span><strong>{model.available ? money(model.tax.old.deductions.hra) : "—"}</strong></div><p className={styles.hint}>Assumes 12 rental months in a non-metro city and no qualifying DA or commission.</p><button type="button" className={styles.textButton} onClick={() => onAskCopilot("hra")}>Explain this HRA example<ArrowRight size={15} /></button></section>
      <section className={styles.card} aria-labelledby="sample-proofs-heading"><div className={styles.cardHeading}><h2 id="sample-proofs-heading"><FolderOpen size={18} />Your records, together.</h2><span>Sample checklist</span></div><SampleProofChecklist model={model} onChange={onChange} /></section>
      <section className={`${styles.card} ${styles.taxTint}`} aria-labelledby="sample-filing-heading"><div className={styles.cardHeading}><h2 id="sample-filing-heading"><FileText size={18} />Prepare before filing.</h2><span>Sample only</span></div><label className={styles.regimeSelector}><span>Choose a sample regime</span><select value={model.profile.regime} onChange={event => onChange({ regime: event.target.value })}><option value="undecided">Not selected</option><option value="old">Old regime</option><option value="new">New regime</option></select></label><AmountField field="annualTds" label="Annual TDS already recorded" model={model} onChange={onChange} /><div className={styles.filingSummary} role="status">{model.selectedTax == null ? <p>Choose a regime with valid inputs to compare estimated tax with sample TDS.</p> : <><span>{model.outstanding > 0 ? "Sample tax remaining" : "Sample surplus TDS"}</span><strong>{money(model.outstanding > 0 ? model.outstanding : model.surplus)}</strong><p>Salary-only comparison. A real refund or payment depends on the complete return.</p></>}</div><p className={styles.filingState}><ShieldCheck size={14} />No tax return is submitted in this demo.</p></section>
    </div>
    <div className={styles.taxAssumptions}><Check size={17} /><p>Illustrative Indian resident aged 35 with ordinary salary income. Uses the app’s shared tax engine, including applicable rebates and cess. Banking interest, capital gains, side income and employer NPS are outside this sample calculation.</p></div>
  </>;
}
