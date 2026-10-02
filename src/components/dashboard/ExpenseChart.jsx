"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { EXPENSE_CHART_COLORS } from "@/lib/dashboard/compute-charts";
import { Tag, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const FALLBACK_EXPENSES = [
  { name: "Housing & Rent", value: 35000, pct: 44, color: "#6366f1" },
  { name: "Food & Dining", value: 16500, pct: 21, color: "#10b981" },
  { name: "Shopping & Lifestyle", value: 12000, pct: 15, color: "#f59e0b" },
  { name: "Transport & Fuel", value: 8500, pct: 11, color: "#ec4899" },
  { name: "Utilities & Bills", value: 7200, pct: 9, color: "#06b6d4" },
];

export default function ExpenseChart({ expenseData }) {
  const hasRealData = expenseData?.hasData ?? false;
  const data = hasRealData && expenseData?.data?.length ? expenseData.data : FALLBACK_EXPENSES;
  const totalFormatted = hasRealData ? expenseData.totalFormatted : "₹79,200";
  const monthLabel = expenseData?.monthLabel ?? "May 2026";

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Tag size={16} className="text-indigo-600" />
            Spending by Category
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Monthly expenditure analysis</p>
        </div>
        <span className="border border-slate-200 px-3 py-1 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 flex items-center gap-1">
          {monthLabel} ▾
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-center">
        {/* Doughnut Chart with Center Balance */}
        <div className="relative w-[190px] h-[190px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                dataKey="value"
                paddingAngle={3}
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Spent"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Spent</p>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">{totalFormatted}</p>
          </div>
        </div>

        {/* Category list with visual bars */}
        <div className="flex-1 w-full space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {data.map((item, index) => {
            const barColor = EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length];
            return (
              <div key={item.name} className="p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: barColor }}
                    />
                    <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-900">
                      ₹{item.value.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 w-8 text-right">
                      {item.pct}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
