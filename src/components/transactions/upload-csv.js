"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileText, ImageIcon, LoaderCircle } from "lucide-react";
import { saveTransactions } from "@/app/transactions/actions";
import { parseStatementFile, isSpreadsheetFile } from "@/components/transactions/parse-statement-file";
import { validateFile } from "@/lib/import/transaction-values";
import ReviewImportModal from "@/components/transactions/ReviewImportModal";

export default function UploadStatement({ className = "", onImported }) {
  const input = useRef(null);
  const busy = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [review, setReview] = useState(null);
  const [password, setPassword] = useState("");
  const [lockedPdf, setLockedPdf] = useState(null);
  const [dragging, setDragging] = useState(false);

  function choose(accept) {
    if (busy.current || review) return;
    input.current.accept = accept;
    input.current.click();
  }
  async function upload(file, pdfPassword = "") {
    if (!file || busy.current || review) return;
    busy.current = true;
    setUploading(true);
    setStatus(null);
    setLockedPdf(null);
    try {
      validateFile(file);
      let result;
      if (isSpreadsheetFile(file)) {
        result = await parseStatementFile(file);
      } else if (/\.(?:pdf|png|jpe?g|webp)$/i.test(file.name)) {
        const form = new FormData();
        form.append("file", file);
        if (/\.pdf$/i.test(file.name) && pdfPassword) form.append("password", pdfPassword);
        const response = await fetch("/api/process-statement", { method: "POST", body: form, signal: AbortSignal.timeout(175_000) });
        try { result = await response.json(); }
        catch { throw new Error("The upload service did not respond correctly. Refresh the page and try again."); }
        if (!response.ok || !result.success) {
          if (result.code === "PDF_PASSWORD_REQUIRED") { setLockedPdf(file); setPassword(""); }
          throw new Error(result.error || "Could not process the statement.");
        }
      } else throw new Error("Choose a CSV, XLSX, XLS, PDF, PNG, JPG or WebP file.");
      setReview({ transactions: result.transactions, warnings: result.warnings || [], fileName: file.name });
      setPassword("");
    } catch (error) {
      const message = error.name === "TimeoutError" || error.name === "AbortError" ? "Processing took too long. Split the statement into smaller files and try again." : error instanceof TypeError ? "Could not connect to the import service. Check your connection and try again." : error.message;
      setStatus({ type: "error", message: message || "Could not import this statement." });
    } finally {
      busy.current = false;
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  async function save(approved) {
    const result = await saveTransactions(approved);
    const pieces = [];
    if (result.count) pieces.push(`${result.count} transaction${result.count === 1 ? "" : "s"} imported`);
    if (result.skipped) pieces.push(`${result.skipped} existing match${result.skipped === 1 ? "" : "es"} skipped`);
    setStatus({ type: "success", message: pieces.join(". ") + "." });
    if (result.transactions?.length) onImported?.(result.transactions);
  }

  return (
    <div className={className}>
      <div onDragOver={(event) => { event.preventDefault(); if (!busy.current && !review) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length > 1) { setStatus({ type: "error", message: "Upload one statement at a time." }); return; } upload(event.dataTransfer.files[0]); }} className={`rounded-2xl border-2 border-dashed p-5 transition-colors ${dragging ? "border-indigo-500 bg-indigo-100" : "border-indigo-200 bg-indigo-50/40"}`}>
        <input ref={input} aria-label="Bank statement file" type="file" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-500">{uploading ? <LoaderCircle size={22} className="animate-spin" /> : <CloudUpload size={22} />}</div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900">Upload Bank Statement</h3>
            <p className="mt-1.5 text-sm text-gray-600">Upload your bank statement. We fill in the transactions automatically—check them, then click Import.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={uploading || !!review} onClick={() => choose(".csv,.xlsx,.xls")} className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"><FileText size={15} />CSV / Excel</button>
              <button type="button" disabled={uploading || !!review} onClick={() => choose(".pdf")} className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"><FileText size={15} />PDF</button>
              <button type="button" disabled={uploading || !!review} onClick={() => choose(".png,.jpg,.jpeg,.webp")} className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"><ImageIcon size={15} />Photo / Screenshot</button>
              <a href="/templates/transactions.csv" download className="px-2 py-2 text-xs font-medium text-indigo-600 underline underline-offset-2">Download CSV template</a>
            </div>
            <p className="mt-3 text-xs text-gray-400">Up to 10 MB · PDF: up to 20 pages</p>
            {uploading && <p role="status" className="mt-3 text-xs font-medium text-indigo-700">Reading your statement… Photos and scanned PDFs can take a minute or two.</p>}
            {status && <p role={status.type === "error" ? "alert" : "status"} className={`mt-3 rounded-lg px-3 py-2 text-xs ${status.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{status.message}</p>}
            {lockedPdf && <form onSubmit={(event) => { event.preventDefault(); upload(lockedPdf, password); }} className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-xs text-gray-600">This PDF is password protected<input type="password" autoComplete="off" autoFocus required disabled={uploading} maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Bank statement password" className="mt-1 block w-56 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 focus:border-indigo-500 focus:outline-none" /></label>
              <button type="submit" disabled={uploading || !password} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Unlock and read</button>
            </form>}
          </div>
        </div>
      </div>
      {review && <ReviewImportModal {...review} onClose={() => setReview(null)} onConfirm={save} />}
    </div>
  );
}
