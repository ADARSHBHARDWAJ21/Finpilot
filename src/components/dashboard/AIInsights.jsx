import { Sparkles, TrendingDown, PiggyBank, Shield, Zap } from "lucide-react";

const insights = [
  {
    icon: Sparkles,
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
    text: "You can save up to ₹18,540 in taxes by optimizing your investments.",
    action: "Optimize now →",
    actionColor: "text-purple-600",
  },
  {
    icon: TrendingDown,
    bg: "bg-red-50",
    iconColor: "text-red-500",
    text: "Dining expenses are 31% higher than last month.",
    action: "View details →",
    actionColor: "text-red-500",
  },
  {
    icon: PiggyBank,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    text: "Your savings rate of 42.6% is above the recommended 30%.",
    action: "Keep it up →",
    actionColor: "text-emerald-600",
  },
  {
    icon: Shield,
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    text: "Consider increasing your emergency fund to 6 months of expenses.",
    action: "Plan now →",
    actionColor: "text-blue-600",
  },
  {
    icon: Zap,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    text: "Switch to ELSS funds to save ₹46,800 under Section 80C.",
    action: "Explore →",
    actionColor: "text-amber-600",
  },
];

export default function AIInsights() {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-3">AI Insights & Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {insights.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className={`${item.bg} rounded-2xl p-4 border border-white/60 hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className={`w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center mb-3`}>
                <Icon size={16} className={item.iconColor} />
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{item.text}</p>
              <a href="#" className={`inline-block text-xs font-semibold mt-3 ${item.actionColor} hover:underline`}>
                {item.action}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

