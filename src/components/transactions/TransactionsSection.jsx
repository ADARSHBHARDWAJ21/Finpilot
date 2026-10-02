"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  Download,
} from "lucide-react";
import TransactionRow from "@/components/transactions/TransactionRow";
import { mapTransactionToRow } from "@/components/transactions/transaction-utils";
import { deleteTransaction } from "@/app/transactions/actions";
import UploadStatement from "@/components/transactions/upload-csv";

export default function TransactionsSection({ initialTransactions = [] }) {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [previousInitial, setPreviousInitial] = useState(initialTransactions);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (previousInitial !== initialTransactions) {
    setPreviousInitial(initialTransactions);
    setTransactions(initialTransactions);
  }

  const rows = useMemo(
    () => transactions.map((tx, i) => mapTransactionToRow(tx, i)),
    [transactions]
  );

  const categories = useMemo(() => {
    const set = new Set(rows.map((tx) => tx.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((tx) => {
      const matchCat = category === "all" || tx.category === category;
      const matchQuery =
        !searchQuery.trim() ||
        tx.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.payment?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [rows, category, searchQuery]);

  const categoryLabel = category === "all" ? "All Categories" : category;

  function handleDelete(transactionId) {
    if (!transactionId) return;
    const confirmed = window.confirm("Delete this transaction? This cannot be undone.");
    if (!confirmed) return;

    setError("");
    setDeletingId(transactionId);

    startTransition(async () => {
      try {
        await deleteTransaction(transactionId);
        setTransactions((prev) => prev.filter((tx) => tx.id !== transactionId));
        router.refresh();
      } catch (err) {
        setError(err.message || "Failed to delete transaction");
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs mt-6 overflow-hidden">
      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Transactions Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Search, filter, categorize, and audit verified bank debits &amp; credits
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Search input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search payees, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>

          {/* Category filter dropdown */}
          <div className="relative">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Filter size={13} className="text-slate-400" />
              <span>{categoryLabel}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {dropdownOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close category menu"
                  onClick={() => setDropdownOpen(false)}
                />
                <ul className="absolute right-0 z-20 mt-1 min-w-[170px] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs scrollbar-thin">
                  {categories.map((cat) => (
                    <li key={cat}>
                      <button
                        type="button"
                        className={`w-full text-left px-3.5 py-2 font-medium hover:bg-slate-50 transition-colors ${
                          category === cat ? "text-indigo-600 font-bold bg-indigo-50/50" : "text-slate-700"
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

      {/* Upload CSV container */}
      <UploadStatement
        className="mx-6 my-5"
        onImported={(saved) => {
          setTransactions((previous) => {
            const byId = new Map(previous.map((row) => [row.id, row]));
            for (const row of saved) byId.set(row.id, row);
            return [...byId.values()].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
          });
          setCategory("all");
          router.refresh();
        }}
      />

      {error ? (
        <p className="mx-6 mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2 font-medium">
          {error}
        </p>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70">
              {["Date", "Description", "Category", "Payment Method", "Amount", "Status", ""].map(
                (col, i) => (
                  <th
                    key={col || "actions"}
                    className={`py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ${
                      i === 6 ? "px-4 text-right w-14" : "px-6 text-left"
                    }`}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center text-xs text-slate-400 font-medium">
                  {rows.length === 0
                    ? "No transactions yet. Drag & drop a bank PDF statement or use Add Expense above."
                    : "No transactions match your search filter."}
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onDelete={handleDelete}
                  deleting={isPending && deletingId === tx.id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 text-xs">
        <p className="text-slate-500 font-medium">
          {filtered.length === 0
            ? "No transactions found"
            : `Showing ${filtered.length} of ${rows.length} transaction${
                rows.length === 1 ? "" : "s"
              }`}
        </p>
        <div className="flex items-center gap-1.5 opacity-60">
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs"
          >
            1
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
