"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Housing", value: 22300, pct: 29.8 },
  { name: "Food & Dining", value: 12450, pct: 16.6 },
  { name: "Transport", value: 8920, pct: 11.9 },
  { name: "Shopping", value: 7850, pct: 10.5 },
  { name: "Entertainment", value: 5240, pct: 7.0 },
  { name: "Utilities", value: 4800, pct: 6.4 },
  { name: "Healthcare", value: 4300, pct: 5.7 },
  { name: "Others", value: 9000, pct: 12.1 },
];

const COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#94a3b8",
];

export default function ExpenseChart() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Expenses by Category</h2>
          <p className="text-xs text-gray-400 mt-0.5">Monthly spending breakdown</p>
        </div>
        <span className="border border-gray-200 px-3 py-1 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer">
          This Month ▾
        </span>
      </div>

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
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] text-gray-400">Total</p>
            <p className="text-sm font-bold text-gray-900">₹74,860</p>
          </div>
        </div>

        <div className="flex-1 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
    </div>
  );
}





