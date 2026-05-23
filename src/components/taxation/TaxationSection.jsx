"use client";

import {
  Upload,
  Bell,
  TrendingUp,
  FileText,
  Percent,
  Sparkles,
  ChevronRight,
  Send,
  BarChart3,
  FileCheck,
  AlertTriangle,
  Calendar,
  Target,
  Info,
  Lock,
  ShieldCheck,
  Download,
  HelpCircle,
  Lightbulb,
  CircleDollarSign,
} from "lucide-react";

function Sparkline() {
  return (
    <svg width="56" height="28" viewBox="0 0 56 28" className="text-indigo-500">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="0,22 10,18 18,20 26,12 34,14 42,8 50,10 56,4"
      />
    </svg>
  );
}

function TaxHealthGauge({ score }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx="56" cy="56" r="36" fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r="36"
          fill="none"
          stroke="#22c55e"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className="text-xs text-gray-400">/100</span>
      </div>
    </div>
  );
}

function RegimeBars() {
  const bars = [72, 48, 85, 60];
  return (
    <div className="flex items-end gap-1 h-8 mt-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-indigo-400/70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

const aiQuestions = [
  "Why is old regime better for me?",
  "How can I increase my refund?",
  "What deductions am I missing?",
  "When should I file my ITR?",
  "How does ELSS affect my tax?",
];

const quickActions = [
  { label: "Download Tax Summary", icon: Download },
  { label: "View Form 16", icon: FileText },
  { label: "Check AIS / TIS", icon: FileCheck, badge: "New" },
  { label: "Manage Investments", icon: BarChart3 },
];

const deadlines = [
  { task: "File Advance Tax – Q1", days: 12 },
  { task: "Submit Form 12BB to employer", days: 28 },
];

const simulationTags = [
  "Salary Hike",
  "Bonus",
  "ELSS Investment",
  "Home Loan",
  "Rent Change",
];

const bottomTools = [
  {
    title: "Refund Tracker",
    desc: "Track your refund status in real time",
    icon: CircleDollarSign,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "AIS Mismatch Alert",
    desc: "Spot discrepancies in your tax data",
    icon: AlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    title: "Tax Saving Ideas",
    desc: "Personalized tips to reduce liability",
    icon: Lightbulb,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Tax Reports",
    desc: "Download detailed tax breakdowns",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Help Center",
    desc: "Guides, FAQs, and expert support",
    icon: HelpCircle,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

export default function TaxationSection() {
  return (
    <div className="max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taxation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Optimize your taxes. Save more. Stress less.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            suppressHydrationWarning
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} className="text-gray-500" />
            Upload Document
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="relative w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Bell size={18} className="text-gray-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              RS
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Rahul Sharma</p>
              <p className="text-xs text-gray-400">FY 2024-25</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Projected Tax Liability</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">₹1,12,480</h2>
              <p className="text-xs text-gray-400 mt-1">For FY 2024-25</p>
            </div>
            <Sparkline />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">TDS Paid So Far</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">₹68,600</h2>
              <p className="text-xs text-gray-400 mt-1">(Till May 2024)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Projected Outcome</p>
              <p className="text-sm font-semibold text-emerald-600 mt-1">Refund</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5">₹43,880</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Effective Tax Rate</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">14.3%</h2>
              <p className="text-xs text-gray-400 mt-1">(vs last year 13.1%)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Percent size={18} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: center + right column */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-6">
          {/* 5 Key Tax Problems */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                5 Key Tax Problems We Solve For You
              </h2>
              <Info size={16} className="text-gray-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1 - Purple */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 w-6 h-6 rounded-md flex items-center justify-center mb-3">
                  1
                </span>
                <h3 className="text-sm font-semibold text-gray-900">
                  Which Tax Regime Is Better?
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed flex-1">
                  Compare old vs new regime based on your income, deductions, and investments.
                </p>
                <div className="mt-4 p-3 bg-indigo-50/80 rounded-xl border border-indigo-100/60">
                  <p className="text-xs font-semibold text-indigo-800">
                    You save ₹21,340 with Old Regime
                  </p>
                  <RegimeBars />
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Compare Regimes →
                </button>
              </div>

              {/* Card 2 - Green */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 w-6 h-6 rounded-md flex items-center justify-center mb-3">
                  2
                </span>
                <h3 className="text-sm font-semibold text-gray-900">
                  Am I Missing Any Deductions?
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed flex-1">
                  Scan 80C, 80D, HRA, LTA, and more to find every rupee you can claim.
                </p>
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-emerald-800">
                    Potential tax savings ₹36,200
                  </p>
                  <FileCheck size={20} className="text-emerald-600 shrink-0" />
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  className="mt-4 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  View Deductions →
                </button>
              </div>

              {/* Card 3 - Orange */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 w-6 h-6 rounded-md flex items-center justify-center mb-3">
                  3
                </span>
                <h3 className="text-sm font-semibold text-gray-900">Will I Owe Extra Tax?</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed flex-1">
                  Track advance tax, TDS gaps, and capital gains before the deadline hits.
                </p>
                <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-orange-800">
                    You may pay extra ₹18,750
                  </p>
                  <AlertTriangle size={20} className="text-orange-500 shrink-0" />
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  className="mt-4 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Tax Liability Tracker →
                </button>
              </div>

              {/* Card 4 - Blue wide */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:col-span-2">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 w-6 h-6 rounded-md flex items-center justify-center mb-3">
                  4
                </span>
                <h3 className="text-sm font-semibold text-gray-900">
                  Am I Missing Any Deadlines?
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Never miss advance tax, ITR filing, or Form 16 submission dates again.
                </p>
                <div className="mt-4 flex gap-4 flex-1">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Upcoming (2)</p>
                    <ul className="space-y-2">
                      {deadlines.map((d) => (
                        <li key={d.task} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded border-gray-300 text-blue-600"
                            readOnly
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800">{d.task}</p>
                            <span className="inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">
                              Due in {d.days} days
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 self-start">
                    <Calendar size={22} className="text-blue-600" />
                  </div>
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  View My Calendar →
                </button>
              </div>

              {/* Card 5 - Purple wide */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:col-span-3">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 w-6 h-6 rounded-md flex items-center justify-center mb-3">
                  5
                </span>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 flex-1">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      How Do My Decisions Affect Tax?
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      Simulate salary hikes, bonuses, investments, and see the tax impact instantly.
                    </p>
                    <p className="text-xs font-medium text-gray-600 mt-4 mb-2">
                      Try a quick simulation
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {simulationTags.map((tag) => (
                        <span
                          key={tag}
                          role="button"
                          tabIndex={0}
                          className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 transition-colors cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Target size={22} className="text-purple-600" />
                  </div>
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  className="mt-4 w-full sm:w-auto sm:min-w-[200px] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors px-6"
                >
                  Run Simulation →
                </button>
              </div>
            </div>
          </section>

          {/* More Tax Tools */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              More Tax Tools &amp; Insights
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {bottomTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.title}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${tool.iconBg} flex items-center justify-center mb-3`}
                    >
                      <Icon size={18} className={tool.iconColor} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{tool.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">{tool.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-wrap items-center justify-center gap-6 py-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Lock size={14} />
              Your data is 100% secure and encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} />
              We follow Indian tax rules and regulations
            </span>
          </footer>
        </div>

        {/* Right column */}
        <aside className="space-y-4">
          {/* Tax Health Score */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
            <h3 className="text-sm font-semibold text-gray-900 text-left mb-4">
              Tax Health Score
            </h3>
            <TaxHealthGauge score={82} />
            <p className="text-sm text-gray-600 mt-3">Great! You&apos;re on track.</p>
            <a
              href="#"
              className="inline-block text-sm font-semibold text-indigo-600 mt-2 hover:underline"
            >
              Improve Score →
            </a>
          </div>

          {/* AI Tax Copilot */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} />
              <h3 className="text-sm font-semibold">AI Tax Copilot</h3>
              <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded">
                Beta
              </span>
            </div>
            <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
              Get instant answers tailored to your tax profile and FY 2024-25.
            </p>
            <ul className="space-y-1 mb-4">
              {aiQuestions.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="w-full flex items-center justify-between gap-2 text-left text-xs bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    <span className="line-clamp-1">{q}</span>
                    <ChevronRight size={14} className="shrink-0 opacity-70" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 pl-3">
              <input
                type="text"
                placeholder="Ask your tax question..."
                className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400 min-w-0"
              />
              <button
                type="button"
                suppressHydrationWarning
                className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center shrink-0 transition-colors"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <ul className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <li key={action.label}>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <Icon size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">{action.label}</span>
                      {action.badge && (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          {action.badge}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
