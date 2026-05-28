"use client";

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

function BreakdownRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] text-gray-600 truncate">{label}</span>
      </div>
      <span className="text-[11px] font-semibold text-gray-900 whitespace-nowrap">{value}</span>
    </div>
  );
}

export default function NetWorthSection({ netWorthData }) {
  const chart = netWorthData?.chart ?? {
    lineData: [],
    growthPct: 0,
    rangeLabel: "No history yet",
    hasData: false,
  };
  const breakdown = netWorthData?.breakdown ?? {
    assets: [],
    liabilities: [],
    breakdownSegments: [],
    hasData: false,
  };

  const growthLabel =
    chart.growthPct >= 0
      ? `+${chart.growthPct.toFixed(1)}%`
      : `${chart.growthPct.toFixed(1)}%`;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-0 min-h-[260px]">
        <div className="flex-[1.6] min-w-0 flex flex-col pr-0 lg:pr-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Net Worth Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">{chart.rangeLabel}</p>
            </div>
            {chart.hasData && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                  chart.growthPct >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
                }`}
              >
                {growthLabel}
              </span>
            )}
          </div>

          <div className="flex-1 min-h-[200px] w-full mt-2">
            {chart.lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <AreaChart data={chart.lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis hide domain={["dataMin - 100000", "dataMax + 50000"]} />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Net Worth"]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7B61FF"
                    strokeWidth={2.5}
                    fill="url(#netWorthGrad)"
                    dot={{ r: 4, fill: "#7B61FF", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: "#7B61FF" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full min-h-[200px] flex items-center justify-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
                <p className="text-sm text-gray-500 px-4 text-center">
                  Add transactions or complete onboarding to see net worth trends.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-[220px] border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-5 mt-4 lg:mt-0 flex flex-col">
          <h3 className="text-[15px] font-bold text-gray-900 mb-4">Net Worth Breakdown</h3>

          {breakdown.hasData ? (
            <div className="flex items-start gap-4 flex-1">
              <div className="w-[72px] h-[72px] shrink-0">
                <ResponsiveContainer width={72} height={72}>
                  <PieChart>
                    <Pie
                      data={breakdown.breakdownSegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={34}
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

              <div className="flex-1 min-w-0 space-y-0.5">
                {breakdown.assets.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Assets
                    </p>
                    {breakdown.assets.map((item) => (
                      <BreakdownRow
                        key={item.label}
                        label={item.label}
                        value={item.valueFormatted}
                        color={item.color}
                      />
                    ))}
                  </>
                )}

                {breakdown.liabilities.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-1.5">
                      Liabilities
                    </p>
                    {breakdown.liabilities.map((item) => (
                      <BreakdownRow
                        key={item.label}
                        label={item.label}
                        value={item.valueFormatted}
                        color={item.color}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-xl bg-gray-50 border border-dashed border-gray-200 p-4">
              <p className="text-xs text-gray-500 text-center">
                No assets or liabilities recorded yet. Complete onboarding to populate this breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
