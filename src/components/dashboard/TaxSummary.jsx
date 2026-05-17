import { CheckCircle2 } from "lucide-react";

export default function TaxSummary() {
  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Tax Summary</h2>
          <p className="text-xs text-gray-400 mt-0.5">FY 2025-26</p>
        </div>
        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
          New Regime
        </span>
      </div>

      <div className="space-y-3">
        {[
          { label: "Total Income", value: "₹15,42,000" },
          { label: "Taxable Income", value: "₹13,80,000" },
          { label: "Tax Payable", value: "₹18,540" },
          { label: "Effective Tax Rate", value: "2.28%", highlight: true },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 text-xs">{row.label}</span>
            <span className={`font-semibold ${row.highlight ? "text-indigo-600" : "text-gray-900"}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-2">
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-800">
            You save ₹4,200 more under the New Regime
          </p>
          <p className="text-[10px] text-emerald-600 mt-0.5">vs Old Regime for FY 2025-26</p>
        </div>
      </div>

      <button type="button" suppressHydrationWarning className="w-full mt-4 py-2.5 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 transition-colors">
        Compare Regimes
      </button>
    </section>
  );
}

