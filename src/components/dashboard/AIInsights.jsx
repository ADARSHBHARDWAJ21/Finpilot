import { Sparkles, TrendingDown, PiggyBank, Shield, Zap, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const DEFAULT_INSIGHTS = [
  {
    icon: Sparkles,
    badge: "High Impact Tax Move",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
    title: "Switch to New Tax Regime to Save ₹34,200",
    message: "Based on your deductions of ₹2.1L, the revised FY 25-26 New Regime slabs yield a lower net tax liability than your current Old Regime election.",
    action: "Review Regime",
    href: "/taxation",
  },
  {
    icon: Zap,
    badge: "Cash Flow Alert",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
    title: "3 Unused Subscriptions Detected (₹1,850/mo)",
    message: "Streaming and SaaS recurring debits have had zero active usage in the last 60 days. Canceling them frees up ₹22,200/year for your SIP.",
    action: "View Expenses",
    href: "/transactions",
  },
  {
    icon: PiggyBank,
    badge: "Goal Milestone",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    title: "Emergency Fund Reached 85% of Target",
    message: "You have accumulated ₹4.8 Lakhs in liquid funds (5.2 months of living expenses). You are just ₹60,000 away from your 6-month safety buffer.",
    action: "View Goals",
    href: "/goals",
  },
];

export default function AIInsights({ insights = [] }) {
  const items =
    insights.length > 0
      ? insights.map((message, i) => ({
          icon: Sparkles,
          badge: i === 0 ? "Tax Intelligence" : "Smart Insight",
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
          title: "Personalized Financial Action",
          message,
          action: "Inspect",
          href: "/taxation",
        }))
      : DEFAULT_INSIGHTS;

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-xs">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Autonomous Copilot Recommendations
            </h2>
            <p className="text-xs text-slate-400 font-medium">Real-time actions calculated from your data</p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
          Updated 10m ago
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:scale-110 transition-transform">
                    <Icon size={14} />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <Link
                  href={item.href || "/dashboard"}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>{item.action}</span>
                  <ArrowRight size={13} />
                </Link>
                <span className="text-[10px] font-medium text-slate-400">Copilot AI</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
