"use client";

import { useState } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Wallet } from "lucide-react";

export default function NetWorthSection({ netWorthData }) {
  const [timeRange, setTimeRange] = useState("6M");
  const all = netWorthData?.chart?.lineData || [];
  const length = { "1M": 1, "6M": 6, "1Y": 12 }[timeRange];
  const data = length ? all.slice(-length) : all;
  const rangeLabel = data.length > 1 ? `${data[0].month} – ${data.at(-1).month}` : data[0]?.month || "No history";
  const balance = netWorthData?.recordedBalance || 0;
  return <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-bold text-slate-900">Balance history</h2><p className="mt-1 text-xs text-slate-500">{rangeLabel}</p></div>
      <div role="group" aria-label="Balance history range" className="flex rounded-xl bg-slate-100 p-1 text-[11px] font-semibold">
        {["1M", "6M", "1Y", "ALL"].map((range) => <button type="button" key={range} aria-pressed={timeRange === range} onClick={() => setTimeRange(range)} className={`rounded-lg px-2.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${timeRange === range ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}>{range}</button>)}
      </div>
    </div>
    <div className="mt-5 h-[200px] min-w-0">
      {!netWorthData?.chart?.hasData ? <p className="flex h-full items-center justify-center text-sm text-slate-500">No transaction history through this month.</p> : <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 5, bottom: 0 }}>
          <defs><linearGradient id="recordedBalanceGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Recorded balance"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fill="url(#recordedBalanceGradient)" dot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>}
    </div>
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <div><p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Wallet size={14} className="text-indigo-500" />Recorded balance</p><p className="mt-1 text-[11px] text-slate-400">Through {netWorthData?.monthLabel}</p></div>
      <p className={`text-xl font-bold ${balance < 0 ? "text-rose-600" : "text-slate-900"}`}>₹{Math.round(balance).toLocaleString("en-IN")}</p>
    </div>
    <p className="mt-2 text-[11px] text-slate-400">Cumulative recorded income minus expenses. Opening balances and asset valuations are not included.</p>
  </section>;
}
