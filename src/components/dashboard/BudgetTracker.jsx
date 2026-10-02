import Link from "next/link";
import { Wallet, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

const SAMPLE_BUDGETS = [
  { key: "food", name: "Food & Groceries", spent: 18400, budget: 22000, pct: 84, barColor: "bg-indigo-600" },
  { key: "rent", name: "Rent & Maintenance", spent: 32000, budget: 32000, pct: 100, barColor: "bg-emerald-600" },
  { key: "shopping", name: "Shopping & Lifestyle", spent: 14200, budget: 12000, pct: 118, barColor: "bg-rose-500" },
  { key: "entertainment", name: "Dining & Outings", spent: 6800, budget: 10000, pct: 68, barColor: "bg-amber-500" },
];

export default function BudgetTracker({ categories = [], monthLabel = "" }) {
  const displayItems = categories.length > 0 ? categories.slice(0, 5) : SAMPLE_BUDGETS;

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
        {displayItems.map((item) => {
          const pct = item.budget > 0 ? Math.min(Math.round((item.spent / item.budget) * 100), 100) : 0;
          const over = item.pct > 100 || (item.spent > item.budget && item.budget > 0);
          const barPct = over ? 100 : pct;

          return (
            <div key={item.key} className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="font-medium text-slate-500">
                  <strong className="text-slate-900">{formatInr(item.spent)}</strong>
                  <span className="text-slate-300 mx-1">/</span>
                  {formatInr(item.budget)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
              </div>

              <div className="flex items-center justify-between text-[10px] mt-1.5 font-medium">
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
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
