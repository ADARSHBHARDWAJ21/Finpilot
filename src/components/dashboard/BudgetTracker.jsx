import Link from "next/link";
import { Wallet, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

export default function BudgetTracker({ categories = [], monthLabel = "", available = true }) {
  const displayItems = categories.slice(0, 5);

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Wallet size={16} className="text-indigo-600" />
            Budget Health
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {monthLabel ? `${monthLabel} budget pacing` : "Monthly limit tracking"}
          </p>
        </div>
        <Link
          href="/budget-tracker"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
        >
          <span>Manage</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3.5">
        {!available && <p className="text-xs text-amber-700">Budget limits could not be loaded. Recorded spending is shown below.</p>}
        {!displayItems.length && <p className="text-sm text-slate-500">No saved budgets or expenses for this month.</p>}
        {displayItems.map((item) => {
          const hasLimit = item.budget !== null && available;
          const pct = item.budget > 0 ? Math.min(Math.round((item.spent / item.budget) * 100), 100) : 0;
          const over = hasLimit && item.spent > item.budget;
          const barPct = over ? 100 : pct;

          return (
            <div key={item.key} className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="font-medium text-slate-500">
                  <strong className="text-slate-900">{formatInr(item.spent)}</strong>
                  <span className="text-slate-300 mx-1">/</span>
                  {hasLimit ? formatInr(item.budget) : "No saved limit"}
                </span>
              </div>

              {/* Progress bar */}
              {hasLimit && <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    over
                      ? "bg-rose-500"
                      : pct > 85
                        ? "bg-amber-500"
                        : item.barColor || "bg-indigo-600"
                  }`}
                  style={{ width: `${barPct}%` }}
                />
              </div>}

              {hasLimit && <div className="flex items-center justify-between text-[10px] mt-1.5 font-medium">
                <span
                  className={
                    over
                      ? "text-rose-600 font-bold flex items-center gap-1"
                      : pct > 85
                        ? "text-amber-600 font-bold"
                        : "text-slate-400"
                  }
                >
                  {over ? "⚠️ Over limit by " + formatInr(item.spent - item.budget) : `${pct}% consumed`}
                </span>
                <span className="text-slate-400">
                  {over ? "Exceeded" : `${formatInr(Math.max(0, item.budget - item.spent))} left`}
                </span>
              </div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
