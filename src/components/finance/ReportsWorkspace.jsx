"use client";
import { useState } from "react";
import Link from "next/link";
import FinancialYearSelect from "./FinancialYearSelect";
import DownloadButton from "./DownloadButton";
const money = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const card = "rounded-2xl border border-slate-200 bg-white p-5 md:p-6";
export default function ReportsWorkspace({ report }) {
  const [tab, setTab] = useState("Cashflow");
  const tabs = ["Cashflow", "Tax & filing", "Documents"];
  const max = Math.max(
    1,
    ...report.months.map((m) => Math.max(m.income, m.expenses)),
  );
  return (
    <section className="mx-auto max-w-7xl space-y-6 p-4 md:p-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
            Your saved financial records
          </p>
          <h1 className="mt-2 text-3xl font-bold">Reports</h1>
          <p className="mt-2 text-sm text-slate-500">
            FY {report.year} · April–March · Updated {report.asOf}
          </p>
        </div>
        <FinancialYearSelect year={report.year} />
      </header>
      <div className="flex flex-wrap gap-3">
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
          ["Recorded income", money(report.income)],
          ["Recorded expenses", money(report.expenses)],
          ["Net cashflow", money(report.income - report.expenses)],
          ["Transactions", report.transactions.length],
        ].map(([label, value]) => (
          <div className={card} key={label}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Totals use transactions saved for this financial year. Missing
        transactions are not estimated. Review transfers and refunds in
        Transactions to keep cashflow categories accurate.
      </p>
      <nav
        aria-label="Report sections"
        className="flex gap-2 border-b border-slate-200"
      >
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`px-4 py-3 text-sm font-semibold ${tab === t ? "border-b-2 border-violet-600 text-violet-600" : "text-slate-500"}`}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === "Cashflow" && (
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div className={card}>
            <h2 className="text-lg font-semibold">Monthly cashflow</h2>
            <p className="mb-6 mt-1 text-xs text-slate-500">
              Income in green · expenses in violet
            </p>
            <div className="space-y-5">
              {report.months.map((m) => (
                <div
                  key={m.month}
                  className="grid grid-cols-[82px_1fr] items-center gap-3"
                >
                  <p className="text-xs text-slate-500">{m.label}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 min-w-0 flex-1 rounded bg-slate-50">
                        <div
                          className="h-2 rounded bg-emerald-400"
                          style={{ width: `${(m.income / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-28 text-right text-xs">
                        {money(m.income)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 min-w-0 flex-1 rounded bg-slate-50">
                        <div
                          className="h-2 rounded bg-violet-400"
                          style={{ width: `${(m.expenses / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-28 text-right text-xs">
                        {money(m.expenses)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={card}>
            <h2 className="mb-4 text-lg font-semibold">Spending by category</h2>
            {report.categories.length ? (
              report.categories.map((c) => (
                <div
                  key={c.category}
                  className="flex justify-between gap-3 border-b border-slate-100 py-3 text-sm"
                >
                  <span>{c.category}</span>
                  <strong>{money(c.amount)}</strong>
                </div>
              ))
            ) : (
              <p className="py-8 text-sm text-slate-500">
                No expenses recorded for this year.
              </p>
            )}
            <Link
              href="/transactions"
              className="mt-6 inline-block text-sm text-violet-600"
            >
              Review transactions →
            </Link>
          </div>
        </div>
      )}
      {tab === "Tax & filing" && (
        <div className="space-y-5">
          <div className={card}>
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="text-lg font-semibold">Salary tax estimate</h2>
              <Link
                className="text-sm text-violet-600"
                href={`/taxation/compliance-filing?year=${report.year}`}
              >
                Edit filing details →
              </Link>
            </div>
            {report.tax.available ? (
              <>
                <div className="my-5 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs">Old regime</p>
                    <p className="mt-1 text-2xl font-bold">
                      {money(report.tax.old.tax)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-4">
                    <p className="text-xs">New regime</p>
                    <p className="mt-1 text-2xl font-bold">
                      {money(report.tax.new.tax)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">
                  {report.tax.recommended === "equal"
                    ? "Both estimates are equal."
                    : `Lower salary-only estimate: ${report.tax.recommended} regime.`}
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-500">
                  {report.tax.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">{report.tax.reason}</p>
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
                    <dt className="text-slate-500">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-xs text-slate-500">
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
          <h2 className="text-lg font-semibold">
            Private documents for FY {report.year}
          </h2>
          <p className="my-3 text-xs text-slate-500">
            The full package includes these original files, the PDF summary,
            transactions CSV and saved year details.
          </p>
          {report.documents.length ? (
            report.documents.map((d) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-4"
                key={d.id}
              >
                <div>
                  <p className="break-all text-sm font-medium">{d.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
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
            <p className="py-8 text-sm text-slate-500">
              No documents uploaded for this year.
            </p>
          )}
          <Link
            href={`/taxation/compliance-filing?year=${report.year}`}
            className="mt-5 inline-block text-sm text-violet-600"
          >
            Manage proofs and filing →
          </Link>
        </div>
      )}
    </section>
  );
}
