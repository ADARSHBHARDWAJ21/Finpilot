"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Download,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ClientOnly from "@/components/budget/ClientOnly";

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

export default function TaxLiabilityTrackerSection({ data }) {
  const progressData = [
    { name: "Paid", value: data.totalTaxPaid, color: "#22c55e" },
    { name: "Remaining", value: Math.max(0, data.estimatedTax - data.totalTaxPaid), color: "#fb923c" },
  ];

  return (
    <div className="w-full max-w-[1600px] min-w-0">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[40px] leading-none font-extrabold text-gray-900 tracking-tight">Tax Liability Tracker</h1>
          <p className="text-sm text-gray-500 mt-2">
            Track your tax liability, advance tax, TDS, and other income in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Download Report
          </button>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <CalendarDays size={16} />
            Tax Calendar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Estimated Tax Liability</p>
          <p className="text-4xl font-bold text-orange-600 mt-1">{formatInr(data.estimatedTax)}</p>
          <p className="text-xs text-gray-500 mt-1">for FY {data.financialYear}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Total Tax Paid (TDS + Advance)</p>
          <p className="text-4xl font-bold text-emerald-600 mt-1">{formatInr(data.totalTaxPaid)}</p>
          <p className="text-xs text-gray-500 mt-1">{data.paidPercent}% of estimated liability</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Tax Payable / (Refund)</p>
          <p className="text-4xl font-bold text-blue-600 mt-1">{formatInr(data.taxPayable || data.refund)}</p>
          <p className="text-xs text-blue-600 mt-1">{data.taxPayable > 0 ? "You may pay extra" : "Estimated refund"}</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Effective Tax Rate</p>
          <p className="text-4xl font-bold text-purple-600 mt-1">{data.effectiveTaxRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">On taxable income</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-6 text-sm">
              <span className="font-semibold text-orange-500 border-b-2 border-orange-500 pb-1">Overview</span>
              <span className="text-gray-500">Income Breakdown</span>
              <span className="text-gray-500">Tax Details</span>
              <span className="text-gray-500">TDS Analysis</span>
              <span className="text-gray-500">Advance Tax</span>
              <span className="text-gray-500">Exemptions</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tax Liability Progress</h3>
              <div className="h-[220px]">
                <ClientOnly fallback={<div className="h-full bg-gray-50 rounded-xl" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={progressData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={2}>
                        {progressData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatInr(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <p>Tax Paid (TDS + Advance): <span className="font-semibold text-gray-900">{formatInr(data.totalTaxPaid)}</span></p>
                <p>Remaining Tax Payable: <span className="font-semibold text-gray-900">{formatInr(data.taxPayable)}</span></p>
                <p>Estimated Tax Liability: <span className="font-semibold text-gray-900">{formatInr(data.estimatedTax)}</span></p>
              </div>
              <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                Great! You&apos;ve almost covered your tax liability.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Tax Liability Over Time</h3>
                <span className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">FY {data.financialYear}</span>
              </div>
              <div className="h-[290px]">
                <ClientOnly fallback={<div className="h-full bg-gray-50 rounded-xl" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trend}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => formatInr(v)} />
                      <Area type="monotone" dataKey="paid" stroke="#22c55e" fill="#bbf7d0" strokeWidth={2} />
                      <Line type="monotone" dataKey="estimated" stroke="#f97316" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="projection" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tax Components</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-gray-600">1. Gross Total Income</span><span className="font-semibold">{formatInr(data.annualCtc + data.sideIncome)}</span></li>
                <li className="flex justify-between"><span className="text-gray-600">2. Deductions & Exemptions</span><span className="font-semibold">-{formatInr(Math.max(0, data.annualCtc + data.sideIncome - data.taxableIncome))}</span></li>
                <li className="flex justify-between"><span className="text-gray-600">3. Taxable Income</span><span className="font-semibold">{formatInr(data.taxableIncome)}</span></li>
                <li className="flex justify-between"><span className="text-gray-600">4. Tax on Total Income</span><span className="font-semibold">{formatInr(data.taxOnIncome)}</span></li>
                <li className="flex justify-between"><span className="text-gray-600">5. Health & Education Cess (4%)</span><span className="font-semibold">{formatInr(data.cess)}</span></li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                <span className="font-semibold text-orange-600">Total Tax Liability</span>
                <span className="font-bold text-orange-600">{formatInr(data.estimatedTax)}</span>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tax Paid Details</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-gray-600">TDS from Salary</span><span className="font-semibold">{formatInr(data.totalTds)}</span></li>
                <li className="flex justify-between"><span className="text-gray-600">Advance Tax Paid</span><span className="font-semibold">{formatInr(data.advanceTaxPaid)}</span></li>
                <li className="flex justify-between"><span className="text-gray-600">Self Assessment Tax</span><span className="font-semibold">₹0</span></li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                <span className="font-semibold text-gray-900">Total Tax Paid</span>
                <span className="font-bold text-emerald-600">{formatInr(data.totalTaxPaid)}</span>
              </div>
              <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                You have paid {data.paidPercent}% of your total tax liability. Well done!
              </p>
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Schedule (Advance Tax)</h3>
              <ul className="space-y-2 text-sm">
                <li className="grid grid-cols-4 text-gray-500 text-xs font-semibold">
                  <span>Installment</span>
                  <span>Due Date</span>
                  <span>Amount</span>
                  <span>Status</span>
                </li>
                {(data.advanceTaxSchedule ?? []).map((row) => (
                  <li key={row.label} className="grid grid-cols-4 text-xs">
                    <span>{row.label}</span>
                    <span>{row.dueDate}</span>
                    <span>{formatInr(row.target)}</span>
                    <span className={row.status === "Paid" ? "text-emerald-600 font-semibold" : "text-orange-600 font-semibold"}>
                      {row.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

          </div>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Income Sources Included</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.components.map((c) => (
                <div key={c.label} className="border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatInr(c.value)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Make sure to include all your income sources to get an accurate tax estimate.
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">AI Tax Assistant</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">Beta</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Here are a few insights for you</p>
            {data.taxPayable > 0 ? (
              <div className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 flex items-center justify-between mb-3">
                <span>You may pay extra {formatInr(data.taxPayable)} if no action is taken before year end.</span>
                <TriangleAlert size={14} className="shrink-0" />
              </div>
            ) : (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center justify-between mb-3">
                <span>You are on track for an estimated refund of {formatInr(data.refund)}.</span>
                <Sparkles size={14} className="shrink-0" />
              </div>
            )}
            <p className="text-sm font-semibold text-gray-800 mb-2">What would you like to know?</p>
            {[
              "How can I reduce my tax liability?",
              "Should I invest more in 80C?",
              "Will I get a refund this year?",
              "How is my TDS calculated?",
            ].map((q) => (
              <button key={q} type="button" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 mb-2 flex items-center justify-between">
                <span>{q}</span>
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            ))}
            <Link href="/taxation/ai-copilot" className="mt-1 block text-xs text-indigo-600 hover:underline">
              Ask anything about your taxes...
            </Link>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Important Deadlines</h3>
            <ul className="space-y-3 text-sm">
              {data.deadlines.map((d) => (
                <li key={d.label} className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-800">{d.label}</p>
                    {d.sub ? <p className="text-xs text-orange-600">{d.sub}</p> : null}
                  </div>
                  <span className="text-gray-600 text-right">{d.due}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tax Regime</h3>
            <p className="text-orange-600 font-semibold capitalize">{data.preferredRegime} Regime</p>
            <p className="text-xs text-gray-500 mt-2">
              Based on your profile, {String(data.preferredRegime).toLowerCase() === "old" ? "Old" : "New"} Regime is better for you.
            </p>
            <Link href="/taxation/compare-regimes" className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
              Change Regime <ChevronRight size={12} />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

