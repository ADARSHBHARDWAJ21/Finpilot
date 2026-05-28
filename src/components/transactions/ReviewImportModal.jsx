"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { REVIEW_THRESHOLD } from "@/lib/ai/extract-transactions";

export default function ReviewImportModal({
  open,
  transactions = [],
  bank,
  extractionMethod,
  onClose,
  onConfirm,
}) {
  const [selected, setSelected] = useState(() =>
    transactions.map((_, i) => i)
  );
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function toggle(index) {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  async function handleConfirm() {
    const approved = transactions.filter((_, i) => selected.includes(i));
    if (!approved.length) return;

    setSaving(true);
    try {
      await onConfirm(
        approved.map((tx) => ({
          ...tx,
          review_status: "completed",
          confidence_score: Math.max(tx.confidence_score ?? 0, REVIEW_THRESHOLD),
        }))
      );
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const lowCount = transactions.filter(
    (tx) => (tx.confidence_score ?? 0) < REVIEW_THRESHOLD
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Review import</h2>
            <p className="text-xs text-gray-500 mt-1">
              {lowCount} transaction{lowCount === 1 ? "" : "s"} below {REVIEW_THRESHOLD}%
              confidence — verify before saving
            </p>
            {bank && (
              <p className="text-[10px] text-indigo-600 mt-1">
                {bank.toUpperCase()} · {extractionMethod}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="overflow-y-auto flex-1 p-4 space-y-2">
          {transactions.map((tx, index) => {
            const low = (tx.confidence_score ?? 0) < REVIEW_THRESHOLD;
            const checked = selected.includes(index);

            return (
              <li
                key={`${tx.transaction_date}-${tx.description}-${index}`}
                className={`rounded-xl border p-3 ${
                  low ? "border-amber-200 bg-amber-50/50" : "border-gray-100"
                }`}
              >
                <label className="flex gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {tx.description}
                      </p>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          tx.type === "income" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}₹{tx.amount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.transaction_date} · {tx.category}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {Math.round(tx.confidence_score ?? 0)}% confidence
                      </span>
                      {low && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700">
                          <AlertTriangle size={10} />
                          Needs review
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || selected.length === 0}
            onClick={handleConfirm}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : `Import ${selected.length} selected`}
          </button>
        </div>
      </div>
    </div>
  );
}
