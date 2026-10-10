import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function MonthlyActivity({ activity, monthLabel }) {
  return <section className="rounded-[20px] border border-border bg-secondary/50 p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-base font-semibold tracking-tight text-foreground">The month at a glance</h2><p className="mt-1 text-xs text-muted-foreground">{monthLabel}</p></div>
      <Link href="/transactions" className="inline-flex items-center gap-1 text-xs font-medium text-primary">View transactions<ArrowUpRight size={14} strokeWidth={1.7} /></Link>
    </div>
    <dl className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
      <div><dt className="text-xs text-muted-foreground">Income entries</dt><dd className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{activity.incomeCount}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Expense entries</dt><dd className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{activity.expenseCount}</dd></div>
      <div className="col-span-2 sm:col-span-1"><dt className="text-xs text-muted-foreground">Largest spending category</dt><dd className="mt-2 text-lg font-medium tracking-tight text-foreground">{activity.biggestCategory || "No expenses"}</dd></div>
    </dl>
    <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">Based on your saved transactions and budgets. Find your annual tax estimates in <Link href="/taxation" className="text-primary underline decoration-primary/30 underline-offset-2">Taxation</Link>.</p>
  </section>;
}
