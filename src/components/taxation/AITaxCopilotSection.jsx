"use client";

import {
  Upload,
  Bell,
  ChevronDown,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Mic,
  Send,
  ChevronRight,
  IndianRupee,
  Receipt,
  FileText,
  Landmark,
  TrendingUp,
  Shield,
  Home,
  AlertTriangle,
  Info,
  User,
  PieChart,
} from "lucide-react";

const tryAskingPrompts = [
  "Which tax regime is better for me?",
  "How can I save more tax?",
  "What deductions am I missing?",
  "Will I get a refund this year?",
  "Explain my Form 16",
];

const followUpPrompts = [
  "Show me how to save more tax",
  "What if my salary increases?",
  "Explain my Form 16",
  "Compare my TDS vs liability",
];

const dataSnapshot = [
  {
    label: "Annual Income (FY 24-25)",
    value: "₹13,00,000",
    icon: IndianRupee,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    label: "Total Deductions Claimed",
    value: "₹2,15,000",
    icon: Receipt,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    label: "TDS Paid So Far",
    value: "₹68,600",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Projected Tax Liability",
    value: "₹78,420",
    icon: Landmark,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Expected Refund",
    value: "₹43,880",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    highlight: true,
  },
];

const insights = [
  {
    text: "You can still invest ₹62,000 in 80C to save ₹18,600 more tax",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    text: "Consider health insurance under 80D — save up to ₹7,500",
    icon: Shield,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    text: "Your HRA exemption may increase — upload rent receipts for Apr–Jun",
    icon: Home,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    text: "AIS shows bank interest ₹12,400 not in your records — verify",
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const chatHistory = [
  { q: "Which tax regime is better for me?", time: "10:30 AM" },
  { q: "How can I save more tax?", time: "Yesterday" },
  { q: "Why did my tax increase this year?", time: "2 days ago" },
  { q: "What deductions am I missing?", time: "3 days ago" },
];

function RobotIllustration() {
  return (
    <div className="relative w-[140px] h-[100px] shrink-0">
      {/* Floating chart window */}
      <div className="absolute top-0 right-4 w-[72px] bg-white rounded-lg shadow-md border border-gray-100 p-2 z-10">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <PieChart size={10} className="text-indigo-500" />
          </div>
          <div className="h-1 flex-1 bg-gray-100 rounded" />
        </div>
        <div className="flex items-end justify-center gap-0.5 h-7">
          {[35, 55, 40, 70, 50, 65].map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm bg-indigo-400"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      {/* Robot body */}
      <div className="absolute bottom-0 right-0 w-[88px] h-[80px]">
        <div className="w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl flex flex-col items-center justify-end pb-3 shadow-lg border border-slate-200/80 relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-5">
            <div className="w-1 h-3 bg-slate-300 rounded-full -rotate-[20deg]" />
            <div className="w-1 h-3 bg-slate-300 rounded-full rotate-[20deg]" />
          </div>
          <div className="flex gap-2.5 mb-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm" />
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm" />
          </div>
          <div className="w-7 h-1 bg-slate-300/80 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function SidebarCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <a href="#" className="text-xs font-medium text-indigo-600 hover:underline">
          View all
        </a>
      </div>
      {children}
    </div>
  );
}

export default function AITaxCopilotSection() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">AI Tax Copilot</h1>
            <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Your personal AI tax assistant. Get answers, insights and action plans based on your data.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            suppressHydrationWarning
            className="flex items-center gap-2 bg-white border border-gray-900 px-4 py-2 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            Upload Document
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="relative w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Bell size={18} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white shadow-sm">
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold">
                RS
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Rahul Sharma</p>
              <button
                type="button"
                suppressHydrationWarning
                className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-700"
              >
                FY 2024-25
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-5 min-h-0">
        {/* Main chat column — no outer white shell */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Try asking */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 shrink-0">
            <span className="text-xs text-gray-500 shrink-0 font-medium">Try asking</span>
            {tryAskingPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                suppressHydrationWarning
                className="shrink-0 text-xs text-gray-700 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors whitespace-nowrap shadow-sm"
              >
                {prompt}
              </button>
            ))}
            <button
              type="button"
              suppressHydrationWarning
              className="shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm ml-0.5"
            >
              <RefreshCw size={14} className="text-gray-400" />
            </button>
          </div>

          {/* Scrollable chat */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
            {/* Welcome card */}
            <div className="bg-violet-50/60 rounded-xl p-5 border border-violet-200/70 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-white" />
                </div>
                <p className="text-sm text-gray-800 leading-relaxed pt-0.5">
                  <span className="font-semibold text-gray-900">Hi Rahul! 👋</span> I have analyzed
                  your data for FY 2024-25. You can ask me anything about your taxes.
                </p>
              </div>
              <RobotIllustration />
            </div>

            {/* User message */}
            <div className="flex justify-end items-end gap-2">
              <div className="text-right">
                <div className="bg-violet-100 text-gray-900 px-4 py-3 rounded-2xl rounded-br-sm text-sm inline-block text-left max-w-md border border-violet-200/50">
                  Which tax regime is better for me this year?
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-400">10:30 AM</span>
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User size={11} className="text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI response card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start gap-2 mb-4">
                <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-800 leading-relaxed">
                  Based on your income, deductions and investments, the{" "}
                  <strong className="text-gray-900">Old Tax Regime</strong> is better for you.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Old regime */}
                <div className="rounded-xl border-2 border-emerald-400/80 bg-white p-4 relative">
                  <span className="absolute -top-2.5 left-3 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded">
                    Recommended
                  </span>
                  <p className="text-xs font-medium text-gray-500 mt-1">Old Tax Regime</p>
                  <p className="text-[28px] font-bold text-emerald-600 leading-tight mt-0.5">
                    ₹78,420
                  </p>
                  <p className="text-[11px] text-gray-400">Total Tax Liability</p>
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <p className="text-[11px] font-medium text-emerald-600 leading-snug">
                      You save ₹21,340 compared to New Regime
                    </p>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <ThumbsUp size={14} className="text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* New regime */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">New Tax Regime</p>
                  <p className="text-[28px] font-bold text-gray-900 leading-tight mt-0.5">
                    ₹99,760
                  </p>
                  <p className="text-[11px] text-gray-400">Total Tax Liability</p>
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <p className="text-[11px] font-medium text-red-500 leading-snug">
                      Higher by ₹21,340 vs Old Regime
                    </p>
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <ThumbsDown size={14} className="text-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Key reason:</span> Your deductions
                  under 80C, HRA and 80D are giving you more tax benefit in Old Regime.
                </p>
              </div>

              <button
                type="button"
                suppressHydrationWarning
                className="mt-4 px-5 py-2 border border-indigo-400 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors"
              >
                View Detailed Comparison
              </button>

              <p className="text-[10px] text-gray-400 mt-4">10:31 AM</p>
            </div>
          </div>

          {/* Follow-up pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 shrink-0">
            {followUpPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                suppressHydrationWarning
                className="shrink-0 text-xs text-indigo-700 bg-white border border-indigo-200 px-3.5 py-1.5 rounded-full hover:bg-indigo-50 transition-colors whitespace-nowrap shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="shrink-0 pt-1 pb-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <textarea
                rows={2}
                placeholder="Ask anything about your taxes..."
                className="w-full text-sm text-gray-900 resize-none outline-none placeholder:text-gray-400 bg-transparent min-h-[48px]"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  suppressHydrationWarning
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Paperclip size={14} />
                  Attach File/Document
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Mic size={16} className="text-gray-500" />
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Send size={15} />
                    Send
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
              <Info size={12} />
              AI Copilot can make mistakes. Please review important information.
            </p>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-[268px] shrink-0 space-y-4 overflow-y-auto hidden lg:block">
          <SidebarCard title="Your Data Snapshot">
            <ul className="space-y-3">
              {dataSnapshot.map((row) => {
                const Icon = row.icon;
                return (
                  <li key={row.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg ${row.iconBg} flex items-center justify-center shrink-0`}
                      >
                        <Icon size={14} className={row.iconColor} />
                      </div>
                      <span className="text-[11px] text-gray-500 leading-tight">{row.label}</span>
                    </div>
                    <span
                      className={`text-xs font-bold shrink-0 ${
                        row.highlight ? "text-emerald-600" : "text-gray-900"
                      }`}
                    >
                      {row.value}
                    </span>
                  </li>
                );
              })}
            </ul>
          </SidebarCard>

          <SidebarCard title="Top Insights for You">
            <ul className="space-y-1">
              {insights.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className="w-full flex items-center gap-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}
                      >
                        <Icon size={13} className={item.iconColor} />
                      </div>
                      <span className="text-[11px] text-gray-700 leading-snug flex-1">{item.text}</span>
                      <ChevronRight
                        size={14}
                        className="text-gray-300 group-hover:text-gray-500 shrink-0"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </SidebarCard>

          <SidebarCard title="Chat History">
            <ul className="space-y-2">
              {chatHistory.map((item, i) => (
                <li key={i}>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="w-full flex items-start justify-between gap-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <p className="text-[11px] text-gray-800 leading-snug flex-1">{item.q}</p>
                    <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                      {item.time}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}
