import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Landmark,
  Receipt,
} from "lucide-react";

const cards = [
  {
    title: "Total Income",
    amount: "₹1,28,500",
    change: "↑ 12.4% vs Apr '25",
    positive: true,
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Total Expenses",
    amount: "₹74,860",
    change: "↓ 8.7% vs Apr '25",
    positive: false,
    icon: Receipt,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    title: "Total Savings",
    amount: "₹53,640",
    change: "↑ 17.5% vs Apr '25",
    positive: true,
    icon: PiggyBank,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Net Worth",
    amount: "₹18,75,420",
    change: "↑ 9.6% vs Apr '25",
    positive: true,
    icon: Wallet,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    title: "Tax Liability (Est.)",
    amount: "₹18,540",
    change: "↓ 5.3% vs Apr '25",
    positive: true,
    icon: Landmark,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

export default function SummaryCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.title}</p>
                <h2 className="text-xl font-bold text-gray-900 mt-1.5">{card.amount}</h2>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={card.iconColor} />
              </div>
            </div>
            <p
              className={`mt-3 text-xs font-medium flex items-center gap-1 ${
                card.positive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {card.change}
            </p>
          </div>
        );
      })}
    </div>
  );
}



