"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog, Dialog } from "radix-ui";
import {
  ChevronDown,
  Search,
  Filter,
  Trash2,
  LoaderCircle,
  X,
  ReceiptText,
} from "lucide-react";
import TransactionRow, { TransactionCard } from "@/components/transactions/TransactionRow";
import { mapTransactionToRow } from "@/components/transactions/transaction-utils";
import { deleteTransactions, deleteAllTransactions } from "@/app/transactions/actions";
import UploadStatement from "@/components/transactions/upload-csv";

export default function TransactionsSection({ initialTransactions = [], loadError = "" }) {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [viewedId, setViewedId] = useState(null);
  const drawerOpener = useRef(null);
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
      const matchReview = reviewFilter === "all" || (reviewFilter === "review" ? tx.status === "Needs Review" : tx.status !== "Needs Review");
      return matchCat && matchQuery && matchReview;
    });
  }, [rows, category, searchQuery, reviewFilter]);

  const visibleIds = filtered.map((tx) => String(tx.id));
  const selectedVisibleIds = visibleIds.filter((id) => selectedIds.has(id));
  const allSelected = visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length;
  const partiallySelected = selectedVisibleIds.length > 0 && !allSelected;
  const filteredView = category !== "all" || !!searchQuery.trim() || reviewFilter !== "all";
  const viewed = rows.find(row=>String(row.id) === String(viewedId));

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(visibleIds));
  }

  function openTransaction(id) {
    drawerOpener.current = document.activeElement;
    setViewedId(id);
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
          setReviewFilter("all");
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
    <section className="fp-card mt-6 overflow-hidden">
      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-5 sm:px-6 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">Your transactions</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            All your recorded activity, organised in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Search input */}
          <div className="relative min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions…"
              aria-label="Search transactions"
              value={searchQuery}
              disabled={isPending}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedIds(new Set()); }}
              className="min-h-10 w-full pl-9 pr-3 py-2 bg-background border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>

          {/* Category filter dropdown */}
          <div className="relative min-w-0 max-w-full">
            <Filter size={13} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              aria-label="Transaction category"
              value={category}
              disabled={isPending}
              onChange={(event) => { setCategory(event.target.value); setSelectedIds(new Set()); }}
              className="min-h-10 max-w-full appearance-none rounded-xl border border-border bg-white py-2 pl-9 pr-9 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {categories.map((cat) => <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <select aria-label="Transaction review status" value={reviewFilter} disabled={isPending} onChange={event=>{setReviewFilter(event.target.value);setSelectedIds(new Set());}} className="fp-input !w-auto"><option value="all">All review statuses</option><option value="review">Needs review</option><option value="complete">Completed</option></select>
        </div>
      </div>

      {/* Upload CSV container */}
      <UploadStatement
        className="mx-4 my-5 sm:mx-6"
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
          {selectedVisibleIds.length > 0 && <button type="button" disabled={isPending || !!loadError} onClick={() => requestDelete("selected", selectedVisibleIds)} className="fp-button !border-destructive/20 !text-destructive"><Trash2 size={14} aria-hidden="true" />Delete selected ({selectedVisibleIds.length})</button>}
          <details className="relative"><summary className="rounded-xl border border-border bg-white px-3 text-xs font-medium">More actions</summary><div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-white p-2 shadow-lg"><button type="button" disabled={!rows.length || isPending || !!loadError} onClick={() => requestDelete("all")} className="w-full rounded-lg px-3 text-left text-sm text-destructive hover:bg-rose-50 disabled:opacity-40">Delete all transactions</button></div></details>
        </div>
      </div>

      {/* Table */}
      <div className="fp-table-scroll scrollbar-thin hidden md:block">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70">
              <th className="w-12 pl-6 pr-2"><span className="sr-only">Select transaction</span></th>
              {["Date", "Description", "Category", "Payment Method", "Amount", "Status", ""].map(
                (col, i) => (
                  <th
                    key={col || "actions"}
                    className={`py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider ${
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
                    ? "Start with a bank statement or add your first transaction."
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
                  onView={openTransaction}
                  deleting={isPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 bg-background p-4 md:hidden">{filtered.length ? filtered.map(tx=><TransactionCard key={tx.id} tx={tx} onDelete={id=>requestDelete("selected",[String(id)])} onToggle={toggleRow} onView={openTransaction} selected={selectedIds.has(String(tx.id))} deleting={isPending} />) : <p className="py-8 text-center text-sm text-muted-foreground">{loadError ? "Your records could not be loaded. Refresh to try again." : rows.length ? "No transactions match your filters." : "Upload a statement or add your first transaction."}</p>}</div>

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

      <Dialog.Root open={Boolean(viewed)} onOpenChange={open=>{if(!open)setViewedId(null);}}><Dialog.Portal><Dialog.Overlay className="fp-drawer-overlay" /><Dialog.Content className="fp-drawer" aria-describedby="transaction-detail-description" onCloseAutoFocus={event=>{event.preventDefault();drawerOpener.current?.focus();}}><div className="flex items-center justify-between gap-3"><span className="fp-icon"><ReceiptText size={21} /></span><Dialog.Close asChild><button type="button" aria-label="Close transaction details" className="fp-button !px-3"><X size={18} /></button></Dialog.Close></div><Dialog.Title className="mt-6 text-2xl font-medium tracking-tight">{viewed?.name}</Dialog.Title><Dialog.Description id="transaction-detail-description" className="mt-2 text-sm text-muted-foreground">A closer look at this saved transaction.</Dialog.Description><p className="my-7 text-4xl font-medium tracking-tight tabular-nums">{viewed?.amount}</p><dl className="divide-y divide-border">{[["Date",viewed?.date],["Type",viewed?.income ? "Income" : "Expense"],["Category",viewed?.category],["Payment method",viewed?.payment],["Review status",viewed?.status]].map(([label,value])=><div key={label} className="flex justify-between gap-4 py-4 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right">{value}</dd></div>)}</dl><p className="mt-6 text-xs leading-relaxed text-muted-foreground">Saved record details. Review imported rows and categories before using financial totals.</p></Dialog.Content></Dialog.Portal></Dialog.Root>
      <AlertDialog.Root open={!!deleteRequest} onOpenChange={(open) => { if (!open && !isPending) setDeleteRequest(null); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <AlertDialog.Content aria-busy={isPending} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl focus:outline-none">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Trash2 size={22} aria-hidden="true" /></div>
            <AlertDialog.Title className="text-base font-semibold text-slate-900">{deleteRequest?.mode === "all" ? "Delete all transactions?" : `Delete ${deleteRequest?.count || 0} selected transaction${deleteRequest?.count === 1 ? "" : "s"}?`}</AlertDialog.Title>
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
