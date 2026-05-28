"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const iconMap = {
  pending: Bell,
  week: Calendar,
  overdue: AlertCircle,
  completed: CheckCircle2,
};

const categoryStyle = {
  tax: "bg-blue-50 text-blue-700",
  investments: "bg-emerald-50 text-emerald-700",
  compliance: "bg-purple-50 text-purple-700",
  document: "bg-cyan-50 text-cyan-700",
  bills: "bg-amber-50 text-amber-700",
};

export default function RemindersSection({ data }) {
  const [activeTab, setActiveTab] = useState("all");
  const tabs = [
    { id: "all", label: "All" },
    { id: "high", label: "High Priority" },
    { id: "tax", label: "Tax" },
    { id: "investments", label: "Investments" },
    { id: "bills", label: "Bills" },
  ];

  const tasks = data?.tasks ?? [];
  const filtered = useMemo(() => {
    if (activeTab === "all") return tasks;
    if (activeTab === "high") return tasks.filter((t) => t.priority === "High");
    return tasks.filter((t) => t.category === activeTab);
  }, [activeTab, tasks]);

  const displayTasks = filtered.length ? filtered : tasks;
  const completionData = data?.completionData ?? [];

  return (
    <div className="w-full max-w-[1500px] min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-sm text-gray-500 mt-1">Stay on top of important actions and deadlines.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(data?.summaryCards ?? []).map((card) => {
          const Icon = iconMap[card.key] || Bell;
          return (
            <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Icon size={16} className="text-indigo-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm ${
                    activeTab === tab.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-50 bg-gray-50/50">
                    <th className="px-3 py-3 font-medium">Task</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Due Date</th>
                    <th className="px-3 py-3 font-medium">Priority</th>
                    <th className="px-3 py-3 font-medium">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{task.sub}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded ${categoryStyle[task.category] || "bg-gray-100 text-gray-700"}`}>
                          {task.category}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm text-gray-900">{task.dueDateLabel}</p>
                        <p className={`text-[10px] ${task.overdue ? "text-red-500" : "text-gray-400"}`}>{task.daysLeftLabel}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded ${task.priority === "High" ? "bg-red-50 text-red-600" : task.priority === "Medium" ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600"}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{task.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming Timeline</h2>
              <Link href="/calendar" className="text-xs font-medium text-indigo-600 hover:underline inline-flex items-center gap-1">
                View Calendar <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(data?.timelineNodes ?? []).map((node) => (
                <div key={`${node.title}-${node.date}`} className="border border-gray-100 rounded-xl p-3">
                  <p className="text-[11px] font-semibold text-gray-400">{node.date}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{node.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{node.desc}</p>
                  <p className="text-[10px] text-indigo-600 mt-1">{node.days}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">AI Copilot Suggestion</h3>
            </div>
            <ul className="space-y-2 mb-3">
              {(data?.aiSuggestions ?? []).map((item) => (
                <li key={item.text} className="text-xs text-gray-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  {item.text}
                </li>
              ))}
            </ul>
            <Link href="/taxation/ai-copilot" className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50">
              <Sparkles size={14} /> Ask AI Copilot
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Completion Summary</h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={completionData} dataKey="value" innerRadius={35} outerRadius={52}>
                    {completionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 mt-2">
              {completionData.map((entry) => (
                <li key={entry.name} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{entry.name}</span>
                  <span className="font-medium text-gray-900">{entry.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Upcoming This Week</h3>
            <ul className="space-y-2">
              {(data?.upcomingWeek ?? []).map((item) => (
                <li key={item.id} className="text-xs border border-gray-100 rounded-lg px-3 py-2">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-gray-500 mt-0.5">{item.daysLeftLabel}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

