"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown } from "lucide-react";
import { financialYearOptions } from "@/lib/finance/model";

export default function FinancialYearSelect({ year }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white py-2 pl-3 pr-8 text-sm text-foreground">
      <CalendarDays size={16} strokeWidth={1.7} className="shrink-0 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">FY</span>
      <select
        aria-label="Financial year"
        value={year}
        onChange={(event) => { const next = new URLSearchParams(params.toString()); next.set("year", event.target.value); router.push(`${pathname}?${next}`, { scroll: false }); }}
        className="cursor-pointer appearance-none bg-transparent pl-1 font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {financialYearOptions(year).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-3 text-muted-foreground" />
    </label>
  );
}
