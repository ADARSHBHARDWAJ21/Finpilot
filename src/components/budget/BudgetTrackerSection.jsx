"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Calendar,
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  Home,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  Heart,
  MoreHorizontal,
  Lightbulb,
  Plus,
  FolderOpen,
  BarChart3,
  Download,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from "recharts";

const tabs = ["Overview", "Budget vs Actual", "Categories", "Goals", "Insights"];

const summaryCards = [
  {
    label: "Total Monthly Budget",
    value: "₹80,000",
    sub: "May 2024",
    icon: Wallet,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    label: "Total Spent",
    value: "₹52,430",
    sub: "65.5% of budget",
    icon: Receipt,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    label: "Remaining Budget",
    value: "₹27,570",
    sub: "34.5% left",
    icon: PiggyBank,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Savings This Month",
    value: "₹12,340",
    sub: "15.4% of income",
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Avg. Monthly Savings",
    value: "₹11,250",
    sub: "14.2% of income",
    icon: TrendingUp,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const spendingTrend = [
  { month: "Apr '24", actual: 48500, budget: 80000 },
  { month: "May '24", actual: 52430, budget: 80000 },
  { month: "Jun '24", actual: 0, budget: 80000 },
  { month: "Jul '24", actual: 0, budget: 80000 },
  { month: "Aug '24", actual: 0, budget: 80000 },
  { month: "Sep '24", actual: 0, budget: 80000 },
  { month: "Oct '24", actual: 0, budget: 80000 },
  { month: "Nov '24", actual: 0, budget: 80000 },
  { month: "Dec '24", actual: 0, budget: 80000 },
  { month: "Jan '25", actual: 0, budget: 80000 },
  { month: "Feb '25", actual: 0, budget: 80000 },
  { month: "Mar '25", actual: 0, budget: 80000 },
];

const budgetCategories = [
  {
    name: "Housing",
    icon: Home,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    budget: 25000,
    spent: 25000,
    status: "On Track",
    statusStyle: "bg-emerald-50 text-emerald-700",
    barColor: "bg-emerald-500",
  },
  {
    name: "Food & Dining",
    icon: Utensils,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    budget: 12000,
    spent: 9600,
    status: "Near Limit",
    statusStyle: "bg-orange-50 text-orange-600",
    barColor: "bg-orange-500",
  },
  {
    name: "Transport",
    icon: Car,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    budget: 8000,
    spent: 6560,
    status: "Near Limit",
    statusStyle: "bg-orange-50 text-orange-600",
    barColor: "bg-orange-500",
  },
  {
    name: "Shopping",
    icon: ShoppingBag,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
    budget: 10000,
    spent: 9800,
    status: "Near Limit",
    statusStyle: "bg-orange-50 text-orange-600",
    barColor: "bg-red-500",
  },
  {
    name: "Entertainment",
    icon: Film,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    budget: 6000,
    spent: 3200,
    status: "On Track",
    statusStyle: "bg-emerald-50 text-emerald-700",
    barColor: "bg-emerald-500",
  },
  {
    name: "Utilities",
    icon: Zap,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    budget: 5000,
    spent: 4200,
    status: "On Track",
    statusStyle: "bg-emerald-50 text-emerald-700",
    barColor: "bg-emerald-500",
  },
  {
    name: "Healthcare",
    icon: Heart,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    budget: 5000,
    spent: 2870,
    status: "On Track",
    statusStyle: "bg-emerald-50 text-emerald-700",
    barColor: "bg-emerald-500",
  },
  {
    name: "Others",
    icon: MoreHorizontal,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    budget: 9000,
    spent: 1200,
    status: "On Track",
    statusStyle: "bg-emerald-50 text-emerald-700",
    barColor: "bg-emerald-500",
  },
];

const overspentCategories = [
  { name: "Shopping", pct: 98 },
  { name: "Food & Dining", pct: 80 },
  { name: "Transport", pct: 82 },
];

const quickActions = [
  { label: "Add Budget", icon: Plus },
  { label: "Manage Categories", icon: FolderOpen },
  { label: "Budget Planner", icon: BarChart3 },
  { label: "Download Report", icon: Download },
];

function BudgetHealthRing({ score }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="100" height="100" className="-rotate-90">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#6366f1"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function BudgetTrackerSection() {
  const [activeTab, setActiveTab] = useState("Overview");
  const spent = 52430;
  const totalBudget = 80000;
  const remaining = totalBudget - spent;
  const spentPct = 65.5;

  const donutData = [
    { name: "Spent", value: spent, color: "#6366f1" },
    { name: "Remaining", value: remaining, color: "#22c55e" },
  ];

  return (
    <div className="max-w-[1500px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track spending, set budgets and achieve your financial goals.
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
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              RS
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Rahul Sharma</p>
              <p className="text-[11px] text-gray-500">Individual</p>
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
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "text-indigo-600 border-indigo-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-5 min-w-0">
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Budget Overview donut */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Budget Overview</h2>
              <div className="flex flex-col items-center">
                <div className="relative w-[200px] h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-bold text-gray-900">{spentPct}%</p>
                    <p className="text-xs text-gray-500">Spent</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-gray-600">Spent</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-gray-600">Remaining</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-3">
                  Total Budget: ₹{totalBudget.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Spending Trend */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Spending Trend</h2>
                <button
                  type="button"
                  suppressHydrationWarning
                  className="text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                >
                  Monthly
                  <ChevronDown size={12} />
                </button>
              </div>
              <div className="h-[220px] min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <ComposedChart data={spendingTrend} barGap={2}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 9, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
                      contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 11 }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="actual" name="Actual" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="budget"
                      name="Budget"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Budget by Category table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Budget by Category</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-50 bg-gray-50/50">
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Budget</th>
                    <th className="px-3 py-3 font-medium">Spent</th>
                    <th className="px-3 py-3 font-medium">Remaining</th>
                    <th className="px-3 py-3 font-medium min-w-[140px]">Progress</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium w-12" />
                  </tr>
                </thead>
                <tbody>
                  {budgetCategories.map((cat) => {
                    const Icon = cat.icon;
                    const pct = Math.round((cat.spent / cat.budget) * 100);
                    const remainingAmt = cat.budget - cat.spent;
                    return (
                      <tr
                        key={cat.name}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg ${cat.iconBg} flex items-center justify-center shrink-0`}
                            >
                              <Icon size={14} className={cat.iconColor} />
                            </div>
                            <span className="font-medium text-gray-900">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-gray-700">
                          ₹{cat.budget.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-3.5 text-gray-700">
                          ₹{cat.spent.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-3.5 text-gray-700">
                          ₹{remainingAmt.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                              <div
                                className={`h-full rounded-full ${cat.barColor}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-1 rounded-md ${cat.statusStyle}`}
                          >
                            {cat.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            suppressHydrationWarning
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                          >
                            <MoreHorizontal size={16} className="text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 text-left">
              Budget Health Score
            </h3>
            <div className="relative inline-block">
              <BudgetHealthRing score={78} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">78</span>
                <span className="text-xs text-gray-400">/100</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-emerald-600 mt-3">Good. You&apos;re on track!</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Overspent Categories</h3>
            <ul className="space-y-3">
              {overspentCategories.map((item) => (
                <li key={item.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{item.name}</span>
                    <span className="text-red-500 font-semibold">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              suppressHydrationWarning
              className="mt-4 w-full py-2 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
            >
              View All Insights
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <ul className="space-y-0.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <li key={action.label}>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className="w-full flex items-center gap-2.5 py-2.5 px-1 rounded-lg hover:bg-gray-50 text-left group"
                    >
                      <Icon size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">{action.label}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-amber-50/80 rounded-xl border border-amber-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Lightbulb size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 mb-1">Budget Tip</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  You can save ₹2,340 by reducing shopping expenses by 10% this month.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
