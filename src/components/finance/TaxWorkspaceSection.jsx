"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, Trash2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { TAX_CATEGORIES } from "@/lib/taxation/categories";
import { defaultDetails, calculateHra, displayDate } from "@/lib/finance/model";
import {
  saveTaxDetails,
  saveTaxChecklist,
  syncFilingReminder,
} from "@/app/finance/actions";
import FinancialYearSelect from "./FinancialYearSelect";
import DownloadButton from "./DownloadButton";

const card = "fp-card p-5 sm:p-6";
const input =
  "mt-1 w-full fp-input";
const button =
  "fp-button";
const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
export default function TaxWorkspaceSection({
  slug,
  year,
  base,
  workspace,
  report,
}) {
  const router = useRouter();
  const category = TAX_CATEGORIES.find((c) => c.slug === slug);
  const [record, setRecord] = useState(workspace.sections[slug] || null);
  const [details, setDetails] = useState({
    ...defaultDetails(slug, base.profile, base.salary, year),
    ...record?.details,
  });
  const [checklist, setChecklist] = useState(record?.checklist || {});
  const [documents, setDocuments] = useState(
    workspace.documents.filter((d) => d.section === slug),
  );
  const [proofKey, setProofKey] = useState(category.checklist[0].id);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false),
    [deleting, setDeleting] = useState(null);
  const hra = slug === "rent-hra" ? calculateHra(details, year) : null;
  const done = category.checklist.filter((c) => checklist[c.id]).length;
  const Icon = category.icon;
  const update = (key, value) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setDirty(true);
    setMessage("");
  };
  async function perform(action, onSuccess) {
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      if (result.error) throw new Error(result.error);
      onSuccess?.(result);
      router.refresh();
    } catch (e) {
      setMessage(e.message || "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function field(key, label, type = "number", extra = {}) {
    return (
      <label key={key} className="block text-sm text-muted-foreground">
        {label}
        <input
          className={input}
          type={type}
          min={type === "number" ? 0 : undefined}
          max={type === "number" ? 100000000 : undefined}
          step={type === "number" ? "0.01" : undefined}
          value={details[key] ?? ""}
          onChange={(e) => update(key, e.target.value)}
          {...extra}
        />
      </label>
    );
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await perform(
      async () => {
        const data = new FormData();
        data.append("file", file);
        data.append("year", year);
        data.append("section", slug);
        data.append("proofKey", proofKey);
        const response = await fetch("/api/tax-documents", {
          method: "POST",
          body: data,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed.");
        return result;
      },
      (result) => {
        setDocuments((d) => [...d, result.document]);
        setMessage(
          "Document uploaded privately. Review it before checking the related item.",
        );
      },
    );
  }
  const save = (e) => {
    e.preventDefault();
    perform(
      () => saveTaxDetails(year, slug, details, record?.updated_at || null),
      (result) => {
        setRecord(result.section);
        setDetails(result.section.details);
        setDirty(false);
        setMessage("Details saved for FY " + year + ".");
      },
    );
  };
  const tax = report.tax;
  return (
    <section className="mx-auto w-full max-w-7xl space-y-7 py-2">
      <Link
        href={`/taxation?year=${year}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        Tax workspace
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 max-w-2xl gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary"
          >
            <Icon size={23} strokeWidth={1.7} />
          </div>
          <div>
            <p className="fp-eyebrow mb-2">Your tax workspace</p>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">{category.title}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {category.subtitle}
            </p>
            <p className="mt-3 text-xs font-medium text-primary">
              {done}/{category.checklist.length} reviewed · FY {year}
              {dirty ? " · Unsaved changes" : ""}
            </p>
          </div>
        </div>
        <FinancialYearSelect year={year} />
      </header>
      {message && (
        <p
          role="status"
          className="rounded-xl bg-primary/5 p-4 text-sm text-primary"
        >
          {message}
        </p>
      )}
      {message.toLowerCase().includes("refresh") && (
        <button className={button} disabled={busy} onClick={() => window.location.reload()}>
          Reload saved data
        </button>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-5">
          {slug === "rent-hra" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Rent / month", money(details.rentMonthly)],
                  ["Rental period", `${details.months} months`],
                  [
                    "Old-regime HRA estimate",
                    hra.available ? money(hra.exemption) : "Check details",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className={card}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-2 text-lg font-medium tracking-tight">{value}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={save} className={`${card} space-y-5`}>
                <h2 className="text-lg font-medium tracking-tight">Rent & HRA calculator</h2>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={details.payingRent}
                    onChange={(e) => update("payingRent", e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  I paid rent during this financial year
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("basicMonthly", "Basic salary / month (₹)")}
                  {field("daMonthly", "Qualifying DA / month (₹)")}
                  {field(
                    "commissionMonthly",
                    "Turnover-based commission / month (₹)",
                  )}
                  {field("hraMonthly", "HRA received / month (₹)")}
                  {field("rentMonthly", "Rent paid / month (₹)")}
                  {field("months", "Months at these amounts", "number", {
                    min: 1,
                    max: 12,
                    step: 1,
                    required: true,
                  })}
                  <label className="text-sm text-muted-foreground">
                    Rental city
                    <select
                      value={details.city}
                      onChange={(e) => update("city", e.target.value)}
                      className={input}
                    >
                      {[
                        "Delhi",
                        "Mumbai",
                        "Kolkata",
                        "Chennai",
                        "Bengaluru",
                        "Hyderabad",
                        "Pune",
                        "Ahmedabad",
                        "Other",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {hra.available && (
                  <div className="space-y-1 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    <p>The exemption is the lowest of:</p>
                    <p>HRA received: {money(hra.annualHra)}</p>
                    <p>
                      Rent less 10% of eligible salary:{" "}
                      {money(hra.rentLessSalary)}
                    </p>
                    <p>
                      {hra.rate * 100}% of eligible salary:{" "}
                      {money(hra.salaryLimit)}
                    </p>
                  </div>
                )}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Old-regime estimate for one period with unchanged amounts. The
                  new regime does not allow this HRA exemption. If amounts or
                  city changed, calculate each period separately before filing.
                  Include DA only where it qualifies and commission only when
                  fixed as a percentage of turnover.{" "}
                  <a
                    className="text-primary underline"
                    href={
                      Number(year.slice(0, 4)) >= 2026
                        ? "https://www.incometax.gov.in/iec/foportal/sites/default/files/2026-03/En-Notified-IT-Rules-2026-20-03-2026.pdf"
                        : "https://www.incometaxindia.gov.in/en/income-from-salary"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official HRA rules
                  </a>
                </p>
                <button
                  disabled={busy}
                  className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save rent details"}
                </button>
              </form>
            </>
          )}
          {slug === "banking-investments" && (
            <form onSubmit={save} className={`${card} space-y-5`}>
              <h2 className="text-lg font-medium tracking-tight">
                Banking & investment details
              </h2>
              <p className="text-sm text-muted-foreground">
                Record amounts for FY {year}. These declarations are separate
                from your transaction ledger.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("monthlySip", "Monthly SIP (₹)")}
                {field("monthlyEmi", "Monthly EMI obligations (₹)")}
                {field("monthlySideIncome", "Monthly side income (₹)")}
                {field("annualInterest", "Annual FD / savings interest (₹)")}
                {field("capitalGains", "Annual capital gains / losses (₹)", "number", { min: -100000000 })}
              </div>
              <label className="block text-sm text-muted-foreground">
                Notes
                <textarea
                  className={input}
                  maxLength={2000}
                  rows={3}
                  value={details.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Capital gains and other income need their own tax treatment.
                Uploading a proof here stores the original file. To extract
                transactions, use{" "}
                <Link
                  className="text-primary underline"
                  href="/transactions"
                >
                  statement import in Transactions
                </Link>
                .
              </p>
              <button
                disabled={busy}
                className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save banking details"}
              </button>
            </form>
          )}
          {slug === "compliance-filing" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [
                    "Old-regime salary estimate",
                    tax.available ? money(tax.old.tax) : "Not available",
                  ],
                  [
                    "New-regime salary estimate",
                    tax.available ? money(tax.new.tax) : "Not available",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className={card}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-2 text-xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {tax.available
                  ? "Estimates use saved details. See assumptions and exclusions in Reports."
                  : tax.reason}
              </p>
              <form onSubmit={save} className={`${card} space-y-5`}>
                <h2 className="text-lg font-medium tracking-tight">Your filing record</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-muted-foreground">
                    Selected regime
                    <select
                      className={input}
                      value={details.regime}
                      onChange={(e) => update("regime", e.target.value)}
                    >
                      <option value="undecided">Not selected</option>
                      <option value="old">Old regime</option>
                      <option value="new">New regime</option>
                    </select>
                  </label>
                  <label className="text-sm text-muted-foreground">
                    Filing status
                    <select
                      className={input}
                      value={details.status}
                      onChange={(e) => update("status", e.target.value)}
                    >
                      <option value="not-started">Not started</option>
                      <option value="draft">Draft prepared</option>
                      <option value="filed">Filed on the tax portal</option>
                    </select>
                  </label>
                  <Link className="text-sm text-primary underline" href={`/taxation/salary-documents?year=${year}`}>Edit annual salary for this year</Link>
                  {field("annualTds", "Annual TDS per records (₹, optional)")}
                  {field("advanceTax", "Advance tax paid (₹, optional)")}
                  {field("filingDueDate", "Your filing deadline", "date")}
                  {field("filedDate", "Date filed", "date", {
                    required: details.status === "filed",
                  })}
                  {field(
                    "acknowledgement",
                    "Acknowledgement / reference (optional)",
                    "text",
                    { maxLength: 40 },
                  )}
                </div>
                <label className="block text-sm text-muted-foreground">
                  Filing notes
                  <textarea
                    className={input}
                    rows={3}
                    maxLength={2000}
                    value={details.notes}
                    onChange={(e) => update("notes", e.target.value)}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  Enter annual amounts from your records; leaving an amount
                  blank means unknown. Status is self-reported. Finpilot does
                  not submit or e-verify your return. Confirm your applicable
                  deadline on the{" "}
                  <a
                    href="https://www.incometax.gov.in/iec/foportal/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Income Tax portal
                  </a>
                  .
                </p>
                <button
                  disabled={busy}
                  className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save filing details"}
                </button>
              </form>
              <div className={card}>
                <h2 className="mb-4 text-lg font-medium tracking-tight">Filing timeline</h2>
                <p className="text-sm">
                  Your deadline: {displayDate(details.filingDueDate)}
                </p>
                <p className="my-3 text-sm">
                  Date filed: {displayDate(details.filedDate)}
                </p>
                <button
                  disabled={busy || !details.filingDueDate || dirty}
                  className={button}
                  onClick={() =>
                    perform(
                      () =>
                        syncFilingReminder(year),
                      () =>
                        setMessage(
                          "Filing reminder added to Reminders and Calendar.",
                        ),
                    )
                  }
                >
                  Add deadline to calendar
                </button>
                {dirty && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Save filing details first.
                  </p>
                )}
              </div>
            </>
          )}
          {slug === "salary-documents" && (
            <form onSubmit={save} className={card + " space-y-5"}>
              <h2 className="text-lg font-medium tracking-tight">Annual salary for FY {year}</h2>
              <p className="text-sm text-muted-foreground">Use gross salary from your salary records, including taxable allowances, bonus and perquisites. All amounts here are annual. Saving confirms these figures for this year; they replace older profile estimates.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("annualSalary", "Annual gross salary (₹)", "number", { required: true })}
                {field("annualBasic", "Annual basic salary (₹)")}
                {field("annualDa", "Annual qualifying DA for NPS (₹)")}
                {field("annualHra", "Annual HRA received (₹)")}
                {field("employerNps", "Annual employer NPS contribution (₹)")}
                {field("age", "Age at the end of this financial year", "number", { min: 0, max: 120, step: 1 })}
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={details.governmentEmployer} onChange={(e) => update("governmentEmployer", e.target.checked)} />Central or State Government employer</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={details.resident} onChange={(e) => update("resident", e.target.checked)} />Indian resident for tax purposes for this year</label>
              <p className="text-xs text-muted-foreground">Employer NPS should already be included in gross salary where taxable; it is not added a second time. NPS limits use basic salary plus qualifying DA. Set actual rental periods in Rent & HRA.</p>
              <button disabled={busy} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save salary details"}</button>
            </form>
          )}
          {slug === "tax-saving-proofs" && (
            <form onSubmit={save} className={card + " space-y-5"}>
              <h2 className="text-lg font-medium tracking-tight">Annual deductions for FY {year}</h2>
              <p className="text-sm text-muted-foreground">Enter eligible annual totals once. Saving replaces old profile deduction estimates for this year, resolving duplicate or conflicting declarations.</p>
              {!!report.dataWarnings?.length && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Review conflicting declarations</p><ul className="mt-2 list-disc space-y-2 pl-4">{report.dataWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
              <div className="grid gap-4 sm:grid-cols-2">
                {field("section80c", "80C / 80CCC eligible total (₹)")}
                {field("healthInsurance", "80D self / family eligible amount (₹)")}
                {field("parentsHealthInsurance", "80D parents eligible amount (₹)")}
                {field("personalNps", "Annual personal NPS contribution (₹)")}
                {field("confirmedHomeLoanInterest", "Eligible self-occupied home loan interest (₹)")}
                {field("educationLoanInterest", "Eligible education loan interest (₹)")}
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={details.selfFamilySenior} onChange={(e) => update("selfFamilySenior", e.target.checked)} />A covered self / family member is an Indian resident aged 60 or older</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={details.parentsSenior} onChange={(e) => update("parentsSenior", e.target.checked)} />A covered parent is an Indian resident aged 60 or older</label>
              <p className="text-xs leading-relaxed text-muted-foreground">80C / 80CCC shares a ₹1.5 lakh pool with eligible employee NPS. The calculator assigns separate personal NPS rupees to the extra ₹50,000 deduction. Enter home-loan interest only when eligible for the ₹2 lakh self-occupied limit; exclude ineligible loans and amounts. Education-loan interest requires a qualifying lender, purpose and claim period. These deductions apply to the old regime.</p>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" required checked={details.eligibilityConfirmed} onChange={(e) => update("eligibilityConfirmed", e.target.checked)} />I have checked the eligible annual amounts against my records and have not counted any payment twice.</label>
              <button disabled={busy} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save deductions"}</button>
            </form>
          )}
          <div className={card}>
            <h2 className="text-lg font-medium tracking-tight">Review checklist</h2>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              Mark each item after you have checked it. Progress is saved
              separately for each year.
            </p>
            <div className="space-y-2">
              {category.checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${checklist[item.id] ? "border-primary/15 bg-primary/5" : "border-border bg-muted/60"}`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={!!checklist[item.id]}
                    disabled={busy}
                    onChange={(e) => {
                      const next = {
                        ...checklist,
                        [item.id]: e.target.checked,
                      };
                      perform(
                        () =>
                          saveTaxChecklist(
                            year,
                            slug,
                            next,
                            record?.updated_at || null,
                          ),
                        (result) => {
                          setRecord(result.section);
                          setChecklist(result.section.checklist);
                          setMessage("Checklist saved.");
                        },
                      );
                    }}
                  />
                  <span>
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.hint}
                      {documents.some((d) => d.proof_key === item.id)
                        ? " · Document attached"
                        : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className={card}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              <h2 className="text-lg font-medium tracking-tight">Private proof documents</h2>
            </div>
            <p className="mb-5 mt-2 text-xs text-muted-foreground">
              PDF, PNG, JPG, WebP, CSV or XLSX · up to 10 MB per file · FY{" "}
              {year}
            </p>
            <div className="flex flex-wrap items-end gap-4 rounded-xl border border-dashed border-primary/20 bg-primary/[0.025] p-4">
              <label className="min-w-0 basis-full text-sm text-muted-foreground sm:flex-1 sm:basis-auto">
                Document category
                <select
                  className={input}
                  value={proofKey}
                  onChange={(e) => setProofKey(e.target.value)}
                >
                  {category.checklist.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${button} cursor-pointer`}>
                <Upload size={16} className="mr-2 inline" />
                {busy ? "Working…" : "Upload proof"}
                <input
                  type="file"
                  aria-label="Upload proof"
                  className="sr-only"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx"
                  disabled={busy}
                  onChange={upload}
                />
              </label>
            </div>
            <div className="mt-5 divide-y divide-border">
              {documents.length ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center gap-3 py-4"
                  >
                    <FileText size={20} className="shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">
                        {doc.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          category.checklist.find((c) => c.id === doc.proof_key)
                            ?.label
                        }{" "}
                        · {(doc.size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <DownloadButton
                      url={`/api/tax-documents/${doc.id}`}
                      filename={doc.name}
                    >
                      Download
                    </DownloadButton>
                    <button
                      className={button}
                      aria-label={`Remove ${doc.name}`}
                      disabled={busy}
                      onClick={() => setDeleting(doc)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="py-5 text-sm text-muted-foreground/70">
                  No documents uploaded for this section and year.
                </p>
              )}
            </div>
          </div>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className={card}>
            <h2 className="mb-4 font-semibold">Other tax sections</h2>
            <nav className="space-y-1">
              {TAX_CATEGORIES.filter((c) => c.slug !== slug).map((c) => (
                <Link
                  key={c.slug}
                  href={`/taxation/${c.slug}?year=${year}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  {c.title}<ArrowUpRight size={14} className="shrink-0" />
                </Link>
              ))}
            </nav>
          </div>
          <div className={`${card} space-y-4`}>
            <h2 className="font-semibold">Actions</h2>
            <Link
              href={`/reports?year=${year}`}
              className="block text-sm text-primary"
            >
              View yearly reports
            </Link>
            <Link href="/calendar" className="block text-sm text-primary">
              Open calendar
            </Link>
            <Link
              href={`/taxation/ai-copilot?year=${year}`}
              className="block text-sm text-primary"
            >
              Ask AI Copilot
            </Link>
            <DownloadButton
              url={`/api/finance-export?year=${year}&format=zip`}
              filename={`Finpilot-${year}.zip`}
            >
              Download package
            </DownloadButton>
          </div>
        </aside>
      </div>
      {deleting && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="remove-proof-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 id="remove-proof-title" className="text-xl font-semibold">
              Remove document?
            </h2>
            <p className="my-4 text-sm">
              “{deleting.name}” will be permanently removed from your private
              documents.
            </p>
            <div className="flex gap-3">
              <button
                className={button}
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white"
                onClick={() =>
                  perform(
                    async () => {
                      const r = await fetch(
                        `/api/tax-documents/${deleting.id}`,
                        { method: "DELETE" },
                      );
                      return r.json();
                    },
                    () => {
                      setDocuments(
                        documents.filter((d) => d.id !== deleting.id),
                      );
                      setDeleting(null);
                      setMessage(
                        "Document removed. Review the checklist if its status has changed.",
                      );
                    },
                  )
                }
              >
                Remove document
              </button>
            </div>
            {message && (
              <p className="mt-3 text-sm" role="alert">
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
