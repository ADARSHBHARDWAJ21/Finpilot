"use client";

import { useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, ShieldCheck, PieChart as PieIcon } from "lucide-react";

function BreakdownRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: color }} />
        <span className="text-xs text-slate-600 font-medium truncate">{label}</span>
      </div>
      <span className="text-xs font-bold text-slate-900 whitespace-nowrap">{value}</span>
    </div>
  );
}

export default function NetWorthSection({ netWorthData }) {
  const [timeRange, setTimeRange] = useState("6M");

  const chart = netWorthData?.chart ?? {
    lineData: [],
    growthPct: 0,
    rangeLabel: "Last 6 Months",
    hasData: false,
  };
  const breakdown = netWorthData?.breakdown ?? {
    assets: [],
    liabilities: [],
    breakdownSegments: [],
    hasData: false,
  };

  // Mock sample trend curve if empty so user has an aesthetic preview
  const displayChartData =
    chart.lineData.length > 0
      ? chart.lineData
      : [
          { month: "Jan", value: 3400000 },
          { month: "Feb", value: 3580000 },
          { month: "Mar", value: 3720000 },
          { month: "Apr", value: 3890000 },
          { month: "May", value: 4120000 },
          { month: "Jun", value: 4280000 },
        ];

  const hasRealData = chart.hasData || chart.lineData.length > 0;
  const growthPct = chart.growthPct || 14.8;
  const growthLabel = growthPct >= 0 ? `+${growthPct.toFixed(1)}%` : `${growthPct.toFixed(1)}%`;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row gap-0 min-h-[270px]">
        {/* Left: Trend Chart */}
        <div className="flex-[1.6] min-w-0 flex flex-col pr-0 lg:pr-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Net Worth Growth
                </h2>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    growthPct >= 0
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                      : "text-rose-700 bg-rose-50 border border-rose-200"
                  }`}
                >
                  <TrendingUp size={12} />
                  {growthLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {chart.rangeLabel || "Tracking assets minus total debts"}
              </p>
            </div>

            {/* Timeframe pill selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-semibold text-slate-500">
              {["1M", "6M", "1Y", "ALL"].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-0.5 rounded-lg transition-all ${
                    timeRange === range
                      ? "bg-white text-indigo-700 font-bold shadow-2xs"
                      : "hover:text-slate-900"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[210px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%" minHeight={210}>
              <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />
                <YAxis hide domain={["dataMin - 100000", "dataMax + 100000"]} />
                <Tooltip
                  formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Net Worth"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    fontWeight: 600,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fill="url(#netWorthGrad)"
                  dot={{ r: 4, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Asset & Liability Breakdown */}
        <div className="flex-1 min-w-[230px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 mt-4 lg:mt-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <PieIcon size={15} className="text-indigo-600" />
                Asset Allocation
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Distribution
              </span>
            </div>

            {breakdown.hasData ? (
              <div className="flex items-start gap-4">
                <div className="w-[76px] h-[76px] shrink-0">
                  <ResponsiveContainer width={76} height={76}>
                    <PieChart>
                      <Pie
                        data={breakdown.breakdownSegments}
                        cx="50%"
                        cy="50%"
                        innerRadius={24}
                        outerRadius={36}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {breakdown.breakdownSegments.map((seg) => (
                          <Cell key={seg.name} fill={seg.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {breakdown.assets.map((item) => (
                    <BreakdownRow
                      key={item.label}
                      label={item.label}
                      value={item.valueFormatted}
                      color={item.color}
                    />
                  ))}
                  {breakdown.liabilities.map((item) => (
                    <BreakdownRow
                      key={item.label}
                      label={item.label}
                      value={item.valueFormatted}
                      color={item.color}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <BreakdownRow label="Mutual Funds & Stocks" value="₹24,50,000" color="#4f46e5" />
                <BreakdownRow label="EPF & PPF" value="₹12,80,000" color="#10b981" />
                <BreakdownRow label="Liquid Bank & FDs" value="₹8,50,000" color="#06b6d4" />
                <BreakdownRow label="Home / Auto Loans" value="-₹3,00,000" color="#ef4444" />
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <ShieldCheck size={14} className="text-emerald-600" />
              Healthy Debt Ratio: 6.9%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
