"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Plus,
} from "lucide-react";
import TransactionRow from "@/components/transactions/TransactionRow";
import { mapTransactionToRow } from "@/components/transactions/transaction-utils";

export default function TransactionsSection({ initialTransactions = [] }) {
  const [category, setCategory] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const rows = useMemo(
    () => transactions.map((tx, i) => mapTransactionToRow(tx, i)),
    [transactions]
  );

  const categories = useMemo(() => {
    const set = new Set(rows.map((tx) => tx.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filtered =
    category === "all"
      ? rows
      : rows.filter((tx) => tx.category === category);

  const categoryLabel =
    category === "all" ? "All Categories" : category;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Transactions</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            View, manage and import your transactions
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {categoryLabel}
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {dropdownOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close category menu"
                  onClick={() => setDropdownOpen(false)}
                />
                <ul className="absolute right-0 z-20 mt-1 min-w-[160px] max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                  {categories.map((cat) => (
                    <li key={cat}>
                      <button
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          category === cat ? "text-indigo-600 font-medium" : "text-gray-700"
                        }`}
                        onClick={() => {
                          setCategory(cat);
                          setDropdownOpen(false);
                        }}
                      >
                        {cat === "all" ? "All Categories" : cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-6 mb-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5 opacity-95">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="w-11 h-11 rounded-xl bg-indigo-100/80 flex items-center justify-center shrink-0">
            <CloudUpload size={22} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Upload Bank Statement</h3>
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                Coming Soon 🚀
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Statement import (CSV, Excel, PDF, and photos) is launching soon. For now,
              only manual entry is available.
            </p>
            <p className="text-xs text-indigo-700 mt-2 flex items-center gap-1.5 font-medium">
              <Plus size={14} className="shrink-0" />
              Use the <span className="font-semibold">Add Expense</span> button in the top
              right to add transactions.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-y border-gray-100 bg-gray-50/50">
              {["Date", "Description", "Category", "Payment Method", "Amount", "Status"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  {rows.length === 0
                    ? "No transactions yet. Use Add Expense above to add one manually."
                    : "No transactions match this category."}
                </td>
              </tr>
            ) : (
              filtered.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          {filtered.length === 0
            ? "No transactions to show"
            : `Showing ${filtered.length} of ${rows.length} transaction${
                rows.length === 1 ? "" : "s"
              }`}
        </p>
        <div className="flex items-center gap-1 opacity-50 pointer-events-none">
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium bg-indigo-600 text-white"
          >
            1
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
