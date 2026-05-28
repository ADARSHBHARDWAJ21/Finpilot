"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  MessageCircle,
} from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const categoryColors = {
  tax: { dot: "bg-red-500", label: "Tax Payment" },
  investment: { dot: "bg-purple-500", label: "Investment / Tax Saving" },
  compliance: { dot: "bg-blue-500", label: "Compliance / Filing" },
  document: { dot: "bg-emerald-500", label: "Document / Proof" },
  other: { dot: "bg-orange-500", label: "Others" },
};

function buildMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i += 1) days.push(null);
  for (let d = 1; d <= totalDays; d += 1) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function CalendarSection({ data }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(data?.selectedDay || now.getDate());
  const days = useMemo(() => buildMonthDays(cursor.year, cursor.month), [cursor]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const eventsByDay = data?.eventsByDay ?? {};
  const summaryCards = data?.summaryCards ?? [];
  const upcomingDeadlines = data?.upcomingDeadlines ?? [];

  return (
    <div className="w-full max-w-[1500px] min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time deadline and action calendar based on your profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">Tax Readiness</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{data?.taxReadiness ?? 0}%</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Live from tax context</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                onClick={() =>
                  setCursor((c) => {
                    const d = new Date(c.year, c.month - 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-semibold text-gray-900 min-w-[130px] text-center">{monthLabel}</span>
              <button
                type="button"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                onClick={() =>
                  setCursor((c) => {
                    const d = new Date(c.year, c.month + 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
              onClick={() => {
                const t = new Date();
                setCursor({ year: t.getFullYear(), month: t.getMonth() });
                setSelectedDay(t.getDate());
              }}
            >
              Today
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
              {WEEKDAYS.map((d) => (
                <div key={d} className="bg-gray-50 py-2 text-center text-[11px] font-semibold text-gray-500">
                  {d}
                </div>
              ))}
              {days.map((day, idx) => {
                const events = day ? eventsByDay[day] || [] : [];
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!day}
                    onClick={() => day && setSelectedDay(day)}
                    className={`bg-white min-h-[88px] p-1.5 text-left ${!day ? "bg-gray-50/50 cursor-default" : "hover:bg-indigo-50/30"} ${
                      isSelected ? "ring-2 ring-inset ring-indigo-500 z-10" : ""
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`inline-flex w-6 h-6 items-center justify-center text-xs rounded-full mb-1 ${isSelected ? "bg-indigo-600 text-white" : "text-gray-700"}`}>
                          {day}
                        </span>
                        <div className="space-y-0.5">
                          {events.slice(0, 2).map((ev, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${categoryColors[ev.category]?.dot || "bg-gray-400"}`} />
                              <span className="text-[9px] text-gray-600 truncate">{ev.title}</span>
                            </div>
                          ))}
                          {events.length > 2 && <span className="text-[9px] text-gray-400 pl-2.5">+{events.length - 2} more</span>}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
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

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Deadlines</h3>
            <ul className="space-y-3">
              {upcomingDeadlines.map((item) => (
                <li key={item.id} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.sub}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-400">{item.dueDateLabel}</p>
                    <span className={`text-[10px] font-semibold ${item.overdue ? "text-red-600" : "text-indigo-600"}`}>
                      {item.daysLeftLabel}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/reminders" className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mx-auto"><Clock size={16} className="text-indigo-600" /></div>
                <span className="text-[11px] text-gray-700 font-medium mt-2 block text-center">Add Reminder</span>
              </Link>
              <Link href="/goals" className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mx-auto"><Calendar size={16} className="text-indigo-600" /></div>
                <span className="text-[11px] text-gray-700 font-medium mt-2 block text-center">Goal Milestones</span>
              </Link>
              <Link href="/budget-tracker" className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mx-auto"><Clock size={16} className="text-indigo-600" /></div>
                <span className="text-[11px] text-gray-700 font-medium mt-2 block text-center">Budget Review</span>
              </Link>
              <Link href="/taxation/ai-copilot" className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center mx-auto"><MessageCircle size={16} className="text-indigo-600" /></div>
                <span className="text-[11px] text-gray-700 font-medium mt-2 block text-center">Ask AI</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <section className="bg-gradient-to-r from-indigo-50/80 to-purple-50/50 rounded-xl border border-indigo-100 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">AI Calendar Insight</h2>
              <p className="text-sm text-gray-600 mt-1">
                You have {upcomingDeadlines.length} important actions lined up. FinPilot keeps updating this from your live profile data.
              </p>
            </div>
          </div>
          <Link href="/taxation/ai-copilot" className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 border border-indigo-400 text-indigo-600 text-sm font-medium rounded-lg hover:bg-white">
            <MessageCircle size={16} />
            Ask AI Copilot
          </Link>
        </div>
      </section>
    </div>
  );
}

