"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Upload,
  PiggyBank,
  MessageCircle,
  BellRing,
  Star,
} from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const categoryColors = {
  tax: { dot: "bg-red-500", label: "Tax Payment" },
  investment: { dot: "bg-purple-500", label: "Investment / Tax Saving" },
  compliance: { dot: "bg-blue-500", label: "Compliance / Filing" },
  document: { dot: "bg-emerald-500", label: "Document / Proof" },
  other: { dot: "bg-orange-500", label: "Others" },
};

// May 2024 events: day -> events
const mayEvents = {
  1: [{ title: "Rent Receipt", category: "document" }],
  3: [{ title: "ELSS Investment", category: "investment" }],
  7: [{ title: "Upload Form 16", category: "document" }],
  10: [{ title: "Review AIS", category: "compliance" }],
  15: [{ title: "Advance Tax (Q1) Due", category: "tax" }],
  18: [{ title: "Health Insurance 80D", category: "investment" }],
  22: [{ title: "NPS Contribution", category: "investment" }],
  28: [{ title: "Credit Card Payment", category: "other" }],
  31: [{ title: "Monthly Budget Review", category: "other" }],
};

const summaryCards = [
  {
    label: "Upcoming Deadlines",
    value: "5",
    sub: "Next: 15 May 2024",
    icon: Clock,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    label: "Due This Month",
    value: "3",
    sub: "Total actions",
    icon: Calendar,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    label: "Completed",
    value: "12",
    sub: "This financial year",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Overdue",
    value: "1",
    sub: "Action required",
    icon: AlertCircle,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

const upcomingDeadlines = [
  {
    title: "Advance Tax (Q1)",
    desc: "Pay advance tax for Apr–Jun quarter",
    date: "15 May 2024",
    daysLeft: "5 Days Left",
    urgent: true,
    icon: Clock,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    title: "Rent Receipt Upload",
    desc: "Upload Apr 2024 rent receipt for HRA",
    date: "18 May 2024",
    daysLeft: "8 Days Left",
    urgent: false,
    icon: Upload,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "ELSS Investment",
    desc: "Complete 80C investment before deadline",
    date: "25 May 2024",
    daysLeft: "15 Days Left",
    urgent: false,
    icon: PiggyBank,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    title: "Review Form 16",
    desc: "Verify TDS details with employer",
    date: "31 May 2024",
    daysLeft: "21 Days Left",
    urgent: false,
    icon: Calendar,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

const quickActions = [
  { label: "Add Reminder", icon: BellRing },
  { label: "Upload Document", icon: Upload },
  { label: "Tax Savings Planner", icon: PiggyBank },
  { label: "Ask AI Copilot", icon: MessageCircle, href: "/taxation/ai-copilot" },
];

const aiInsightCards = [
  {
    text: "Invest ₹62,000 more in 80C before 31 Mar to save ₹18,600 in tax",
    icon: PiggyBank,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    text: "Health insurance under 80D can save you up to ₹7,500 this year",
    icon: AlertCircle,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    text: "Pay Advance Tax by 15 Jun to avoid interest under Section 234B",
    icon: Clock,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

function TaxReadinessRing({ percent }) {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="52" height="52" className="-rotate-90 shrink-0">
      <circle cx="26" cy="26" r="20" fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <circle
        cx="26"
        cy="26"
        r="20"
        fill="none"
        stroke="#6366f1"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function buildMay2024Days() {
  // May 2024 starts on Wednesday (index 3)
  const days = [];
  for (let i = 0; i < 3; i++) days.push(null);
  for (let d = 1; d <= 31; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function CalendarSection() {
  const [activeView, setActiveView] = useState("Calendar View");
  const [selectedDay, setSelectedDay] = useState(15);
  const days = buildMay2024Days();

  return (
    <div className="w-full max-w-[1500px] min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-5 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Never miss an important tax deadline or action.
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
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

        {/* Tax Readiness */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Tax Readiness</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">78%</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Keep it up!</p>
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-indigo-500 fill-indigo-500" />
              <TaxReadinessRing percent={78} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 mb-6">
        {/* Main calendar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* View tabs + controls */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {["Calendar View", "Timeline View"].map((view) => (
                <button
                  key={view}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setActiveView(view)}
                  className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                    activeView === view
                      ? "text-indigo-600 border-indigo-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  suppressHydrationWarning
                  className="p-2 hover:bg-gray-50 border-r border-gray-200"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <span className="px-4 py-1.5 text-sm font-semibold text-gray-900 min-w-[100px] text-center">
                  May 2024
                </span>
                <button
                  type="button"
                  suppressHydrationWarning
                  className="p-2 hover:bg-gray-50 border-l border-gray-200"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                className="text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1"
              >
                All Categories
                <ChevronDown size={12} />
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSelectedDay(22)}
                className="text-xs font-medium text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="bg-gray-50 py-2 text-center text-[11px] font-semibold text-gray-500"
                >
                  {d}
                </div>
              ))}
              {days.map((day, idx) => {
                const events = day ? mayEvents[day] || [] : [];
                const isSelected = day === selectedDay;
                const isToday = day === 22;

                return (
                  <button
                    key={idx}
                    type="button"
                    suppressHydrationWarning
                    disabled={!day}
                    onClick={() => day && setSelectedDay(day)}
                    className={`bg-white min-h-[88px] p-1.5 text-left transition-colors ${
                      !day ? "bg-gray-50/50 cursor-default" : "hover:bg-indigo-50/30 cursor-pointer"
                    } ${isSelected ? "ring-2 ring-inset ring-indigo-500 z-10" : ""}`}
                  >
                    {day && (
                      <>
                        <span
                          className={`inline-flex w-6 h-6 items-center justify-center text-xs font-medium rounded-full mb-1 ${
                            isToday
                              ? "bg-indigo-600 text-white"
                              : isSelected
                                ? "text-indigo-700 font-bold"
                                : "text-gray-700"
                          }`}
                        >
                          {day}
                        </span>
                        <div className="space-y-0.5">
                          {events.slice(0, 2).map((ev, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 min-w-0"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${categoryColors[ev.category].dot}`}
                              />
                              <span className="text-[9px] text-gray-600 truncate leading-tight">
                                {ev.title}
                              </span>
                            </div>
                          ))}
                          {events.length > 2 && (
                            <span className="text-[9px] text-gray-400 pl-2.5">
                              +{events.length - 2} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-50">
              {Object.entries(categoryColors).map(([key, { dot, label }]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Deadlines</h3>
            <ul className="space-y-3">
              {upcomingDeadlines.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={16} className={item.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{item.date}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        item.urgent
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.daysLeft}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const content = (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mx-auto">
                      <Icon size={18} className="text-indigo-600" />
                    </div>
                    <span className="text-[11px] text-gray-700 font-medium mt-2 block text-center leading-snug">
                      {action.label}
                    </span>
                  </>
                );
                return action.href ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    suppressHydrationWarning
                    className="p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Calendar Sync</p>
                  <p className="text-[11px] text-gray-500">Sync deadlines with Google Calendar</p>
                </div>
              </div>
              <button
                type="button"
                suppressHydrationWarning
                className="text-xs font-semibold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 shrink-0"
              >
                Connect
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* AI Calendar Insight */}
      <section className="bg-gradient-to-r from-indigo-50/80 to-purple-50/50 rounded-xl border border-indigo-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">AI Calendar Insight</h2>
                <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                  New
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                You have 3 important actions due this month. Completing them on time can help you
                save up to ₹21,340 in taxes.
              </p>
            </div>
          </div>
          <Link
            href="/taxation/ai-copilot"
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 border border-indigo-400 text-indigo-600 text-sm font-medium rounded-lg hover:bg-white transition-colors"
          >
            <MessageCircle size={16} />
            Ask AI Copilot
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aiInsightCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon size={16} className={card.iconColor} />
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
