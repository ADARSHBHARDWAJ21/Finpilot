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

const data = [
  { month: "Jan", income: 115000, expenses: 82000, savings: 33000 },
  { month: "Feb", income: 120000, expenses: 78000, savings: 42000 },
  { month: "Mar", income: 125000, expenses: 81000, savings: 44000 },
  { month: "Apr", income: 118000, expenses: 85000, savings: 33000 },
  { month: "May", income: 128500, expenses: 74860, savings: 53640 },
];

export default function CashFlowChart() {
  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Cash Flow Overview</h2>
      <p className="text-xs text-gray-400 mt-0.5">Income vs Expenses vs Savings</p>

      <div className="h-[200px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="20%">
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="savings" name="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
        {[
          { label: "Avg. Monthly Income", value: "₹1,21,300" },
          { label: "Avg. Monthly Expenses", value: "₹80,172" },
          { label: "Avg. Monthly Savings", value: "₹41,128" },
          { label: "Savings Rate", value: "42.6%", highlight: true },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-[10px] text-gray-400 leading-tight">{stat.label}</p>
            <p className={`text-sm font-bold mt-1 ${stat.highlight ? "text-indigo-600" : "text-gray-900"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}


