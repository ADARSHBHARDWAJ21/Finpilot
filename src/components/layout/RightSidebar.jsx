"use client";

import { useState } from "react";
import { Bot, Send, Calendar, Sparkles, CheckCircle2, ChevronRight, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const initialPrompts = [
  "Can I afford a ₹25k EMI?",
  "How to save 80C tax this year?",
  "Review my dining budget",
  "Is NPS worth ₹50,000 extra?",
];

const initialReminders = [
  { date: "15", month: "JUN", title: "Advance Tax – Q1 (15%)", due: "Due in 29 days", urgent: false },
  { date: "05", month: "JUN", title: "HDFC Credit Card Bill", due: "Due in 3 days", urgent: true },
  { date: "31", month: "JUL", title: "ITR Filing Deadline", due: "Due in 75 days", urgent: false },
  { date: "20", month: "JUN", title: "GSTR-3B Quarterly Filing", due: "Due in 34 days", urgent: false },
];

const transactions = [
  { name: "Zomato", category: "Food & Dining", amount: "-₹485", date: "Today, 1:15 PM", emoji: "🍕", bg: "bg-red-50 text-red-600 border border-red-100" },
  { name: "Swiggy Instamart", category: "Groceries", amount: "-₹720", date: "Today, 10:20 AM", emoji: "🛵", bg: "bg-orange-50 text-orange-600 border border-orange-100" },
  { name: "Amazon Pay", category: "Shopping", amount: "-₹2,499", date: "Yesterday", emoji: "📦", bg: "bg-amber-50 text-amber-600 border border-amber-100" },
  { name: "Uber India", category: "Transport", amount: "-₹245", date: "Yesterday", emoji: "🚗", bg: "bg-slate-100 text-slate-700 border border-slate-200" },
  { name: "HDFC Monthly Salary", category: "Income", amount: "+₹1,28,500", date: "01 Jun", emoji: "🏦", bg: "bg-emerald-50 text-emerald-600 border border-emerald-100", income: true },
];

export default function RightSidebar({ recentTransactions, monthLabel }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [reminders, setReminders] = useState(initialReminders);

  const handleAsk = (text) => {
    const q = (text || query).trim().slice(0, 3000);
    if (!q) return;
    router.push(`/taxation/ai-copilot?question=${encodeURIComponent(q)}`);
  };

  const handleDismissReminder = (index) => {
    setReminders((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <aside className="w-[280px] xl:w-[310px] shrink-0 bg-white/95 backdrop-blur-xl border-l border-slate-200/80 min-h-screen min-h-[100dvh] overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {/* AI Copilot Panel */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white rounded-2xl p-4 border border-indigo-100/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-xs">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                AI Copilot
              </h3>
              <p className="text-[10px] text-slate-400">Personal finance intelligence</p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            Gemini
          </span>
        </div>

        <p className="mb-3 text-[11px] text-slate-500">Open a saved-data conversation with Gemini.</p>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {initialPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleAsk(p)}
              className="text-[10px] font-medium bg-white/90 border border-indigo-100/90 text-indigo-700 px-2.5 py-1 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left shadow-2xs hover:scale-102"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-1.5 shadow-2xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
        >
          <input
            type="text"
            aria-label="Your Copilot question"
            maxLength={3000}
            placeholder="Ask Copilot anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-xs outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label="Open Gemini Copilot"
            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-2xs shrink-0"
          >
            <Send size={12} />
          </button>
        </form>
      </div>

      {/* Upcoming Reminders */}
      {!recentTransactions && <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-600" />
            Upcoming Reminders
          </h3>
          <Link href="/reminders" className="text-[10px] text-indigo-600 font-semibold hover:underline">
            View all ({reminders.length})
          </Link>
        </div>

        <div className="space-y-2.5">
          {reminders.map((r, i) => (
            <div
              key={r.title}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                  r.urgent
                    ? "bg-rose-50 border-rose-100 text-rose-600"
                    : "bg-indigo-50 border-indigo-100 text-indigo-600"
                }`}
              >
                <span className="text-[11px] font-extrabold leading-none">{r.date}</span>
                <span className="text-[8px] font-bold uppercase mt-0.5">{r.month}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{r.title}</p>
                <p
                  className={`text-[10px] font-medium mt-0.5 flex items-center gap-1 ${
                    r.urgent ? "text-rose-600 font-semibold" : "text-slate-400"
                  }`}
                >
                  {r.urgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                  {r.due}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDismissReminder(i)}
                title="Mark completed"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-emerald-600"
              >
                <CheckCircle2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      }
      {/* Recent Transactions Feed */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-600" />
            {monthLabel ? `Activity · ${monthLabel}` : "Recent Activity"}
          </h3>
          <Link href="/transactions" className="text-[10px] text-indigo-600 font-semibold hover:underline">
            View all →
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentTransactions?.length === 0 && <p className="text-xs text-slate-500">No transactions recorded in this month.</p>}
          {(recentTransactions || transactions).map((t, index) => (
            <div
              key={`${t.name}-${t.date}-${index}`}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-xl ${t.bg} flex items-center justify-center text-sm shrink-0`}
              >
                {t.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{t.name}</p>
                <p className="text-[10px] text-slate-400">{t.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-xs font-bold ${
                    t.income ? "text-emerald-600" : "text-slate-800"
                  }`}
                >
                  {t.amount}
                </p>
                <p className="text-[9px] text-slate-400">{t.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
