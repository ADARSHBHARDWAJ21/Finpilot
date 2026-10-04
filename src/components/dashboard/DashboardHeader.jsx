"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bell, Plus, RefreshCw, Search } from "lucide-react";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import DashboardMonthPicker from "./DashboardMonthPicker";
import { currentMonthKey, DASHBOARD_TIME_ZONE, monthLabel, timeGreeting } from "@/lib/dashboard/period";

const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
const iconButtonClass = `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 ${focusClass}`;

export default function DashboardHeader({ fullName, selectedMonth, availableMonths, updatedAt }) {
  const router = useRouter();
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
  function selectMonth(key) {
    startRefresh(() => router.push(key === currentMonth ? "/dashboard" : `/dashboard?month=${key}`, { scroll: false }));
  }
  const firstName = String(fullName || "").trim().split(/\s+/)[0];
  const initial = firstName ? [...firstName][0].toUpperCase() : "U";

  return (
    <>
      <section aria-labelledby="dashboard-greeting" className="mb-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)] sm:mb-6">
        <div className="flex flex-col gap-4 bg-[linear-gradient(115deg,#ffffff_45%,#f5f3ff_100%)] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-6">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-indigo-600 sm:text-[11px]">YOUR FINANCIAL OVERVIEW</p>
            <div className="flex items-start gap-3">
              <h1 id="dashboard-greeting" className="min-w-0 break-words text-2xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {timeGreeting(clock)}{firstName ? `, ${firstName}` : ""}
              </h1>
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl sm:h-10 sm:w-10">👋</span>
            </div>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-slate-500 sm:text-sm">{selectedMonth === currentMonth ? "A clear view of your spending, savings and goals." : `Your spending, savings and activity for ${monthLabel(selectedMonth)}.`}</p>
            <p className="mt-1 text-[11px] text-slate-400"><time dateTime={clock}>{new Date(clock).toLocaleTimeString("en-IN", { timeZone: DASHBOARD_TIME_ZONE, hour: "numeric", minute: "2-digit" })} IST</time><span aria-live="polite">{refreshing ? " · Updating overview…" : " · Refreshes automatically"}</span></p>
          </div>
          <DashboardMonthPicker selectedMonth={selectedMonth} currentMonth={currentMonth} availableMonths={availableMonths} disabled={refreshing} open={pickerOpen} onOpenChange={setPickerOpen} onSelect={selectMonth} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:px-6">
          <Link href="/transactions" className={`flex h-11 min-w-0 basis-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 sm:basis-44 sm:flex-1 ${focusClass}`}>
            <Search aria-hidden="true" size={17} className="shrink-0" />
            <span className="truncate">Find a transaction</span>
            <ArrowUpRight aria-hidden="true" size={15} className="ml-auto shrink-0 text-slate-400" />
          </Link>

          <div className="grid w-full grid-cols-[minmax(0,1fr)_44px_44px_44px] items-center gap-2 sm:flex sm:w-auto sm:gap-3">
            <button type="button" onClick={() => setAddOpen(true)} className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700 min-[360px]:px-3.5 sm:text-sm ${focusClass}`}>
              <Plus aria-hidden="true" size={17} className="hidden shrink-0 min-[360px]:block" />
              <span className="whitespace-nowrap">Add Expense</span>
            </button>
            <button type="button" aria-label={refreshing ? "Refreshing financial overview" : "Refresh financial overview"} title="Refresh financial overview" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())} className={`${iconButtonClass} disabled:cursor-wait disabled:opacity-60`}>
              <RefreshCw aria-hidden="true" size={17} className={refreshing ? "animate-spin" : ""} />
            </button>
            <Link href="/reminders" aria-label="View reminders" title="View reminders" className={iconButtonClass}>
              <Bell aria-hidden="true" size={18} />
            </Link>
            <Link href="/settings" aria-label="Account settings" title="Account settings" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-indigo-50 bg-indigo-600 text-sm font-bold text-white transition-colors hover:bg-indigo-700 ${focusClass}`}>
              {initial}
            </Link>
          </div>
        </div>
      </section>

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} defaultType="expense" />
    </>
  );
}
