"use client";

import { useState } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";
import { ChartNoAxesCombined } from "lucide-react";

export default function NetWorthSection({ netWorthData }) {
  const [timeRange, setTimeRange] = useState("6M");
  const all = netWorthData?.chart?.lineData || [];
  const length = { "1M": 1, "6M": 6, "1Y": 12 }[timeRange];
  const data = length ? all.slice(-length) : all;
  const rangeLabel = data.length > 1 ? `${data[0].month} – ${data.at(-1).month}` : data[0]?.month || "No history";
  const balance = netWorthData?.recordedBalance || 0;
  return <section className="h-full min-w-0 rounded-[20px] border border-border bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold tracking-tight text-foreground">Balance history</h2><p className="mt-1 text-xs text-muted-foreground">{rangeLabel}</p></div>
      <div role="group" aria-label="Balance history range" className="flex rounded-lg bg-background p-1 text-[11px] font-medium">
        {["1M", "6M", "1Y", "ALL"].map((range) => <button type="button" key={range} aria-pressed={timeRange === range} onClick={() => setTimeRange(range)} className={`rounded-md px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${timeRange === range ? "bg-white text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>{range}</button>)}
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p className={`text-[30px] font-semibold tracking-[-0.04em] tabular-nums ${balance < 0 ? "text-[#a5624d]" : "text-foreground"}`}>₹{Math.round(balance).toLocaleString("en-IN")}</p>
      <p className="text-xs text-muted-foreground">Recorded balance</p>
    </div>
    <div className="mt-4 h-[200px] min-w-0">
      {!netWorthData?.chart?.hasData ? <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/50 px-6 text-center"><ChartNoAxesCombined size={27} strokeWidth={1.5} className="mb-3 text-primary/45" /><p className="text-sm text-muted-foreground">Your balance story starts here.</p><p className="mt-1 text-xs text-muted-foreground">Add transactions to see your history.</p></div> : <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 5, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e9eee8" strokeDasharray="3 5" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#738078" }} tickLine={false} axisLine={false} minTickGap={20} tickMargin={10} />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Recorded balance"]} contentStyle={{ borderRadius: 12, border: "1px solid #dfe5dc", fontSize: 12, boxShadow: "none" }} />
          <Area type="monotone" dataKey="value" stroke="#214d43" strokeWidth={2.5} fill="#edf2eb" dot={data.length === 1 ? { r: 4, fill: "#214d43" } : false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>}
    </div>
    <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">Through {netWorthData?.monthLabel}. Recorded income minus expenses; excludes opening balances and asset valuations.</p>
  </section>;
}
