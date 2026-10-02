import { Landmark, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

function formatInr(v) {
  return `₹${Math.round(Number(v) || 0).toLocaleString("en-IN")}`;
}

export default function TaxSummary({ taxSummary }) {
  const hasSummary = taxSummary && taxSummary.estimatedTaxLiability != null;
  const regime = taxSummary?.chosenRegime || taxSummary?.recommendedRegime || "New";

  const rows = hasSummary
    ? [
        { label: "Est. Tax Liability", value: formatInr(taxSummary.estimatedTaxLiability), color: "text-slate-900" },
        { label: "Expected Refund", value: formatInr(taxSummary.expectedRefund), color: "text-emerald-700 font-bold" },
        { label: "Unused 80C Space", value: formatInr(taxSummary.unused80c), color: "text-amber-600" },
        { label: "Tax Health Score", value: `${taxSummary.taxHealthScore || 91}/100`, color: "text-indigo-600 font-bold", highlight: true },
      ]
    : [
        { label: "Est. Tax Liability", value: "₹2,14,000", color: "text-slate-900" },
        { label: "Expected Refund", value: "₹18,400", color: "text-emerald-700 font-bold" },
        { label: "Unused 80C Space", value: "₹45,000", color: "text-amber-600" },
        { label: "Tax Health Score", value: "88 / 100", color: "text-indigo-600 font-bold", highlight: true },
      ];

  const insight =
    taxSummary?.insights?.[0] ||
    "Switching to New Tax Regime saves ₹34,200 this year. Claim remaining 80CCD NPS before March 31.";

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Landmark size={16} className="text-indigo-600" />
              Tax Intelligence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">FY 2024-25 optimization</p>
          </div>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full capitalize">
            {regime} Regime Active
          </span>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors text-xs"
            >
              <span className="text-slate-500 font-medium">{row.label}</span>
              <span className={`text-sm ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-100 text-xs text-slate-700 space-y-1">
          <div className="flex items-center justify-between font-bold text-indigo-900 text-[11px]">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-600" />
              Copilot Advice
            </span>
            <Link href="/taxation" className="text-indigo-600 hover:underline text-[10px]">
              Details →
            </Link>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">{insight}</p>
        </div>
      </div>
    </section>
  );
}
