"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DashboardMonthPicker from "./DashboardMonthPicker";
import { rememberSelectedMonth } from "@/app/month-actions";

export default function MonthSelectionControl({ selectedMonth, currentMonth, availableMonths = [], context, disabled = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function selectMonth(key, { followCurrent = false } = {}) {
    if (pending) return;
    setError("");
    const next = new URLSearchParams(params.toString());
    if (followCurrent || key === currentMonth) next.delete("month"); else next.set("month", key);
    startTransition(async () => {
      try {
        await rememberSelectedMonth(key, followCurrent);
        router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
      } catch {
        setError("Could not change the month. Please try again.");
      }
    });
  }

  return <div className="min-w-0">
    <DashboardMonthPicker selectedMonth={selectedMonth} currentMonth={currentMonth} availableMonths={availableMonths} context={context} disabled={disabled || pending} open={open} onOpenChange={setOpen} onSelect={selectMonth} />
    {pending && <span role="status" className="sr-only">Updating month</span>}
    {error && <p role="alert" className="mt-2 max-w-xs text-xs text-destructive">{error}</p>}
  </div>;
}
