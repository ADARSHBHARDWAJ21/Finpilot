"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_COLORS = ["#214d43", "#759582", "#ad705b", "#c4b18a", "#96aaa7", "#617970", "#d4b8a7", "#b5bfaf"];

export default function ExpenseChart({ expenseData }) {
  const hasRealData = expenseData?.hasData ?? false;
  const data = expenseData?.data || [];
  const totalFormatted = expenseData?.totalFormatted || "₹0";
  const monthLabel = expenseData?.monthLabel || "";
  return (
    <section className="h-full min-w-0 rounded-[20px] border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-base font-semibold tracking-tight text-foreground">Where your money goes</h2><p className="mt-1 text-xs text-muted-foreground">Spending by category</p></div>
        <p className="pt-0.5 text-[11px] text-muted-foreground">{monthLabel}</p>
      </div>
      <div className="relative mx-auto my-5 h-[175px] w-[175px] shrink-0">
        {hasRealData ? <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={62} outerRadius={84} dataKey="value" paddingAngle={3} stroke="none" cornerRadius={3}>
              {data.map((item, index) => <Cell key={item.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Spent"]} contentStyle={{ borderRadius: 12, border: "1px solid #dfe5dc", fontSize: 12, boxShadow: "none" }} />
          </PieChart>
        </ResponsiveContainer> : <div aria-hidden="true" className="absolute inset-1 rounded-full border-[20px] border-secondary" />}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[11px] text-muted-foreground">Total spent</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-foreground tabular-nums">{totalFormatted}</p>
        </div>
      </div>
      <div className="max-h-[140px] space-y-3 overflow-y-auto pr-1">
        {!hasRealData && <p className="pb-3 text-center text-xs leading-relaxed text-muted-foreground">No expenses recorded this month.<br />Your categories will appear as you add them.</p>}
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2.5 text-xs">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
            <span className="font-medium text-foreground tabular-nums">₹{item.value.toLocaleString("en-IN")}</span>
            <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">{item.pct}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
