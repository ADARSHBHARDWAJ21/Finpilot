import Link from "next/link";
import { ArrowUpRight, Wallet } from "lucide-react";

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

export default function BudgetTracker({ categories = [], monthLabel = "", available = true }) {
  const displayItems = categories.slice(0, 5);
  return (
    <section className="h-full min-w-0 rounded-[20px] border border-border bg-white p-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div><h2 className="text-base font-semibold tracking-tight text-foreground">Keep spending in balance</h2><p className="mt-1 text-xs text-muted-foreground">{monthLabel ? `${monthLabel} budgets` : "Monthly limits"}</p></div>
        <Link href="/budget-tracker" className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/70"><span>Manage</span><ArrowUpRight size={14} strokeWidth={1.7} /></Link>
      </div>
      <div className="space-y-5">
        {!available && <p className="text-xs leading-relaxed text-amber-700">Budget limits could not be loaded. Recorded spending is shown below.</p>}
        {!displayItems.length && <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/50 px-5 text-center"><Wallet size={26} strokeWidth={1.5} className="mb-3 text-primary/45" /><p className="text-sm text-muted-foreground">Give your spending a little direction.</p><p className="mt-1 text-xs text-muted-foreground">No saved budgets or expenses this month.</p><Link href="/budget-tracker" className="mt-4 text-xs font-medium text-primary underline decoration-primary/30 underline-offset-4">Create a budget</Link></div>}
        {displayItems.map((item) => {
          const hasLimit = item.budget !== null && available;
          const pct = item.budget > 0 ? Math.min(Math.round((item.spent / item.budget) * 100), 100) : 0;
          const over = hasLimit && item.spent > item.budget;
          const barPct = over ? 100 : pct;
          return <div key={item.key}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
              <span className="font-medium text-foreground">{item.name}</span>
              <span className="text-muted-foreground tabular-nums"><span className="font-medium text-foreground">{formatInr(item.spent)}</span><span className="mx-1.5 opacity-50">/</span>{hasLimit ? formatInr(item.budget) : "No saved limit"}</span>
            </div>
            {hasLimit && <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-[#ad705b]" : pct > 85 ? "bg-[#b49b68]" : "bg-primary/80"}`} style={{ width: `${barPct}%` }} /></div>}
            {hasLimit && <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px]"><span className={over ? "font-medium text-[#a5624d]" : "text-muted-foreground"}>{over ? `Over limit by ${formatInr(item.spent - item.budget)}` : `${pct}% used`}</span><span className="text-muted-foreground">{over ? "Exceeded" : `${formatInr(Math.max(0, item.budget - item.spent))} remaining`}</span></div>}
          </div>;
        })}
      </div>
    </section>
  );
}
