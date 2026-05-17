const budgets = [
  { category: "Food & Dining", spent: 12450, budget: 15000, color: "bg-indigo-500" },
  { category: "Shopping", spent: 7850, budget: 10000, color: "bg-pink-500" },
  { category: "Transport", spent: 8920, budget: 8000, color: "bg-red-500", over: true },
  { category: "Entertainment", spent: 5240, budget: 6000, color: "bg-amber-500" },
  { category: "Utilities", spent: 4800, budget: 5000, color: "bg-cyan-500" },
  { category: "Healthcare", spent: 4300, budget: 5000, color: "bg-emerald-500" },
];

export default function BudgetTracker() {
  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Budget Tracker</h2>
          <p className="text-xs text-gray-400 mt-0.5">May 2025 spending vs budget</p>
        </div>
        <a href="#" className="text-xs text-indigo-600 font-medium hover:underline">View all →</a>
      </div>

      <div className="space-y-4">
        {budgets.map((item) => {
          const pct = Math.min(Math.round((item.spent / item.budget) * 100), 100);
          const overPct = item.over ? Math.round((item.spent / item.budget) * 100) : pct;
          return (
            <div key={item.category}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-gray-700">{item.category}</span>
                <span className="text-gray-500">
                  ₹{item.spent.toLocaleString("en-IN")}{" "}
                  <span className="text-gray-300">/</span>{" "}
                  ₹{item.budget.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${item.over ? "bg-red-500" : item.color}`}
                  style={{ width: `${overPct}%` }}
                />
              </div>
              <p className={`text-[10px] mt-1 ${item.over ? "text-red-500 font-medium" : "text-gray-400"}`}>
                {item.over ? `${overPct}% — Over budget!` : `${pct}% used`}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

