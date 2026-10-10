import { ArrowDownLeft, ArrowUpRight, Landmark, PiggyBank, Receipt, Wallet } from "lucide-react";

const CARD_META = [
  { title: "Total Income", icon: ArrowDownLeft },
  { title: "Total Expenses", icon: ArrowUpRight },
  { title: "Total Savings", icon: PiggyBank },
  { title: "Recorded Balance", icon: Wallet },
  { title: "Tax Liability (Est.)", icon: Landmark },
];
const EMPTY_SUMMARY = {
  cards: CARD_META.map((meta) => ({
    title: meta.title,
    amount: meta.title.includes("Tax") ? "—" : "₹0",
    change: meta.title.includes("Tax") ? "Not calculated yet" : "No transactions yet",
    positive: true,
    neutral: meta.title.includes("Tax"),
  })),
};

export default function SummaryCards({ summary, omitTitles = [] }) {
  const data = summary?.cards?.length ? summary : EMPTY_SUMMARY;
  return (
    <div className={`mt-5 grid grid-cols-2 gap-3 ${omitTitles.length ? "lg:grid-cols-3" : "md:grid-cols-3 xl:grid-cols-5"} xl:gap-4`}>
      {data.cards.filter(card=>!omitTitles.includes(card.title)).map((card) => {
        const Icon = card.title === "Transactions" ? Receipt : (CARD_META.find(meta=>meta.title === card.title) || CARD_META[0]).icon;
        const isBalance = ["Recorded Balance","Net Worth"].includes(card.title);
        const title = card.title === "Net Worth" ? "Recorded Balance" : card.title;
        const change = card.change || card.text;
        const uncalculatedTax = card.title === "Tax Liability (Est.)" && change === "Not calculated yet";
        return (
          <section key={card.title} className={`min-w-0 rounded-[18px] border p-4 sm:p-5 ${isBalance ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground"}`}>
            <div className="mb-5 flex items-start justify-between gap-2">
              <p className={`text-xs font-medium leading-relaxed ${isBalance ? "text-white/75" : "text-muted-foreground"}`} title={title === "Recorded Balance" ? "Recorded income minus expenses; excludes opening balances and asset valuations." : undefined}>{title}</p>
              <Icon aria-hidden="true" size={17} strokeWidth={1.7} className={`mt-0.5 shrink-0 ${isBalance ? "text-white/65" : card.title === "Total Expenses" ? "text-[#ad705b]" : "text-primary/65"}`} />
            </div>
            <h2 className="break-words text-[23px] font-semibold leading-tight tracking-[-0.035em] tabular-nums sm:text-[25px]">{uncalculatedTax ? "—" : card.amount}</h2>
            <p className={`mt-3 text-[11px] leading-relaxed ${isBalance ? "text-white/70" : card.neutral ? "text-muted-foreground" : card.positive ? "text-primary" : "text-[#a5624d]"}`}>{change}</p>
          </section>
        );
      })}
    </div>
  );
}
