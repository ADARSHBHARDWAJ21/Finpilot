"use client";

import { useEffect, useRef, useState } from "react";
import { X, Pencil, Check, AlertTriangle } from "lucide-react";
import { validateImportRow, parseTransactionDate } from "@/lib/import/transaction-values";
import { applyCategoryRules } from "@/lib/bank-parsers/category-rules";
import { TRANSACTION_CATEGORY_KEYS, getCategoryMeta } from "@/lib/budget/category-meta";

const PAGE_SIZE = 25;
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none";
const money = (value) => Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dateLabel = (value) => parseTransactionDate(value) ? new Date(`${parseTransactionDate(value)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not read";

export default function ReviewImportModal({ transactions = [], fileName, warnings = [], onClose, onConfirm }) {
  const [rows, setRows] = useState(() => transactions.map((row) => {
    const suggested = { ...row, category: applyCategoryRules(row.description, row.category, row.type) };
    return { ...suggested, selected: !validateImportRow(suggested).issues.length };
  }));
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const busy = useRef(false);
  const originalRow = useRef(null);
  const selected = rows.filter((row) => row.selected);
  const unreadable = rows.filter((row) => validateImportRow(row).issues.length > 0);
  const invalidSelected = selected.filter((row) => validateImportRow(row).issues.length > 0);
  const lastPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, lastPage);
  const visible = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const totals = selected.reduce((sum, row) => { if (!validateImportRow(row).issues.length) sum[row.type] += Number(row.amount); return sum; }, { income: 0, expense: 0 });
  const close = () => { if (!busy.current) onClose(); };

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus?.(); };
  }, []);

  function update(index, field, value) {
    setRows((previous) => previous.map((row, i) => i === index ? { ...row, [field]: value } : row));
    setError("");
  }
  function finishEdit(index) {
    const result = validateImportRow(rows[index]);
    if (result.issues.length) { setError("This row still has unreadable details. Check it against your statement or leave it excluded."); return; }
    setRows((previous) => previous.map((row, i) => i === index ? { ...result.row, selected: true } : row));
    setError("");
    setEditing(null);
  }
  function startEdit(index) { originalRow.current = { ...rows[index] }; setEditing(index); setError(""); }
  function cancelEdit() {
    setRows((previous) => previous.map((row, index) => index === editing ? originalRow.current : row));
    setEditing(null);
    setError("");
  }
  async function confirm() {
    if (busy.current || !selected.length || invalidSelected.length || editing !== null) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try { await onConfirm(selected.map((row) => validateImportRow(row).row)); onClose(); }
    catch (failure) { setError(failure.message || "Could not save this import. Please try again."); }
    finally { busy.current = false; setSaving(false); }
  }
  function keyboard(event) {
    if (event.key === "Escape") { event.stopPropagation(); close(); }
    if (event.key !== "Tab") return;
    const controls = [...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10211c]/45 backdrop-blur-sm p-3 sm:p-6">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="import-title" tabIndex={-1} onKeyDown={keyboard} className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-xl outline-none">
        <div className="flex items-start justify-between border-b border-gray-100 p-5">
          <div>
            <h2 id="import-title" className="text-lg font-semibold text-gray-900">Review extracted transactions</h2>
            <p className="mt-1 break-all text-xs text-gray-500">{fileName} · {rows.length} transactions found</p>
            <p className="mt-2 text-sm text-gray-600">Your statement details were filled automatically. Check they are correct, then click Import.</p>
            <p className="mt-1 text-xs text-gray-500">Categories are suggested from transaction details. Use the dropdowns to change them before importing. Unrecognized transactions stay in Other.</p>
          </div>
          <button type="button" disabled={saving} aria-label="Close import review" onClick={close} className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">
          <div className="mb-5 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-background p-4 min-[420px]:grid-cols-3">
            <div><p className="text-xs text-gray-500">Ready to import</p><p className="mt-1 text-lg font-semibold text-gray-900">{selected.length}</p></div>
            <div><p className="text-xs text-gray-500">Money in</p><p className="mt-1 text-lg font-semibold text-primary">₹{money(totals.income)}</p></div>
            <div><p className="text-xs text-gray-500">Money out</p><p className="mt-1 text-lg font-semibold text-destructive">₹{money(totals.expense)}</p></div>
          </div>
          {warnings.map((warning, index) => <p key={index} className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{warning}</p>)}
          {unreadable.length > 0 && <p role="status" className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><AlertTriangle size={15} className="shrink-0" />{unreadable.length} transaction(s) could not be read completely and are excluded. You can check them using Edit, or upload a clearer statement.</p>}
          <label className="mb-3 flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" disabled={saving || editing !== null || !rows.length} checked={!!selected.length && rows.every((row) => row.selected || validateImportRow(row).issues.length)} onChange={(event) => setRows((previous) => previous.map((row) => ({ ...row, selected: event.target.checked && !validateImportRow(row).issues.length })))} />Include all readable transactions</label>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-gray-50 text-xs text-gray-500"><tr>{["Include", "Date", "Description", "Amount", "Type", "Category", "Payment", ""].map((title, i) => <th key={title || i} className="px-3 py-3 font-medium">{title}</th>)}</tr></thead>
              <tbody>
                {visible.map((row, localIndex) => {
                  const index = currentPage * PAGE_SIZE + localIndex;
                  const issues = validateImportRow(row).issues;
                  const edit = editing === index;
                  return <tr key={index} className={`border-t border-gray-100 text-xs ${issues.length ? "bg-amber-50/40" : ""}`}>
                    <td className="px-3 py-4"><input aria-label={`Include transaction ${index + 1}`} type="checkbox" checked={row.selected} disabled={saving || editing !== null || !!issues.length} onChange={(event) => update(index, "selected", event.target.checked)} /></td>
                    <td className="whitespace-nowrap px-3 py-4 text-gray-600">{edit ? <input aria-label={`Date row ${index + 1}`} type="date" disabled={saving} value={parseTransactionDate(row.transaction_date)} onChange={(event) => update(index, "transaction_date", event.target.value)} className={inputClass} /> : dateLabel(row.transaction_date)}</td>
                    <td className="min-w-52 px-3 py-4 font-medium text-gray-900">{edit ? <input aria-label={`Description row ${index + 1}`} disabled={saving} maxLength={500} value={row.description || ""} onChange={(event) => update(index, "description", event.target.value)} className={inputClass} /> : row.description || "Not read"}</td>
                    <td className={`whitespace-nowrap px-3 py-4 font-semibold ${row.type === "income" ? "text-primary" : row.type === "expense" ? "text-destructive" : "text-gray-500"}`}>{edit ? <input aria-label={`Amount row ${index + 1}`} type="number" min="0.01" max="1000000000" step="0.01" disabled={saving} value={row.amount} onChange={(event) => update(index, "amount", event.target.value)} className={inputClass} /> : row.amount !== "" && row.amount != null ? `${row.type === "income" ? "+" : row.type === "expense" ? "−" : ""}₹${money(row.amount)}` : "Not read"}</td>
                    <td className="px-3 py-4">{edit ? <select aria-label={`Type row ${index + 1}`} disabled={saving} value={row.type || ""} onChange={(event) => update(index, "type", event.target.value)} className={inputClass}><option value="">Not read</option><option value="expense">Expense</option><option value="income">Income</option></select> : <span className={`rounded-full px-2 py-1 ${row.type === "income" ? "bg-emerald-50 text-emerald-700" : row.type === "expense" ? "bg-red-50 text-red-600" : "bg-amber-100 text-amber-800"}`}>{row.type === "income" ? "Income" : row.type === "expense" ? "Expense" : "Not read"}</span>}</td>
                    <td className="min-w-40 px-3 py-4 text-gray-600">
                      <select aria-label={`Category row ${index + 1}`} disabled={saving || (editing !== null && !edit)} value={row.category || "Other"} onChange={(event) => update(index, "category", event.target.value)} className={inputClass}>
                        {!TRANSACTION_CATEGORY_KEYS.includes(row.category || "Other") && <option value={row.category}>{row.category}</option>}
                        {TRANSACTION_CATEGORY_KEYS.map((category) => <option key={category} value={category}>{category === "Other" ? "Other" : getCategoryMeta(category).label}</option>)}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-gray-600">{edit ? <input aria-label={`Payment row ${index + 1}`} disabled={saving} maxLength={80} value={row.payment_method || "Bank"} onChange={(event) => update(index, "payment_method", event.target.value)} className={inputClass} /> : row.payment_method || "Bank"}</td>
                    <td className="px-3 py-4"><button type="button" disabled={saving || (editing !== null && !edit)} aria-label={edit ? `Done editing transaction ${index + 1}` : `Edit transaction ${index + 1}`} onClick={() => edit ? finishEdit(index) : startEdit(index)} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 disabled:opacity-40">{edit ? <><Check size={13} />Done</> : <><Pencil size={13} />Edit</>}</button>{edit && <button type="button" disabled={saving} onClick={cancelEdit} className="mt-2 text-xs text-gray-500">Cancel edit</button>}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          {rows.length > PAGE_SIZE && <div className="mt-3 flex items-center justify-between text-xs text-gray-500"><span>Page {currentPage + 1} of {lastPage + 1}</span><div className="flex gap-2"><button type="button" disabled={saving || editing !== null || !currentPage} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={saving || editing !== null || currentPage >= lastPage} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></div></div>}
        </div>
        <div className="border-t border-gray-100 p-4 sm:p-5">
          {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><p className="text-xs text-gray-500">{selected.length} transactions will be imported. Existing matches are skipped.</p><div className="flex gap-2"><button type="button" disabled={saving} onClick={close} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 disabled:opacity-50">Cancel</button><button type="button" disabled={saving || !selected.length || !!invalidSelected.length || editing !== null} onClick={confirm} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? "Importing…" : "Import"}</button></div></div>
        </div>
      </div>
    </div>
  );
}
