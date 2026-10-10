"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { ArrowLeftRight } from "lucide-react";

export default function CashFlowChart({ cashFlowData }) {
  const data = cashFlowData?.data || [];
  return (
    <section className="min-w-0 rounded-[20px] border border-border bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-base font-semibold tracking-tight text-foreground">Money in, money out</h2><p className="mt-1 text-xs text-muted-foreground">{cashFlowData?.rangeLabel || "Recorded income and expenses"}</p></div>
        <span className="text-[11px] text-muted-foreground">6 months</span>
      </div>
      <div className="mt-6 h-[200px]">
        {!cashFlowData?.hasData ? <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/50 px-5 text-center"><ArrowLeftRight size={26} strokeWidth={1.5} className="mb-3 text-primary/45" /><p className="text-sm text-muted-foreground">Make room for the bigger picture.</p><p className="mt-1 text-xs text-muted-foreground">No transactions in this six-month period.</p></div> :
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={3} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="#e9eee8" strokeDasharray="3 5" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#738078" }} axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis hide />
            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} contentStyle={{ borderRadius: 12, border: "1px solid #dfe5dc", fontSize: 12, boxShadow: "none" }} cursor={{ fill: "#f6f7f4" }} />
            <Legend iconType="square" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
            <Bar dataKey="income" name="Income" fill="#214d43" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ad705b" radius={[3, 3, 0, 0]} />
            <Bar dataKey="savings" name="Savings" fill="#b5c6b2" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        {[
          { label: "Avg. income", value: cashFlowData?.averageIncome || "₹0" },
          { label: "Avg. expenses", value: cashFlowData?.averageExpenses || "₹0" },
          { label: "Avg. savings", value: cashFlowData?.averageSavings || "₹0" },
          { label: "Savings rate", value: cashFlowData?.savingsRate || "—" },
        ].map((stat) => <div key={stat.label} className="min-w-0"><dt className="text-[10px] leading-relaxed text-muted-foreground">{stat.label}</dt><dd className="mt-1 break-words text-sm font-semibold text-foreground tabular-nums">{stat.value}</dd></div>)}
      </dl>
    </section>
  );
}
