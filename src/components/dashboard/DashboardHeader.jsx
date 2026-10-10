"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Search } from "lucide-react";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import DashboardMonthPicker from "./DashboardMonthPicker";
import { currentMonthKey, DASHBOARD_TIME_ZONE, monthLabel, timeGreeting } from "@/lib/dashboard/period";

const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";
const iconButtonClass = `fp-dashboard-refresh flex shrink-0 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-colors hover:bg-secondary hover:text-primary ${focusClass}`;

export default function DashboardHeader({ fullName, selectedMonth, availableMonths, updatedAt }) {
  const router = useRouter();
  const params = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [clock, setClock] = useState(updatedAt);
  const currentMonth = currentMonthKey(clock);
  useEffect(() => {
    const update = () => setClock(new Date().toISOString());
    const timer = setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, []);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine && !addOpen && !pickerOpen && !refreshing) startRefresh(() => router.refresh());
    };
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); window.removeEventListener("online", refresh); };
  }, [router, addOpen, pickerOpen, refreshing]);
  useEffect(() => {
    const openSearch = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !addOpen && !pickerOpen) {
        event.preventDefault();
        router.push("/transactions");
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, [router, addOpen, pickerOpen]);
  function selectMonth(key) {
    const next = new URLSearchParams(params.toString());
    if (key === currentMonth) next.delete("month"); else next.set("month", key);
    startRefresh(() => router.push(`/dashboard${next.size ? `?${next}` : ""}`, { scroll: false }));
  }
  const firstName = String(fullName || "").trim().split(/\s+/)[0];

  return (
    <>
      <section aria-labelledby="dashboard-greeting" className="fp-dashboard-header">
          <div className="fp-dashboard-greeting min-w-0">
            <p className="fp-eyebrow">Your money and your tax year</p>
              <h1 id="dashboard-greeting" className="min-w-0 break-words font-semibold text-foreground">
                {timeGreeting(clock)}{firstName ? `, ${firstName}` : ""}
              </h1>
            <p className="fp-dashboard-description">{selectedMonth === currentMonth ? "A little clarity for every financial decision." : `Your spending, savings and activity for ${monthLabel(selectedMonth)}.`}</p>
          </div>
          <div className="min-w-0">
        <div className="fp-dashboard-toolbar">
          <Link href="/transactions" aria-keyshortcuts="Control+k Meta+k" className={`fp-dashboard-search flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-primary ${focusClass}`}>
            <Search aria-hidden="true" size={17} className="shrink-0" />
            <span className="truncate">Find a transaction</span>
            <kbd className="fp-dashboard-shortcut" aria-hidden="true">Ctrl K</kbd>
          </Link>
          <div className="fp-dashboard-month"><DashboardMonthPicker selectedMonth={selectedMonth} currentMonth={currentMonth} availableMonths={availableMonths} disabled={refreshing} open={pickerOpen} onOpenChange={setPickerOpen} onSelect={selectMonth} /></div>
            <button type="button" onClick={() => setAddOpen(true)} className={`fp-dashboard-add flex min-w-0 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 ${focusClass}`}>
              <Plus aria-hidden="true" size={17} className="shrink-0" />
              <span className="whitespace-nowrap">Add Expense</span>
            </button>
            <button type="button" aria-label={refreshing ? "Refreshing financial overview" : "Refresh financial overview"} title="Refresh financial overview" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())} className={`${iconButtonClass} disabled:cursor-wait disabled:opacity-60`}>
              <RefreshCw aria-hidden="true" size={17} className={refreshing ? "animate-spin" : ""} />
            </button>
        </div>
        <p className="fp-dashboard-sync"><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><time dateTime={clock}>{new Date(clock).toLocaleTimeString("en-IN", { timeZone: DASHBOARD_TIME_ZONE, hour: "numeric", minute: "2-digit" })} IST</time><span aria-live="polite">{refreshing ? " · Updating overview…" : " · Refreshes automatically"}</span></p>
          </div>
      </section>

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} defaultType="expense" />
    </>
  );
}
