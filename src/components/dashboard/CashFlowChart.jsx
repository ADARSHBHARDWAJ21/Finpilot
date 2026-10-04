"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ArrowLeftRight, TrendingUp } from "lucide-react";

export default function CashFlowChart({ cashFlowData }) {
  const data = cashFlowData?.data || [];
  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <ArrowLeftRight size={16} className="text-indigo-600" />
            Cash Flow Radar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">{cashFlowData?.rangeLabel || "Recorded income and expenses"}</p>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          6 months
        </span>
      </div>

      <div className="h-[200px] mt-4">
        {!cashFlowData?.hasData ? <p className="flex h-full items-center justify-center text-sm text-slate-500">No transactions in this six-month period.</p> :
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={3} barCategoryGap="22%">
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 12,
                fontWeight: 600,
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, fontWeight: 500, paddingTop: 6 }}
            />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="savings" name="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
        {[
          { label: "Avg Income", value: cashFlowData?.averageIncome || "₹0", color: "text-slate-900" },
          { label: "Avg Expenses", value: cashFlowData?.averageExpenses || "₹0", color: "text-slate-900" },
          { label: "Avg Savings", value: cashFlowData?.averageSavings || "₹0", color: "text-emerald-700" },
          { label: "Savings Rate", value: cashFlowData?.savingsRate || "—", color: "text-indigo-600" },
        ].map((stat) => (
          <div key={stat.label} className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-sm font-extrabold mt-0.5 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
