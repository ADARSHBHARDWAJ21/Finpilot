"use client";

import { Bot, Send, Calendar } from "lucide-react";

const prompts = [
  "Can I afford a ₹20k EMI?",
  "How to save tax this year?",
  "Review my budget",
  "Best ELSS funds?",
];

const reminders = [
  { date: "15", month: "JUN", title: "Advance Tax – Q1", due: "Due in 29 days", urgent: false },
  { date: "20", month: "JUN", title: "GSTR-3B Filing", due: "Due in 34 days", urgent: false },
  { date: "31", month: "JUL", title: "ITR Filing Deadline", due: "Due in 75 days", urgent: false },
  { date: "05", month: "JUN", title: "Credit Card Payment", due: "Due in 19 days", urgent: true },
];

const transactions = [
  { name: "Zomato", category: "Food & Dining", amount: "-₹485", date: "Today", emoji: "🍕", bg: "bg-red-100" },
  { name: "Swiggy", category: "Food & Dining", amount: "-₹320", date: "Today", emoji: "🛵", bg: "bg-orange-100" },
  { name: "Amazon Pay", category: "Shopping", amount: "-₹2,499", date: "Yesterday", emoji: "📦", bg: "bg-yellow-100" },
  { name: "Uber", category: "Transport", amount: "-₹245", date: "Yesterday", emoji: "🚗", bg: "bg-gray-100" },
  { name: "HDFC Salary", category: "Income", amount: "+₹85,000", date: "Yesterday", emoji: "🏦", bg: "bg-blue-100", income: true },
];

export default function RightSidebar() {
  return (
    <aside className="w-[280px] xl:w-[300px] shrink-0 bg-white border-l border-gray-100 min-h-screen overflow-y-auto p-4 space-y-4">
      {/* AI Copilot */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100/60">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">AI Copilot</h3>
            <p className="text-[10px] text-gray-400">Ask anything about your finances</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {prompts.map((p) => (
            <span
              key={p}
              role="button"
              tabIndex={0}
              className="text-[10px] bg-white border border-indigo-100 text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors text-left cursor-pointer"
            >
              {p}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2">
          <input
            type="text"
            placeholder="Type your question..."
            suppressHydrationWarning
            className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
          />
          <button type="button" suppressHydrationWarning className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center hover:bg-indigo-700 transition-colors">
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Upcoming Reminders</h3>
          <a href="#" className="text-[10px] text-indigo-600 font-medium hover:underline">View all</a>
        </div>
        <div className="space-y-3">
          {reminders.map((r) => (
            <div key={r.title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-indigo-600 leading-none">{r.date}</span>
                <span className="text-[9px] text-indigo-400 font-medium">{r.month}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{r.title}</p>
                <p className={`text-[10px] mt-0.5 ${r.urgent ? "text-red-500 font-medium" : "text-gray-400"}`}>
                  {r.due}
                </p>
              </div>
              <Calendar size={14} className="text-gray-300 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
          <a href="#" className="text-[10px] text-indigo-600 font-medium hover:underline">View all</a>
        </div>
        <div className="space-y-3">
          {transactions.map((t) => (
            <div key={t.name + t.date} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${t.bg} flex items-center justify-center text-base shrink-0`}>
                {t.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800">{t.name}</p>
                <p className="text-[10px] text-gray-400">{t.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-semibold ${t.income ? "text-emerald-600" : "text-gray-800"}`}>
                  {t.amount}
                </p>
                <p className="text-[10px] text-gray-400">{t.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

