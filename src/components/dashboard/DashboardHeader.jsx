"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Plus, RefreshCw, Search } from "lucide-react";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import DashboardMonthPicker from "./DashboardMonthPicker";
import { currentMonthKey, DASHBOARD_TIME_ZONE, monthLabel, timeGreeting } from "@/lib/dashboard/period";

const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";
const iconButtonClass = `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-colors hover:bg-secondary hover:text-primary ${focusClass}`;

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
  function selectMonth(key) {
    const next = new URLSearchParams(params.toString());
    if (key === currentMonth) next.delete("month"); else next.set("month", key);
    startRefresh(() => router.push(`/dashboard${next.size ? `?${next}` : ""}`, { scroll: false }));
  }
  const firstName = String(fullName || "").trim().split(/\s+/)[0];

  return (
    <>
      <section aria-labelledby="dashboard-greeting" className="mb-7 sm:mb-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="fp-eyebrow mb-3">Your money and your tax year</p>
            <div className="flex items-start gap-3">
              <h1 id="dashboard-greeting" className="min-w-0 break-words text-[28px] font-semibold leading-[1.18] tracking-[-0.045em] text-foreground sm:text-[34px] xl:text-[38px]">
                {timeGreeting(clock)}{firstName ? `, ${firstName}` : ""}
              </h1>
            </div>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{selectedMonth === currentMonth ? "A little clarity for every financial decision." : `Your spending, savings and activity for ${monthLabel(selectedMonth)}.`}</p>
          </div>
          <DashboardMonthPicker selectedMonth={selectedMonth} currentMonth={currentMonth} availableMonths={availableMonths} disabled={refreshing} open={pickerOpen} onOpenChange={setPickerOpen} onSelect={selectMonth} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/transactions" className={`flex h-11 min-w-0 basis-full items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-primary sm:max-w-xs sm:basis-44 sm:flex-1 ${focusClass}`}>
            <Search aria-hidden="true" size={17} className="shrink-0" />
            <span className="truncate">Find a transaction</span>
            <ArrowUpRight aria-hidden="true" size={15} className="ml-auto shrink-0 opacity-60" />
          </Link>

          <div className="grid w-full grid-cols-[minmax(0,1fr)_44px] items-center gap-2 sm:flex sm:w-auto sm:gap-3">
            <button type="button" onClick={() => setAddOpen(true)} className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 min-[360px]:px-3.5 sm:px-4 sm:text-sm ${focusClass}`}>
              <Plus aria-hidden="true" size={17} className="hidden shrink-0 min-[360px]:block" />
              <span className="whitespace-nowrap">Add Expense</span>
            </button>
            <button type="button" aria-label={refreshing ? "Refreshing financial overview" : "Refresh financial overview"} title="Refresh financial overview" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())} className={`${iconButtonClass} disabled:cursor-wait disabled:opacity-60`}>
              <RefreshCw aria-hidden="true" size={17} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary/65" /><time dateTime={clock}>{new Date(clock).toLocaleTimeString("en-IN", { timeZone: DASHBOARD_TIME_ZONE, hour: "numeric", minute: "2-digit" })} IST</time><span aria-live="polite">{refreshing ? " · Updating overview…" : " · Refreshes automatically"}</span></p>
      </section>

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} defaultType="expense" />
    </>
  );
}
