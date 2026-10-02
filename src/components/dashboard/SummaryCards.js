import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Landmark,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
} from "lucide-react";

const CARD_META = [
  {
    title: "Total Income",
    icon: TrendingUp,
    accentBorder: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    shadowHover: "hover:shadow-emerald-500/10",
  },
  {
    title: "Total Expenses",
    icon: Receipt,
    accentBorder: "from-rose-500 to-pink-500",
    iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
    shadowHover: "hover:shadow-rose-500/10",
  },
  {
    title: "Total Savings",
    icon: PiggyBank,
    accentBorder: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
    shadowHover: "hover:shadow-blue-500/10",
  },
  {
    title: "Net Worth",
    icon: Wallet,
    accentBorder: "from-indigo-500 to-violet-500",
    iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-100",
    shadowHover: "hover:shadow-indigo-500/10",
  },
  {
    title: "Tax Liability (Est.)",
    icon: Landmark,
    accentBorder: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
    shadowHover: "hover:shadow-amber-500/10",
  },
];

const EMPTY_SUMMARY = {
  monthLabel: "",
  cards: CARD_META.map((meta) => ({
    title: meta.title,
    amount: "₹0",
    change: meta.title.includes("Tax") ? "Not calculated yet" : "No transactions yet",
    positive: true,
    neutral: meta.title.includes("Tax"),
  })),
};

export default function SummaryCards({ summary }) {
  const data = summary?.cards?.length ? summary : EMPTY_SUMMARY;

  return (
    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 mt-4 sm:mt-5">
      {data.cards.map((card, index) => {
        const meta = CARD_META[index] || CARD_META[0];
        const Icon = meta.icon;

        return (
          <div
            key={card.title}
            className={`relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden ${meta.shadowHover}`}
          >
            {/* Top subtle gradient line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.accentBorder} opacity-80 group-hover:opacity-100 transition-opacity`}
            />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {card.title}
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
                  {card.amount}
                </h2>
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${meta.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform`}
              >
                <Icon size={18} />
              </div>
            </div>

            {/* Change pill / subtitle */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span
                className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                  card.neutral
                    ? "text-slate-500"
                    : card.positive
                      ? "text-emerald-700"
                      : "text-rose-600"
                }`}
              >
                {!card.neutral && (
                  card.positive ? (
                    <ArrowUpRight size={13} className="shrink-0" />
                  ) : (
                    <ArrowDownRight size={13} className="shrink-0" />
                  )
                )}
                {card.change}
              </span>

              {/* Status indicator dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  card.neutral
                    ? "bg-slate-300"
                    : card.positive
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
