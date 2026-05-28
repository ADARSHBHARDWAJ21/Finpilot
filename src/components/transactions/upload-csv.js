"use client";

import { useRef, useState } from "react";
import { saveTransactions } from "@/app/transactions/actions";
import {
  isSpreadsheetFile,
  parseStatementFile,
} from "@/components/transactions/parse-statement-file";
import { detectFileType, SUPPORTED_UPLOAD_LABEL } from "@/lib/file-detection";
import { getSupportedBankLabels } from "@/lib/bank-parsers/detect-bank";
import { REVIEW_THRESHOLD } from "@/lib/ai/extract-transactions";
import ReviewImportModal from "@/components/transactions/ReviewImportModal";
import { FileText, ImageIcon } from "lucide-react";

function formatImportSummary({ count, skipped, bank, reviewCount }) {
  const parts = [];

  if (count > 0) {
    parts.push(
      `${count} transaction${count === 1 ? "" : "s"} imported${bank ? ` (${bank.toUpperCase()})` : ""}`
    );
  }

  if (skipped > 0) {
    parts.push(`${skipped} duplicate${skipped === 1 ? "" : "s"} skipped`);
  }

  if (reviewCount > 0) {
    parts.push(`${reviewCount} flagged for review`);
  }

  if (parts.length === 0) {
    return "No new transactions to import.";
  }

  return parts.join(". ") + ".";
}

export default function UploadStatement({ className = "", onImported }) {
  const spreadsheetInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPayload, setReviewPayload] = useState(null);

  async function finishSave(transactions, meta = {}) {
    const { count, skipped, transactions: saved } = await saveTransactions(transactions);
    const summary = formatImportSummary({
      count,
      skipped,
      bank: meta.bank,
      reviewCount: meta.reviewCount ?? 0,
    });
    setStatus({
      type: count > 0 ? "success" : "info",
      message: meta.warning ? `${summary} ${meta.warning}` : summary,
    });
    if (saved?.length) onImported?.(saved);
    return { count, skipped };
  }

  async function handleSpreadsheetUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSpreadsheetFile(file)) {
      setStatus({
        type: "error",
        message: "Please choose a .csv, .xlsx, or .xls file.",
      });
      if (spreadsheetInputRef.current) spreadsheetInputRef.current.value = "";
      return;
    }

    setStatus(null);
    setUploading(true);

    try {
      const rows = await parseStatementFile(file);
      if (rows.length === 0) {
        throw new Error("No transaction rows found in spreadsheet.");
      }

      const rowsWithConfidence = rows.map((tx) => ({
        ...tx,
        confidence_score: 98,
        review_status: "completed",
      }));

      await finishSave(rowsWithConfidence);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to import file" });
    } finally {
      setUploading(false);
      if (spreadsheetInputRef.current) spreadsheetInputRef.current.value = "";
    }
  }

  async function uploadPDF(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/parse-bank-pdf", { method: "POST", body: formData });
    const data = await res.json();

    if (data.success && data.transactions?.length) {
      return { ...data, source: "text-pdf" };
    }

    return uploadProcessStatement(file);
  }

  async function uploadProcessStatement(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/process-statement", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to process statement");
    }

    return data;
  }

  async function uploadOCRStatement(file) {
    return uploadProcessStatement(file);
  }

  async function handleDocumentUpload(file) {
    setStatus(null);
    setUploading(true);

    try {
      const fileType = detectFileType(file);
      let data;

      if (fileType === "image") {
        data = await uploadOCRStatement(file);
      } else if (fileType === "pdf") {
        data = await uploadPDF(file);
      } else {
        throw new Error("Unsupported file type");
      }

      const needsReview = (data.needsReview || []).length > 0;
      const hasLowConfidence = (data.transactions || []).some(
        (tx) => (tx.confidence_score ?? 100) < REVIEW_THRESHOLD
      );

      if (needsReview || hasLowConfidence) {
        setReviewPayload({
          transactions: data.transactions,
          bank: data.bank,
          extractionMethod: data.extractionMethod,
        });
        setReviewOpen(true);
        setStatus({
          type: "info",
          message: [
            data.warning,
            `${data.reviewCount || data.needsReview?.length || 0} transaction(s) need review before import.`,
          ]
            .filter(Boolean)
            .join(" "),
        });
        return;
      }

      await finishSave(
        (data.transactions || []).map((tx) => ({
          ...tx,
          confidence_score: tx.confidence_score ?? 95,
          review_status: "completed",
        })),
        { bank: data.bank, warning: data.warning }
      );
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Failed to import",
      });
    } finally {
      setUploading(false);
    }
  }

  function handlePdfUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleDocumentUpload(file).finally(() => {
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    });
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleDocumentUpload(file).finally(() => {
      if (imageInputRef.current) imageInputRef.current.value = "";
    });
  }

  const statusClass =
    status?.type === "success"
      ? "text-emerald-600"
      : status?.type === "info"
        ? "text-amber-700"
        : "text-red-600";

  const supportedBanks = getSupportedBankLabels();

  return (
    <div className={className}>
      <input
        ref={spreadsheetInputRef}
        type="file"
        className="hidden"
        onChange={handleSpreadsheetUpload}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handlePdfUpload}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => spreadsheetInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors disabled:opacity-60"
        >
          <FileText size={14} />
          {uploading ? "Importing…" : "CSV / Excel"}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => pdfInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors disabled:opacity-60"
        >
          <FileText size={14} />
          {uploading ? "Processing…" : "PDF"}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors disabled:opacity-60"
        >
          <ImageIcon size={14} />
          {uploading ? "OCR…" : "Photo / Screenshot"}
        </button>
      </div>

      {status && <p className={`mt-2 text-xs ${statusClass}`}>{status.message}</p>}
      <p className="mt-1 text-[10px] text-gray-400">Supported: {SUPPORTED_UPLOAD_LABEL}</p>
      <p className="text-[10px] text-gray-400">
        PDF banks: {supportedBanks}. Gemini-assisted OCR — review low-confidence
        rows.
      </p>

      <ReviewImportModal
        open={reviewOpen}
        transactions={reviewPayload?.transactions ?? []}
        bank={reviewPayload?.bank}
        extractionMethod={reviewPayload?.extractionMethod}
        onClose={() => {
          setReviewOpen(false);
          setReviewPayload(null);
        }}
        onConfirm={async (approved) => {
          await finishSave(approved, {
            bank: reviewPayload?.bank,
            reviewCount: approved.filter(
              (t) => (t.confidence_score ?? 100) < REVIEW_THRESHOLD
            ).length,
          });
          setReviewOpen(false);
          setReviewPayload(null);
        }}
      />
    </div>
  );
}
