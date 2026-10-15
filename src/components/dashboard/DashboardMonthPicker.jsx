"use client";

import { useId, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { monthLabel, shiftMonth } from "@/lib/dashboard/period";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const firstYear = 1900;
const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2";
const navigationClass = `inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-25 ${focusClass}`;

function moveGridFocus(event) {
  const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
  if (!(event.key in offsets) && event.key !== "Home" && event.key !== "End") return;
  const buttons = [...event.currentTarget.querySelectorAll("button")];
  const index = buttons.indexOf(event.target);
  if (index < 0) return;
  event.preventDefault();
  let next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : index + offsets[event.key];
  const direction = event.key === "End" || offsets[event.key] < 0 ? -1 : 1;
  while (next >= 0 && next < buttons.length) {
    if (!buttons[next].disabled) {
      buttons[next].focus();
      return;
    }
    next += direction;
  }
}

export default function DashboardMonthPicker({ selectedMonth, currentMonth, availableMonths = [], disabled = false, open, onOpenChange, onSelect, context = "dashboard" }) {
  const [year, setYear] = useState(Number(selectedMonth.slice(0, 4)));
  const [choosingYear, setChoosingYear] = useState(false);
  const [yearRangeEnd, setYearRangeEnd] = useState(Number(currentMonth.slice(0, 4)));
  const monthGridRef = useRef(null);
  const yearToggleRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const currentYear = Number(currentMonth.slice(0, 4));
  const yearRangeStart = Math.max(firstYear, yearRangeEnd - 11);
  const previousMonth = shiftMonth(selectedMonth, -1);
  const nextMonth = shiftMonth(selectedMonth, 1);
  const activityMonths = new Set(availableMonths);

  function choose(key, followCurrent = false) {
    if (disabled || key < `${firstYear}-01` || key > currentMonth) return;
    onOpenChange(false);
    onSelect(key, { followCurrent });
  }

  function changeOpen(value) {
    if (value) {
      const selectedYear = Number(selectedMonth.slice(0, 4));
      setYear(selectedYear);
      setYearRangeEnd(currentYear - Math.floor((currentYear - selectedYear) / 12) * 12);
      setChoosingYear(false);
    }
    onOpenChange(value);
  }

  function toggleYearView() {
    if (!choosingYear) setYearRangeEnd(currentYear - Math.floor((currentYear - year) / 12) * 12);
    setChoosingYear(!choosingYear);
  }

  return <Popover.Root open={open} onOpenChange={changeOpen}>
    <Popover.Trigger asChild>
      <button type="button" disabled={disabled} aria-label={`Choose ${context} month, ${monthLabel(selectedMonth)}`} className={`group inline-flex min-h-11 w-fit shrink-0 items-center gap-3 rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm shadow-primary/[0.03] transition-colors hover:border-primary/40 hover:bg-secondary/50 data-[state=open]:border-primary/40 data-[state=open]:bg-secondary/70 disabled:cursor-wait disabled:opacity-60 ${focusClass}`}>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><CalendarDays aria-hidden="true" size={16} strokeWidth={1.8} /></span>
        <span className="whitespace-nowrap">{monthLabel(selectedMonth)}</span>
        <ChevronDown aria-hidden="true" size={15} className="ml-1 shrink-0 text-primary/60 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        align="end"
        sideOffset={10}
        collisionPadding={12}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const grid = monthGridRef.current;
          (grid?.querySelector('[aria-pressed="true"]') || grid?.querySelector("button:not(:disabled)"))?.focus();
        }}
        className="z-50 w-[324px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-[20px] border border-primary/15 bg-white p-4 text-foreground shadow-[0_16px_48px_-12px_rgba(24,65,49,0.24)] outline-none"
        style={{ maxHeight: "var(--radix-popover-content-available-height)" }}
      >
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <div>
            <h2 id={titleId} className="text-sm font-semibold tracking-tight">Choose month</h2>
            <p id={descriptionId} className="mt-1 text-xs text-muted-foreground">Viewing {monthLabel(selectedMonth)}</p>
          </div>
          <div role="group" aria-label="Change month" className="flex shrink-0 items-center gap-0.5 rounded-xl border border-border p-0.5">
            <button type="button" aria-label={`Previous month, ${monthLabel(previousMonth)}`} title="Previous month" disabled={disabled || previousMonth < `${firstYear}-01`} onClick={() => choose(previousMonth)} className={navigationClass}><ChevronLeft aria-hidden="true" size={16} /></button>
            <button type="button" aria-label={`Next month, ${monthLabel(nextMonth)}`} title="Next month" disabled={disabled || nextMonth > currentMonth} onClick={() => choose(nextMonth)} className={navigationClass}><ChevronRight aria-hidden="true" size={16} /></button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-secondary/70 p-1">
          <button type="button" aria-label={choosingYear ? "Previous 12 years" : "Previous year"} disabled={disabled || (choosingYear ? yearRangeStart <= firstYear : year <= firstYear)} onClick={() => choosingYear ? setYearRangeEnd(Math.max(firstYear, yearRangeEnd - 12)) : setYear(year - 1)} className={navigationClass}><ChevronLeft aria-hidden="true" size={17} /></button>
          <button ref={yearToggleRef} type="button" aria-label={choosingYear ? "Back to months" : `Choose year, ${year}`} aria-expanded={choosingYear} disabled={disabled} onClick={toggleYearView} className={`inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold tabular-nums text-primary transition-colors hover:bg-white ${focusClass}`}>
            <span aria-live="polite">{choosingYear ? `${yearRangeStart} – ${yearRangeEnd}` : year}</span>
            <ChevronDown aria-hidden="true" size={14} className={`transition-transform motion-reduce:transition-none ${choosingYear ? "rotate-180" : ""}`} />
          </button>
          <button type="button" aria-label={choosingYear ? "Next 12 years" : "Next year"} disabled={disabled || (choosingYear ? yearRangeEnd >= currentYear : year >= currentYear)} onClick={() => choosingYear ? setYearRangeEnd(Math.min(currentYear, yearRangeEnd + 12)) : setYear(year + 1)} className={navigationClass}><ChevronRight aria-hidden="true" size={17} /></button>
        </div>

        {choosingYear ? <div role="group" aria-label="Choose a year" onKeyDown={moveGridFocus} className="grid grid-cols-3 gap-2">
          {Array.from({ length: yearRangeEnd - yearRangeStart + 1 }, (_, index) => yearRangeStart + index).map((value) => <button type="button" key={value} aria-pressed={year === value} aria-current={value === currentYear ? "date" : undefined} disabled={disabled} onClick={() => { setYear(value); setChoosingYear(false); yearToggleRef.current?.focus(); }} className={`flex min-h-14 items-center justify-center rounded-xl border px-2 text-sm font-medium tabular-nums transition-colors ${focusClass} ${year === value ? "border-primary bg-primary text-white shadow-sm" : value === currentYear ? "border-primary/30 bg-secondary/50 text-primary hover:bg-secondary" : "border-border/60 bg-background/50 text-foreground hover:border-primary/20 hover:bg-secondary"}`}>
            {value}
          </button>)}
        </div> : <div ref={monthGridRef} role="group" aria-label={`Months in ${year}`} onKeyDown={moveGridFocus} className="grid grid-cols-3 gap-2">
          {months.map((name, index) => {
            const key = `${year}-${String(index + 1).padStart(2, "0")}`;
            const selected = selectedMonth === key;
            const current = currentMonth === key;
            const hasActivity = activityMonths.has(key);
            return <button type="button" key={key} aria-label={`${monthLabel(key)}${current ? ", current month" : ""}${hasActivity ? ", has activity" : ""}`} aria-pressed={selected} aria-current={current ? "date" : undefined} disabled={disabled || key > currentMonth} onClick={() => choose(key)} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${focusClass} ${selected ? "border-primary bg-primary text-white shadow-sm" : current ? "border-primary/30 bg-secondary/50 text-primary hover:bg-secondary" : "border-border/60 bg-background/50 text-foreground enabled:hover:border-primary/20 enabled:hover:bg-secondary"}`}>
              {selected && <Check aria-hidden="true" size={11} strokeWidth={2.5} className="absolute right-1.5 top-1.5 text-white/80" />}
              <span>{name}</span>
              <span aria-hidden="true" className="flex h-3 items-center gap-1">
                {hasActivity && <span className={`size-1 rounded-full ${selected ? "bg-white/90" : "bg-primary/70"}`} />}
                {current && <span className={`text-[9px] font-medium leading-none ${selected ? "text-white/80" : "text-primary/75"}`}>This month</span>}
              </span>
            </button>;
          })}
        </div>}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><span aria-hidden="true" className="size-1.5 rounded-full bg-primary/70" />With activity</span>
          <button type="button" disabled={disabled} onClick={() => choose(currentMonth, true)} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary transition-colors hover:bg-secondary ${focusClass}`}><RotateCcw aria-hidden="true" size={12} />This month</button>
        </div>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
