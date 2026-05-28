"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { EXPENSE_CHART_COLORS } from "@/lib/dashboard/compute-charts";

export default function ExpenseChart({ expenseData }) {
  const data = expenseData?.data ?? [];
  const totalFormatted = expenseData?.totalFormatted ?? "₹0";
  const monthLabel = expenseData?.monthLabel ?? "This month";
  const hasData = expenseData?.hasData ?? false;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Expenses by Category</h2>
          <p className="text-xs text-gray-400 mt-0.5">Monthly spending breakdown</p>
        </div>
        <span className="border border-gray-200 px-3 py-1 rounded-lg text-xs text-gray-600 bg-gray-50">
          {monthLabel} ▾
        </span>
      </div>

      {hasData ? (
        <div className="flex gap-4 items-center">
          <div className="relative w-[200px] h-[200px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] text-gray-400">Total</p>
              <p className="text-sm font-bold text-gray-900">{totalFormatted}</p>
            </div>
          </div>

          <div className="flex-1 space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length],
                    }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-medium text-gray-800">
                    ₹{item.value.toLocaleString("en-IN")}
                  </span>
                  <span className="text-gray-400 w-10 text-right">{item.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[220px] flex items-center justify-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
          <p className="text-sm text-gray-500 px-4 text-center">
            No expenses recorded for {monthLabel.toLowerCase()}. Import bank statements or add transactions.
          </p>
        </div>
      )}
    </div>
  );
}
