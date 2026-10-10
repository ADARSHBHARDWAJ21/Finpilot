"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Wallet, Rows3, FileText, ArrowRight } from "lucide-react";
import FinancialYearSelect from "./FinancialYearSelect";
import DownloadButton from "./DownloadButton";
const money = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const card = "fp-card p-5 sm:p-6";
export default function ReportsWorkspace({ report }) {
  const [tab, setTab] = useState("Cashflow");
  const tabs = ["Cashflow", "Tax & filing", "Documents"];
  const max = Math.max(
    1,
    ...report.months.map((m) => Math.max(m.income, m.expenses)),
  );
  return (
    <section className="mx-auto w-full max-w-7xl space-y-7 py-2">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="fp-eyebrow">
            A wider perspective
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Reports</h1>
          <p className="mt-3 text-sm text-muted-foreground">See the story behind your money, one financial year at a time.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            FY {report.year} · April–March · Updated {report.asOf}
          </p>
        </div>
        <FinancialYearSelect year={report.year} />
      </header>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3">
        <span className="mr-auto flex items-center gap-2 px-2 py-2 text-sm font-medium"><FileText size={17} className="text-primary" />Export your year</span>
        {[
          ["pdf", "Financial report PDF"],
          ["csv", "Transactions CSV"],
          ["zip", "Full filing package"],
        ].map(([format, label]) => (
          <DownloadButton
            key={format}
            url={`/api/finance-export?year=${report.year}&format=${format}`}
            filename={`Finpilot-${report.year}.${format}`}
          >
            {label}
          </DownloadButton>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      </div>
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
      {tab === "Cashflow" && (
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
                <div className="my-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted p-4">
                    <p className="text-xs">Old regime</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {money(report.tax.old.tax)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-4">
                    <p className="text-xs">New regime</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {money(report.tax.new.tax)}
                    </p>
                  </div>
                </div>
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
