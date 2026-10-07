"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog } from "radix-ui";
import {
  ChevronDown,
  Search,
  Filter,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import TransactionRow from "@/components/transactions/TransactionRow";
import { mapTransactionToRow } from "@/components/transactions/transaction-utils";
import { deleteTransactions, deleteAllTransactions } from "@/app/transactions/actions";
import UploadStatement from "@/components/transactions/upload-csv";

export default function TransactionsSection({ initialTransactions = [], loadError = "" }) {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [previousInitial, setPreviousInitial] = useState(initialTransactions);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (previousInitial !== initialTransactions) {
    setPreviousInitial(initialTransactions);
    setTransactions(initialTransactions);
    const available = new Set(initialTransactions.map((tx) => String(tx.id)));
    setSelectedIds(new Set([...selectedIds].filter((id) => available.has(id))));
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
  const visibleIds = filtered.map((tx) => String(tx.id));
  const selectedVisibleIds = visibleIds.filter((id) => selectedIds.has(id));
  const allSelected = visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length;
  const partiallySelected = selectedVisibleIds.length > 0 && !allSelected;
  const filteredView = category !== "all" || !!searchQuery.trim();

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(visibleIds));
  }

  function toggleRow(id) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      return next;
    });
  }

  function requestDelete(mode, ids = []) {
    setError("");
    setSuccess("");
    setDeleteRequest({ mode, ids, count: mode === "all" ? rows.length : ids.length });
  }

  function confirmDelete() {
    if (!deleteRequest || isPending) return;
    const request = deleteRequest;
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        const result = request.mode === "all"
          ? await deleteAllTransactions()
          : await deleteTransactions(request.ids);
        if (request.mode === "all" && !result.error) {
          setTransactions([]);
          setSelectedIds(new Set());
          setCategory("all");
          setSearchQuery("");
        } else {
          const deleted = new Set(result.deletedIds || []);
          setTransactions((previous) => previous.filter((tx) => !deleted.has(String(tx.id))));
          setSelectedIds((previous) => new Set([...previous].filter((id) => !deleted.has(id))));
        }
        if (result.error) setError(result.error);
        if (result.count > 0) setSuccess(`Deleted ${result.count.toLocaleString("en-IN")} transaction${result.count === 1 ? "" : "s"}.`);
        else if (!result.error) setSuccess(result.count === 0 ? "No transactions were deleted. The list is up to date." : "All transactions deleted.");
      } catch (err) {
        setError(err.message || "Could not delete transactions. Please try again.");
      } finally {
        setDeleteRequest(null);
        router.refresh();
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
              aria-label="Search transactions"
              value={searchQuery}
              disabled={isPending}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIds(new Set()); }}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>

          {/* Category filter dropdown */}
          <div className="relative">
            <button
              type="button"
              suppressHydrationWarning
              disabled={isPending}
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
                          setSelectedIds(new Set());
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
          setSelectedIds(new Set());
          router.refresh();
        }}
      />

      {error || loadError ? (
        <p role="alert" className="mx-6 mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2 font-medium">
          {error || loadError}
        </p>
      ) : null}
      {success && <p role="status" className="mx-6 mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-700">{success}</p>}

      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-700">
            <input type="checkbox" checked={allSelected} ref={(node) => { if (node) node.indeterminate = partiallySelected; }} onChange={toggleAll} disabled={!filtered.length || isPending || !!loadError} className="h-4 w-4 rounded accent-indigo-600 disabled:cursor-not-allowed" />
            {filteredView ? "Select all matching" : "Select all"} ({filtered.length.toLocaleString("en-IN")})
          </label>
          <span role="status" className="text-slate-500">{selectedVisibleIds.length.toLocaleString("en-IN")} selected</span>
          {selectedVisibleIds.length > 0 && <button type="button" onClick={() => setSelectedIds(new Set())} disabled={isPending} className="font-semibold text-indigo-600 hover:underline disabled:opacity-50">Clear selection</button>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={!selectedVisibleIds.length || isPending || !!loadError} onClick={() => requestDelete("selected", selectedVisibleIds)} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14} aria-hidden="true" />Delete selected{selectedVisibleIds.length > 0 ? ` (${selectedVisibleIds.length})` : ""}</button>
          <button type="button" disabled={!rows.length || isPending || !!loadError} onClick={() => requestDelete("all")} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40">Delete all transactions</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70">
              <th className="w-12 pl-6 pr-2"><span className="sr-only">Select transaction</span></th>
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
                <td colSpan={8} className="px-6 py-14 text-center text-xs text-slate-400 font-medium">
                  {loadError ? "Your transactions are temporarily unavailable. Refresh to try again." : rows.length === 0
                    ? "No transactions yet. Drag & drop a bank PDF statement or use Add Expense above."
                    : "No transactions match your search filter."}
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onDelete={(id) => requestDelete("selected", [String(id)])}
                  selected={selectedIds.has(String(tx.id))}
                  onToggle={toggleRow}
                  deleting={isPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* All matching records are shown, including histories over 1,000 rows. */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 text-xs">
        <p className="text-slate-500 font-medium">
          {filtered.length === 0
            ? "No transactions found"
            : `Showing ${filtered.length} of ${rows.length} transaction${
                rows.length === 1 ? "" : "s"
              }`}
        </p>
        {filteredView && <p className="text-slate-400">Select all applies to your current filters.</p>}
      </div>

      <AlertDialog.Root open={!!deleteRequest} onOpenChange={(open) => { if (!open && !isPending) setDeleteRequest(null); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <AlertDialog.Content aria-busy={isPending} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl focus:outline-none">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Trash2 size={22} aria-hidden="true" /></div>
            <AlertDialog.Title className="text-lg font-bold text-slate-900">{deleteRequest?.mode === "all" ? "Delete all transactions?" : `Delete ${deleteRequest?.count || 0} selected transaction${deleteRequest?.count === 1 ? "" : "s"}?`}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600">
              {deleteRequest?.mode === "all"
                ? `This will permanently delete all transactions in your account (${deleteRequest.count.toLocaleString("en-IN")} currently listed), including those hidden by search or category filters.`
                : "The selected transactions will be permanently removed from your account."}
              {" "}Your financial summaries will update. This cannot be undone.
            </AlertDialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <AlertDialog.Cancel asChild><button type="button" disabled={isPending} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button></AlertDialog.Cancel>
              <button type="button" onClick={confirmDelete} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{isPending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}{isPending ? "Deleting…" : deleteRequest?.mode === "all" ? "Yes, delete all transactions" : "Delete permanently"}</button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}
