"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Calendar,
  Wallet,
  FileText,
  Receipt,
  Shield,
  Download,
  ChevronRight,
  Lock,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Target,
  ArrowUpRight,
  Scale,
  PiggyBank,
  Landmark,
  FileBarChart,
  ClipboardList,
} from "lucide-react";
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const tabs = [
  "Tax Summary",
  "Income & Tax",
  "Deductions",
  "Investments",
  "TDS & Payments",
  "Compliance",
  "Comparisons",
  "Download Center",
];

const metricCards = [
  {
    label: "Annual Income",
    value: "₹13,00,000",
    sub: "Total Gross Income",
    icon: Wallet,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    label: "Gross Total Income",
    value: "₹12,41,200",
    sub: "After Exemptions",
    icon: FileText,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Total Deductions",
    value: "₹2,15,000",
    sub: "42% of Eligible",
    icon: Receipt,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Total Tax Liability",
    value: "₹78,420",
    sub: "Includes cess & surcharge",
    icon: Shield,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    label: "Expected Refund",
    value: "₹43,880",
    sub: "Processing after filing",
    icon: FileText,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-600",
  },
];

const monthlyData = [
  { month: "Apr '24", liability: 5200, tds: 4800, refund: 400 },
  { month: "May '24", liability: 6100, tds: 5800, refund: 300 },
  { month: "Jun '24", liability: 5800, tds: 6200, refund: -400 },
  { month: "Jul '24", liability: 6500, tds: 6000, refund: 500 },
  { month: "Aug '24", liability: 6200, tds: 6400, refund: -200 },
  { month: "Sep '24", liability: 6800, tds: 6500, refund: 300 },
  { month: "Oct '24", liability: 7100, tds: 7000, refund: 100 },
  { month: "Nov '24", liability: 6900, tds: 7200, refund: -300 },
  { month: "Dec '24", liability: 7400, tds: 7100, refund: 300 },
  { month: "Jan '25", liability: 7600, tds: 7500, refund: 100 },
  { month: "Feb '25", liability: 7200, tds: 7800, refund: -600 },
  { month: "Mar '25", liability: 8020, tds: 7600, refund: 420 },
];

const taxBreakdown = [
  { name: "Income Tax", value: 67510, pct: 86.1, color: "#6366f1" },
  { name: "Surcharge", value: 8078, pct: 10.3, color: "#a78bfa" },
  { name: "Health & Education Cess", value: 2832, pct: 3.6, color: "#c4b5fd" },
];

const quickActions = [
  { label: "Download Tax Summary", icon: Download },
  { label: "View Form 16", icon: FileText },
  { label: "Tax Projection Report", icon: TrendingUp },
  { label: "Old vs New Regime Report", icon: Scale },
  { label: "Investment Proof Report", icon: PiggyBank },
];

const reportsLibrary = [
  {
    title: "Income & Tax Report",
    desc: "Detailed income breakdown by source",
    date: "8 May 2024",
    icon: Landmark,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    title: "Deductions Summary",
    desc: "80C, 80D, HRA and other claims",
    date: "8 May 2024",
    icon: Receipt,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Investment Report",
    desc: "ELSS, PPF, NPS and capital gains",
    date: "7 May 2024",
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "TDS & Payments",
    desc: "TDS credits and advance tax paid",
    date: "7 May 2024",
    icon: FileBarChart,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    title: "Compliance Checklist",
    desc: "Filing status and pending actions",
    date: "6 May 2024",
    icon: ClipboardList,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    title: "Regime Comparison",
    desc: "Old vs new regime side-by-side",
    date: "6 May 2024",
    icon: Scale,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    title: "Annual Tax Summary",
    desc: "Complete FY tax overview PDF",
    date: "5 May 2024",
    icon: FileText,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    title: "Form 16 Consolidated",
    desc: "All employers combined",
    date: "5 May 2024",
    icon: FileText,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const highlights = [
  {
    text: "You save ₹21,340 by choosing Old Tax Regime",
    icon: ArrowUpRight,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    text: "80C limit: ₹62,000 still available to invest",
    icon: BarChart3,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    text: "NPS (80CCD) can save you ₹7,500 more",
    icon: Shield,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    text: "HRA exemption may be underutilized by ₹18,000",
    icon: Target,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

export default function ReportsSection() {
  const [activeTab, setActiveTab] = useState("Tax Summary");

  return (
    <div className="max-w-[1500px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            All your tax insights and summaries in one place.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            suppressHydrationWarning
            className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
          >
            <Calendar size={16} className="text-gray-500" />
            FY 2024-25
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="relative w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          >
            <Bell size={18} className="text-gray-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              RS
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Rahul Sharma</p>
              <p className="text-[11px] text-gray-500">₹13,00,000 CTC</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 mb-6 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            suppressHydrationWarning
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
              activeTab === tab
                ? "text-indigo-600 border-indigo-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p
                    className={`text-xl font-bold mt-1 ${card.valueColor || "text-gray-900"}`}
                  >
                    {card.value}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{card.sub}</p>
                </div>
                <div
                  className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon size={16} className={card.iconColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px_220px] gap-4 mb-6">
        {/* Tax Liability Overview */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Tax Liability Overview</h2>
            <button
              type="button"
              suppressHydrationWarning
              className="text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-1"
            >
              Monthly View
              <ChevronDown size={12} />
            </button>
          </div>
          <div className="h-[240px] min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <ComposedChart data={monthlyData} barGap={2} barCategoryGap="18%">
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                <Bar
                  dataKey="liability"
                  name="Tax Liability"
                  fill="#6366f1"
                  radius={[3, 3, 0, 0]}
                />
                <Bar dataKey="tds" name="TDS Paid" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="refund"
                  name="Refund / (Payable)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "#fff", stroke: "#f59e0b", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tax Breakdown donut */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Tax Breakdown</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-[180px] h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taxBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {taxBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-lg font-bold text-gray-900">₹78,420</p>
                <p className="text-[10px] text-gray-400">Total Tax</p>
              </div>
            </div>
            <ul className="w-full mt-4 space-y-2">
              {taxBreakdown.map((item) => (
                <li key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-gray-500 font-medium">{item.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-fit">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <ul className="space-y-0.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.label}>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="w-full flex items-center gap-2.5 py-2 px-1 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                  >
                    <Icon size={15} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 flex-1 leading-snug">{action.label}</span>
                    <ChevronRight
                      size={14}
                      className="text-gray-300 group-hover:text-gray-500 shrink-0"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            suppressHydrationWarning
            className="mt-4 w-full py-2 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
          >
            View All Reports
          </button>
        </div>
      </div>

      {/* Reports Library + Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Reports Library</h2>
            <a href="#" className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-0.5">
              View All
              <ChevronRight size={16} />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reportsLibrary.map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.title}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${report.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={18} className={report.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{report.desc}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-gray-400">
                          Generated on {report.date}
                        </p>
                        <ChevronRight
                          size={14}
                          className="text-gray-300 group-hover:text-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Highlights</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            {highlights.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100/80"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={15} className={item.iconColor} />
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pt-1">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-gray-100 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <Lock size={14} />
          All reports are based on your uploaded data and Indian tax rules.
        </span>
        <span className="flex items-center gap-1.5">
          <RefreshCw size={14} />
          Data last updated on 10 May 2024
        </span>
      </footer>
    </div>
  );
}
