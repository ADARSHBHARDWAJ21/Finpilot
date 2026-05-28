function formatInr(v) {
  return `₹${Math.round(Number(v) || 0).toLocaleString("en-IN")}`;
}

export default function TaxSummary({ taxSummary }) {
  const hasSummary = taxSummary && taxSummary.estimatedTaxLiability != null;

  if (!hasSummary) {
    return (
      <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Tax Summary</h2>
            <p className="text-xs text-gray-400 mt-0.5">Complete onboarding for estimates</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Total Income", value: "—" },
            { label: "Taxable Income", value: "—" },
            { label: "Tax Payable", value: "₹0" },
            { label: "Effective Tax Rate", value: "—", highlight: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs">{row.label}</span>
              <span className={`font-semibold ${row.highlight ? "text-indigo-600" : "text-gray-900"}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const regime = taxSummary.chosenRegime || taxSummary.recommendedRegime || "new";

  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Tax Summary</h2>
          <p className="text-xs text-gray-400 mt-0.5">From your onboarding profile</p>
        </div>
        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg capitalize">
          {regime} regime
        </span>
      </div>

      <div className="space-y-3">
        {[
          { label: "Est. Tax Liability", value: formatInr(taxSummary.estimatedTaxLiability) },
          { label: "Expected Refund", value: formatInr(taxSummary.expectedRefund) },
          { label: "Unused 80C", value: formatInr(taxSummary.unused80c) },
          {
            label: "Tax Health Score",
            value: `${taxSummary.taxHealthScore}/100`,
            highlight: true,
          },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 text-xs">{row.label}</span>
            <span className={`font-semibold ${row.highlight ? "text-indigo-600" : "text-gray-900"}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {taxSummary.insights?.[0] && (
        <p className="mt-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
          {taxSummary.insights[0]}
        </p>
      )}
    </section>
  );
}
