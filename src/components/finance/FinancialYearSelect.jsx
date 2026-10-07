"use client";
import { useRouter, usePathname } from "next/navigation";
import { financialYearOptions } from "@/lib/finance/model";

export default function FinancialYearSelect({ year }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Financial year
      <select
        aria-label="Financial year"
        value={year}
        onChange={(event) =>
          router.push(`${pathname}?year=${event.target.value}`)
        }
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800"
      >
        {financialYearOptions(year).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
