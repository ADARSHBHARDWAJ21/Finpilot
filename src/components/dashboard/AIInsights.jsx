import { Sparkles, TrendingDown, PiggyBank, Shield, Zap } from "lucide-react";

const ICONS = [Sparkles, TrendingDown, PiggyBank, Shield, Zap];

export default function AIInsights({ insights = [] }) {
  const items =
    insights.length > 0
      ? insights.map((message, i) => ({
          icon: ICONS[i % ICONS.length],
          title: "Insight",
          message,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        }))
      : [
          {
            icon: Sparkles,
            title: "Complete onboarding",
            message: "Finish your financial profile to unlock personalized AI insights.",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ];

  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-indigo-600" />
        <h2 className="text-base font-semibold text-gray-900">AI Insights</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                <Icon size={16} className={item.color} />
              </div>
              <p className="text-xs font-semibold text-gray-900">{item.title}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.message}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
