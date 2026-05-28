import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Landmark,
  Receipt,
} from "lucide-react";

const CARD_META = [
  {
    title: "Total Income",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Total Expenses",
    icon: Receipt,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    title: "Total Savings",
    icon: PiggyBank,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Net Worth",
    icon: Wallet,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    title: "Tax Liability (Est.)",
    icon: Landmark,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const EMPTY_SUMMARY = {
  monthLabel: "",
  cards: CARD_META.map((meta) => ({
    title: meta.title,
    amount: meta.title.includes("Tax") ? "₹0" : "₹0",
    change: meta.title.includes("Tax") ? "Not calculated yet" : "No transactions yet",
    positive: true,
    neutral: meta.title.includes("Tax"),
  })),
};

export default function SummaryCards({ summary }) {
  const data = summary?.cards?.length ? summary : EMPTY_SUMMARY;

  return (
    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mt-4 sm:mt-6">
      {data.cards.map((card, index) => {
        const meta = CARD_META[index] || CARD_META[0];
        const Icon = meta.icon;
        const changeClass = card.neutral
          ? "text-gray-500"
          : card.positive
            ? "text-emerald-600"
            : "text-red-500";

        return (
          <div
            key={card.title}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.title}</p>
                <h2 className="text-xl font-bold text-gray-900 mt-1.5">{card.amount}</h2>
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${meta.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon size={18} className={meta.iconColor} />
              </div>
            </div>
            <p className={`mt-3 text-xs font-medium flex items-center gap-1 ${changeClass}`}>
              {card.change}
            </p>
          </div>
        );
      })}
    </div>
  );
}
