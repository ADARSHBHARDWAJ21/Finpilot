import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";

export default function MonthlyActivity({ activity, monthLabel }) {
  return <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
    <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><CalendarDays size={16} className="text-indigo-600" />Month in review</h2>
    <p className="mt-1 text-xs text-slate-500">{monthLabel}</p>
    <dl className="mt-5 space-y-4 text-sm">
      <div className="flex justify-between gap-3"><dt className="text-slate-500">Income entries</dt><dd className="font-semibold text-slate-900">{activity.incomeCount}</dd></div>
      <div className="flex justify-between gap-3"><dt className="text-slate-500">Expense entries</dt><dd className="font-semibold text-slate-900">{activity.expenseCount}</dd></div>
      <div className="flex justify-between gap-3"><dt className="text-slate-500">Largest spending category</dt><dd className="text-right font-semibold text-slate-900">{activity.biggestCategory || "No expenses"}</dd></div>
    </dl>
    <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">This overview uses your saved transactions and budgets. Annual tax estimates are available in Taxation.</p>
    <Link href="/transactions" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">View all transactions<ArrowUpRight size={14} /></Link>
  </section>;
}
