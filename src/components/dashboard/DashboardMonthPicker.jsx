"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "@/lib/dashboard/period";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export default function DashboardMonthPicker({ selectedMonth, currentMonth, availableMonths, disabled, open, onOpenChange, onSelect }) {
  const [year, setYear] = useState(Number(selectedMonth.slice(0, 4)));
  const currentYear = Number(currentMonth.slice(0, 4));
  function choose(key) { onOpenChange(false); onSelect(key); }
  return <Popover.Root open={open} onOpenChange={(value) => { if (value) setYear(Number(selectedMonth.slice(0, 4))); onOpenChange(value); }}>
    <Popover.Trigger asChild>
      <button type="button" disabled={disabled} aria-label={`Choose dashboard month, ${monthLabel(selectedMonth)}`} className="inline-flex w-fit shrink-0 items-center gap-2.5 rounded-xl border border-indigo-100 bg-white/90 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60">
        <CalendarDays aria-hidden="true" size={17} className="text-indigo-500" /><span>{monthLabel(selectedMonth)}</span><ChevronDown aria-hidden="true" size={15} className="text-slate-400" />
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content aria-label="Choose a dashboard month" align="end" sideOffset={10} collisionPadding={12} className="z-50 w-[300px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 outline-none">
        <p className="mb-3 text-sm font-semibold text-slate-900">Explore your history</p>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button type="button" aria-label="Previous year" disabled={year <= 1900} onClick={() => setYear(year - 1)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={17} /></button>
          <select aria-label="Calendar year" value={year} onChange={(event) => setYear(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800">
            {Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <button type="button" aria-label="Next year" disabled={year >= currentYear} onClick={() => setYear(year + 1)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={17} /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((name, index) => {
            const key = `${year}-${String(index + 1).padStart(2, "0")}`;
            const selected = selectedMonth === key;
            return <button type="button" key={key} aria-label={`Show ${monthLabel(key)}`} aria-pressed={selected} disabled={key > currentMonth} onClick={() => choose(key)} className={`relative rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-30 ${selected ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"}`}>
              {name}{availableMonths.includes(key) && <span aria-hidden="true" className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${selected ? "bg-white" : "bg-indigo-500"}`} />}
            </button>;
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-500">● Months with transactions</span>
          <button type="button" onClick={() => choose(currentMonth)} className="text-xs font-semibold text-indigo-600 hover:underline">Current month</button>
        </div>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
