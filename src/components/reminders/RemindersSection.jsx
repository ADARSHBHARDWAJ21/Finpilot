"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Filter,
  MoreHorizontal,
  Clock,
  Check,
  Upload,
  PiggyBank,
  CreditCard,
  Sparkles,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const summaryCards = [
  {
    label: "Pending Actions",
    value: "12",
    sub: "4 high priority",
    icon: Bell,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    label: "Due This Week",
    value: "4",
    sub: "2 high priority",
    icon: Calendar,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Overdue",
    value: "2",
    sub: "Action required",
    icon: Bell,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    label: "Completed This Month",
    value: "18",
    sub: "+6 vs last month",
    subGreen: true,
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

const filterTabs = [
  { id: "all", label: "All" },
  { id: "high", label: "High Priority", count: 4 },
  { id: "tax", label: "Tax", count: 4 },
  { id: "investments", label: "Investments", count: 2 },
  { id: "bills", label: "Bills", count: 1 },
  { id: "completed", label: "Completed" },
];

const tasks = [
  {
    id: 1,
    title: "Advance Tax (Q1) Payment",
    sub: "Pay advance tax for Apr – Jun quarter",
    category: "Tax",
    categoryStyle: "bg-blue-50 text-blue-700",
    dueDate: "15 May 2024",
    daysLeft: "5 days left",
    daysUrgent: true,
    priority: "High",
    priorityStyle: "bg-red-50 text-red-600",
    impact: "Save ₹0 (Avoid penalty)",
    impactNeutral: true,
    icon: Bell,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    filter: ["all", "high", "tax"],
  },
  {
    id: 2,
    title: "Upload Rent Receipts",
    sub: "Upload Apr 2024 rent receipt for HRA",
    category: "Tax",
    categoryStyle: "bg-blue-50 text-blue-700",
    dueDate: "18 May 2024",
    daysLeft: "8 days left",
    daysUrgent: true,
    priority: "High",
    priorityStyle: "bg-red-50 text-red-600",
    impact: "Save up to ₹18,000",
    icon: Upload,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    filter: ["all", "high", "tax"],
  },
  {
    id: 3,
    title: "ELSS Investment",
    sub: "Complete 80C investment before deadline",
    category: "Investments",
    categoryStyle: "bg-emerald-50 text-emerald-700",
    dueDate: "25 May 2024",
    daysLeft: "15 days left",
    daysWarning: true,
    priority: "Medium",
    priorityStyle: "bg-orange-50 text-orange-600",
    impact: "Save up to ₹15,600",
    icon: PiggyBank,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    filter: ["all", "investments"],
  },
  {
    id: 4,
    title: "Review Form 16",
    sub: "Verify TDS details with employer",
    category: "Tax",
    categoryStyle: "bg-blue-50 text-blue-700",
    dueDate: "31 May 2024",
    daysLeft: "21 days left",
    priority: "Medium",
    priorityStyle: "bg-orange-50 text-orange-600",
    impact: "Avoid mismatch in ITR",
    impactNeutral: true,
    icon: Calendar,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    filter: ["all", "tax"],
  },
  {
    id: 5,
    title: "Credit Card Payment",
    sub: "HDFC Credit Card **** 1234",
    category: "Bills",
    categoryStyle: "bg-amber-50 text-amber-700",
    dueDate: "28 May 2024",
    daysLeft: "18 days left",
    priority: "Low",
    priorityStyle: "bg-gray-100 text-gray-600",
    impact: "Avoid late fee",
    impactNeutral: true,
    icon: CreditCard,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    filter: ["all", "bills"],
  },
];

const timelineNodes = [
  {
    date: "15 MAY",
    title: "Advance Tax (Q1)",
    desc: "Pay advance tax",
    days: "5 days left",
    color: "border-red-500 text-red-600",
    badge: "bg-red-100 text-red-600",
  },
  {
    date: "18 MAY",
    title: "Rent Receipts",
    desc: "Upload for HRA",
    days: "8 days left",
    color: "border-orange-500 text-orange-600",
    badge: "bg-orange-100 text-orange-600",
  },
  {
    date: "25 MAY",
    title: "ELSS Investment",
    desc: "80C deadline",
    days: "15 days left",
    color: "border-purple-500 text-purple-600",
    badge: "bg-purple-100 text-purple-600",
  },
  {
    date: "28 MAY",
    title: "Credit Card",
    desc: "Payment due",
    days: "18 days left",
    color: "border-blue-500 text-blue-600",
    badge: "bg-blue-100 text-blue-600",
  },
  {
    date: "31 MAY",
    title: "Form 16 Review",
    desc: "Verify TDS",
    days: "21 days left",
    color: "border-amber-500 text-amber-600",
    badge: "bg-amber-100 text-amber-600",
  },
];

const aiSuggestions = [
  { text: "Invest in ELSS under 80C", save: "₹15,600" },
  { text: "Upload rent receipts for HRA", save: "₹18,000" },
  { text: "Pay Advance Tax on time", save: "₹0 penalty" },
];

const upcomingWeek = [
  {
    day: "15",
    month: "MAY",
    title: "Advance Tax (Q1)",
    due: "Due in 5 days",
    priority: "High",
    priorityStyle: "bg-red-50 text-red-600",
    dateColor: "text-red-600",
  },
  {
    day: "18",
    month: "MAY",
    title: "Upload Rent Receipts",
    due: "Due in 8 days",
    priority: "High",
    priorityStyle: "bg-red-50 text-red-600",
    dateColor: "text-red-600",
  },
  {
    day: "25",
    month: "MAY",
    title: "ELSS Investment",
    due: "Due in 15 days",
    priority: "Medium",
    priorityStyle: "bg-orange-50 text-orange-600",
    dateColor: "text-orange-600",
  },
];

const completionData = [
  { name: "Completed", value: 18, color: "#22c55e" },
  { name: "Pending", value: 12, color: "#6366f1" },
  { name: "Overdue", value: 2, color: "#ef4444" },
];

const completionLegend = [
  { label: "Completed", count: 18, pct: "60%", color: "#22c55e" },
  { label: "Pending", count: 12, pct: "30%", color: "#6366f1" },
  { label: "Overdue", count: 2, pct: "10%", color: "#ef4444" },
];

export default function RemindersSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

  const filteredTasks =
    activeTab === "all"
      ? tasks
      : activeTab === "high"
        ? tasks.filter((t) => t.priority === "High")
        : activeTab === "completed"
          ? []
          : tasks.filter((t) => t.filter.includes(activeTab));

  const displayTasks = filteredTasks.length > 0 ? filteredTasks : tasks;

  return (
    <div className="w-full max-w-[1500px] min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-5 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay on top of important actions and never miss a deadline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0">
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
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Rahul Sharma</p>
              <p className="text-[11px] text-gray-500">Individual</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              RS
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p
                    className={`text-[10px] mt-0.5 ${card.subGreen ? "text-emerald-600 font-medium" : "text-gray-400"}`}
                  >
                    {card.sub}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon size={18} className={card.iconColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Main column */}
        <div className="space-y-5 min-w-0">
          {/* Task table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50">
              <div className="flex items-center gap-1 overflow-x-auto pb-3">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="text-gray-400 font-normal ml-1">({tab.count})</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pb-3 shrink-0">
                <button
                  type="button"
                  suppressHydrationWarning
                  className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  <Filter size={14} />
                  Filter
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  Due Date
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-50 bg-gray-50/50">
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" readOnly />
                    </th>
                    <th className="px-3 py-3 font-medium min-w-[200px]">Task</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Due Date</th>
                    <th className="px-3 py-3 font-medium">Priority</th>
                    <th className="px-3 py-3 font-medium hidden md:table-cell">Potential Impact</th>
                    <th className="px-4 py-3 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTasks.map((task) => {
                    const Icon = task.icon;
                    return (
                      <tr
                        key={task.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <input type="checkbox" className="rounded border-gray-300" readOnly />
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg ${task.iconBg} flex items-center justify-center shrink-0`}
                            >
                              <Icon size={16} className={task.iconColor} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{task.sub}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`text-[10px] font-semibold px-2 py-1 rounded-md ${task.categoryStyle}`}
                          >
                            {task.category}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <p className="text-sm text-gray-900">{task.dueDate}</p>
                          <p
                            className={`text-[10px] mt-0.5 ${
                              task.daysUrgent
                                ? "text-red-500"
                                : task.daysWarning
                                  ? "text-orange-500"
                                  : "text-gray-400"
                            }`}
                          >
                            {task.daysLeft}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`text-[10px] font-semibold px-2 py-1 rounded-md ${task.priorityStyle}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-3 py-4 hidden md:table-cell">
                          <span
                            className={`text-xs font-medium ${
                              task.impactNeutral ? "text-gray-600" : "text-emerald-600"
                            }`}
                          >
                            {task.impact}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              suppressHydrationWarning
                              className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-emerald-600"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              suppressHydrationWarning
                              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                            >
                              <Clock size={16} />
                            </button>
                            <button
                              type="button"
                              suppressHydrationWarning
                              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">Showing 1 to 5 of 12 tasks</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  suppressHydrationWarning
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </button>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium ${
                      page === p
                        ? "bg-indigo-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  suppressHydrationWarning
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  onClick={() => setPage((p) => Math.min(3, p + 1))}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming Timeline</h2>
              <Link
                href="/calendar"
                className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-0.5"
              >
                View Calendar
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="relative flex items-start justify-between gap-2 overflow-x-auto pb-2">
              <div className="absolute top-6 left-8 right-8 h-0.5 bg-gray-200 hidden sm:block" />
              {timelineNodes.map((node, i) => (
                <div key={i} className="flex flex-col items-center min-w-[100px] flex-1 relative z-10">
                  <div
                    className={`w-14 h-14 rounded-full border-2 bg-white flex flex-col items-center justify-center text-center ${node.color}`}
                  >
                    <span className="text-[9px] font-bold leading-tight">{node.date.split(" ")[0]}</span>
                    <span className="text-[8px] font-semibold">{node.date.split(" ")[1]}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 mt-3 text-center">{node.title}</p>
                  <p className="text-[10px] text-gray-500 text-center mt-0.5">{node.desc}</p>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 ${node.badge}`}
                  >
                    {node.days}
                  </span>
                </div>
              ))}
              <div className="flex flex-col items-center min-w-[48px] flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-lg">
                  ···
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          {/* AI Copilot Suggestion */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900 flex-1">AI Copilot Suggestion</h3>
              <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                New
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Complete these 3 pending actions to save up to{" "}
              <strong className="text-gray-900">₹24,500</strong> in taxes.
            </p>
            <ul className="space-y-2 mb-4">
              {aiSuggestions.map((item, i) => (
                <li key={i}>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 text-left group"
                  >
                    <span className="text-xs text-gray-700">{item.text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-600">
                        Save {item.save}
                      </span>
                      <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <Link
              href="/taxation/ai-copilot"
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 transition-colors"
            >
              <MessageCircle size={16} />
              Ask AI Copilot
            </Link>
          </div>

          {/* Upcoming This Week */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Upcoming This Week</h3>
              <a href="#" className="text-xs font-medium text-indigo-600 hover:underline">
                View all
              </a>
            </div>
            <ul className="space-y-3">
              {upcomingWeek.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center shrink-0">
                    <span className={`text-sm font-bold leading-none ${item.dateColor}`}>
                      {item.day}
                    </span>
                    <span className={`text-[8px] font-semibold ${item.dateColor}`}>{item.month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-[10px] text-gray-500">{item.due}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${item.priorityStyle}`}
                  >
                    {item.priority}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Completion Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Completion Summary</h3>
              <button
                type="button"
                suppressHydrationWarning
                className="text-xs text-gray-600 border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-gray-50"
              >
                This Month
                <ChevronDown size={12} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-[120px] h-[120px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {completionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-lg font-bold text-gray-900">18</p>
                  <p className="text-[9px] text-gray-400">Completed</p>
                </div>
              </div>
              <ul className="flex-1 space-y-2">
                {completionLegend.map((item) => (
                  <li key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-gray-500">
                      {item.count}{" "}
                      <span className="text-gray-400">({item.pct})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              suppressHydrationWarning
              className="mt-4 w-full py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Completed
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
