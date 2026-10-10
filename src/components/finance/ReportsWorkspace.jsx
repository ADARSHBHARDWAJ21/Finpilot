"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Wallet, Rows3, FileText, ArrowRight } from "lucide-react";
import FinancialYearSelect from "./FinancialYearSelect";
import DownloadButton from "./DownloadButton";
import { WorkspaceHeader, ProgressLine } from "@/components/layout/WorkspaceUI";
import { RegimeCards } from "@/components/taxation/TaxVisuals";
const money = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const card = "fp-card p-5 sm:p-6";
export default function ReportsWorkspace({ report }) {
  const [tab, setTab] = useState("Overview");
  const tabs = ["Overview", "Money", "Tax & filing", "Documents"];
  const [comparisonMonth, setComparisonMonth] = useState(()=>report.months.findLast(month=>month.income || month.expenses)?.month || report.months[0].month);
  const comparisonIndex = report.months.findIndex(month=>month.month===comparisonMonth);
  const comparison = report.months[comparisonIndex];
  const previous = report.months[comparisonIndex-1];
  const previousHasRecords = previous && report.transactions.some(row=>String(row.transaction_date).slice(0,7) === previous.month);
  const selectedHasRecords = report.transactions.some(row=>String(row.transaction_date).slice(0,7) === comparisonMonth);
  const reviewed = report.checklist.reduce((sum,item)=>sum+item.completed,0);
  const checklistTotal = report.checklist.reduce((sum,item)=>sum+item.total,0);
  const max = Math.max(
    1,
    ...report.months.map((m) => Math.max(m.income, m.expenses)),
  );
  return (
    <section className="mx-auto w-full max-w-7xl space-y-7 py-2">
      <WorkspaceHeader eyebrow="A wider perspective" title="Reports" description="The story behind your money and your tax year, ready to review or download." meta={`FY ${report.year} · April–March · Updated ${report.asOf}`}><FinancialYearSelect year={report.year} /></WorkspaceHeader>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3">
        <span className="mr-auto flex items-center gap-2 px-2 py-2 text-sm font-medium"><FileText size={17} className="text-primary" />Export your year</span>
        <DownloadButton url={`/api/finance-export?year=${report.year}&format=pdf`} filename={`Finpilot-${report.year}.pdf`}>Download report PDF</DownloadButton>
        <details className="relative"><summary className="rounded-xl border border-border bg-background px-4 text-sm">More export options</summary><div className="absolute right-0 top-full z-20 mt-2 grid w-60 gap-2 rounded-xl border border-border bg-white p-3 shadow-lg">{[
          ["csv", "Transactions CSV"], ["zip", "Full filing package"],
        ].map(([format, label]) => (
          <DownloadButton
            key={format}
            url={`/api/finance-export?year=${report.year}&format=${format}`}
            filename={`Finpilot-${report.year}.${format}`}
          >
            {label}
          </DownloadButton>
        ))}</div></details>
      </div>
      {tab === "Money" && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Recorded income", money(report.income), ArrowDownLeft],
          ["Recorded expenses", money(report.expenses), ArrowUpRight],
          ["Net cashflow", money(report.income - report.expenses), Wallet],
          ["Transactions", report.transactions.length, Rows3],
        ].map(([label, value, Icon]) => (
          <div className={`${card} min-w-0`} key={label}>
            <div className="flex items-start justify-between gap-2"><p className="text-xs leading-relaxed text-muted-foreground">{label}</p><Icon size={16} strokeWidth={1.7} className="shrink-0 text-muted-foreground/60" /></div>
            <p className="mt-4 break-words text-xl font-medium tracking-tight tabular-nums sm:text-2xl">{value}</p>
          </div>
        ))}
      </div>}
      <p className="text-xs text-muted-foreground">
        Totals use transactions saved for this financial year. Missing
        transactions are not estimated. Review transfers and refunds in
        Transactions to keep cashflow categories accurate.
      </p>
      <nav
        aria-label="Report sections"
        className="flex gap-1 overflow-x-auto border-b border-border pb-1"
      >
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === "Overview" && <div className="space-y-5"><div className="fp-overview-domains"><section className="fp-domain-card"><div className="fp-domain-heading"><span><Wallet size={18}/>Money report</span><span>FY {report.year}</span></div><h2>Your year in recorded finances.</h2><p>{report.transactions.length} transactions saved for April–March.</p><dl className="fp-domain-figures"><div><dt>Recorded income</dt><dd>{money(report.income)}</dd></div><div><dt>Recorded spending</dt><dd>{money(report.expenses)}</dd></div></dl><div className="fp-domain-bottom"><button className="fp-primary-link" onClick={()=>setTab("Money")}>Explore cashflow<ArrowRight size={15}/></button><span className="text-xs text-muted-foreground">Net cashflow: {money(report.income-report.expenses)}</span></div></section><section className="fp-domain-card fp-tax-surface"><div className="fp-domain-heading"><span><FileText size={18}/>Tax report</span><span>FY {report.year}</span></div><h2>The records behind your tax year.</h2><p>Salary estimates and manually reviewed preparation items.</p><dl className="fp-domain-figures"><div><dt>Old-regime salary estimate</dt><dd>{report.tax.available ? money(report.tax.old.tax) : "—"}</dd></div><div><dt>New-regime salary estimate</dt><dd>{report.tax.available ? money(report.tax.new.tax) : "—"}</dd></div></dl><ProgressLine value={checklistTotal ? reviewed/checklistTotal*100 : 0} label={`${reviewed}/${checklistTotal} items reviewed`} /><div className="fp-domain-bottom"><button className="fp-primary-link" onClick={()=>setTab("Tax & filing")}>Explore tax report<ArrowRight size={15}/></button><span className="text-xs text-muted-foreground">{report.documents.length} private documents</span></div></section></div><p className="text-sm text-muted-foreground">This is a preview of your saved year. Downloads include the recorded figures and the calculation scope.</p></div>}
      {tab === "Money" && <section className="fp-card p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-medium">A month in perspective.</h2><p className="mt-2 text-sm text-muted-foreground">Compare recorded amounts with the preceding month in this report.</p></div><label className="text-sm text-muted-foreground">Compare month<select aria-label="Compare report month" value={comparisonMonth} onChange={event=>setComparisonMonth(event.target.value)} className="fp-input mt-2">{report.months.map(month=><option key={month.month} value={month.month}>{month.label}</option>)}</select></label></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["Income","income"],["Spending","expenses"]].map(([label,key])=>{const delta=previous ? comparison[key]-previous[key] : 0;return <div key={key} className="rounded-xl bg-secondary p-4"><p className="text-sm text-muted-foreground">{label} · {comparison.label}</p><p className="mt-2 text-2xl font-medium tabular-nums">{selectedHasRecords ? money(comparison[key]) : "No records"}</p><p className="mt-3 text-xs text-muted-foreground">{previousHasRecords && selectedHasRecords ? `${money(Math.abs(delta))} ${delta<0?"lower":delta>0?"higher":"change"} than ${previous.label}.` : previous ? "Earlier or selected-month records are missing; a comparison is unavailable." : "This is the earliest month in the selected report."}</p></div>;})}</div></section>}
      {tab === "Money" && (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className={card}>
            <h2 className="text-lg font-medium tracking-tight">Monthly cashflow</h2>
            <p className="mb-6 mt-1 text-xs text-muted-foreground">
              Income and expenses, side by side
            </p>
            <div className="mb-6 flex gap-5 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-primary/80" />Income</span><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-[#c69a80]" />Expenses</span></div>
            <div className="space-y-5">
              {report.months.map((m) => (
                <div
                  key={m.month}
                  className="grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[82px_minmax(0,1fr)]"
                >
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 min-w-0 flex-1 rounded bg-muted">
                        <div
                          className="h-2 rounded bg-primary/80"
                          style={{ width: `${(m.income / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-[11px] tabular-nums sm:w-28 sm:text-xs">
                        {money(m.income)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 min-w-0 flex-1 rounded bg-muted">
                        <div
                          className="h-2 rounded bg-[#c69a80]"
                          style={{ width: `${(m.expenses / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-[11px] tabular-nums sm:w-28 sm:text-xs">
                        {money(m.expenses)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={card}>
            <h2 className="mb-4 text-lg font-medium tracking-tight">Spending by category</h2>
            {report.categories.length ? (
              report.categories.map((c) => (
                <div
                  key={c.category}
                  className="flex justify-between gap-3 border-b border-border py-3 text-sm"
                >
                  <span>{c.category}</span>
                  <strong>{money(c.amount)}</strong>
                </div>
              ))
            ) : (
              <p className="py-8 text-sm text-muted-foreground">
                No expenses recorded for this year.
              </p>
            )}
            <Link
              href="/transactions"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              Review transactions <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
      {tab === "Tax & filing" && (
        <div className="space-y-5">
          <div className={card}>
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="text-lg font-medium tracking-tight">Salary tax estimate</h2>
              <Link
                className="text-sm text-primary"
                href={`/taxation/compliance-filing?year=${report.year}`}
              >
                Edit filing details →
              </Link>
            </div>
            {report.tax.available ? (
              <>
                <div className="my-5"><RegimeCards tax={report.tax} /></div>
                <p className="text-sm font-medium">
                  {report.tax.recommended === "equal"
                    ? "Both estimates are equal."
                    : `Lower salary-only estimate: ${report.tax.recommended} regime.`}
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
                  {report.tax.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{report.tax.reason}</p>
            )}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className={card}>
              <h2 className="mb-4 font-semibold">Filing & tax declarations</h2>
              <dl className="space-y-3 text-sm">
                {[
                  ["Filing status", report.filing.status],
                  ["Selected regime", report.filing.regime],
                  ["Date filed", report.filing.filedDate || "Not supplied"],
                  [
                    "Annual TDS",
                    report.filing.annualTds === null
                      ? "Not supplied"
                      : money(report.filing.annualTds),
                  ],
                  [
                    "Advance tax",
                    report.filing.advanceTax === null
                      ? "Not supplied"
                      : money(report.filing.advanceTax),
                  ],
                  ["HRA exemption estimate", money(report.hra.exemption)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-xs text-muted-foreground">
                Self-reported amounts and status. Verify tax credits against
                Form 26AS/AIS. No refund is inferred from monthly payroll TDS.
              </p>
            </div>
            <div className={card}>
              <h2 className="mb-4 font-semibold">Readiness by section</h2>
              {report.checklist.map((c) => (
                <Link
                  key={c.section}
                  className="flex justify-between gap-3 py-3 text-sm"
                  href={`/taxation/${c.section}?year=${report.year}`}
                >
                  <span className="capitalize">
                    {c.section.replaceAll("-", " ")}
                  </span>
                  <span>
                    {c.completed}/{c.total}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === "Documents" && (
        <div className={card}>
          <h2 className="text-lg font-medium tracking-tight">
            Private documents for FY {report.year}
          </h2>
          <p className="my-3 text-xs text-muted-foreground">
            The full package includes these original files, the PDF summary,
            transactions CSV and saved year details.
          </p>
          {report.documents.length ? (
            report.documents.map((d) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4"
                key={d.id}
              >
                <div>
                  <p className="break-all text-sm font-medium">{d.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.section.replaceAll("-", " ")} ·{" "}
                    {(d.size_bytes / 1024).toFixed(1)} KB
                  </p>
                </div>
                <DownloadButton
                  url={`/api/tax-documents/${d.id}`}
                  filename={d.name}
                >
                  Download
                </DownloadButton>
              </div>
            ))
          ) : (
            <p className="py-8 text-sm text-muted-foreground">
              No documents uploaded for this year.
            </p>
          )}
          <Link
            href={`/taxation/compliance-filing?year=${report.year}`}
            className="mt-5 inline-block text-sm text-primary"
          >
            Manage proofs and filing →
          </Link>
        </div>
      )}
    </section>
  );
}
