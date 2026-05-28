import Link from "next/link";

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

export default function BudgetTracker({ categories = [], monthLabel = "" }) {
  const top = categories.slice(0, 6);

  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Budget Tracker</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {monthLabel ? `${monthLabel} spending vs budget` : "From your transactions"}
          </p>
        </div>
        <Link href="/budget-tracker" className="text-xs text-indigo-600 font-medium hover:underline">
          View all →
        </Link>
      </div>

      {top.length === 0 ? (
        <p className="text-xs text-gray-500 py-4">
          No expenses this month.{" "}
          <Link href="/budget-tracker" className="text-indigo-600">
            Set a budget
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {top.map((item) => {
            const pct = item.budget > 0 ? Math.min(Math.round((item.spent / item.budget) * 100), 100) : 0;
            const over = item.pct > 100;
            const barPct = over ? Math.min(item.pct, 100) : pct;
            return (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  <span className="text-gray-500">
                    {formatInr(item.spent)}{" "}
                    <span className="text-gray-300">/</span> {formatInr(item.budget)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      over ? "bg-red-500" : item.barColor || "bg-indigo-500"
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <p
                  className={`text-[10px] mt-1 ${over ? "text-red-500 font-medium" : "text-gray-400"}`}
                >
                  {over ? `${item.pct}% — Over budget!` : `${pct}% used`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
