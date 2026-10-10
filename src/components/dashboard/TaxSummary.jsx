import { ArrowUpRight, Landmark } from "lucide-react";
import Link from "next/link";

function formatInr(value) {
  return value == null ? "Not available" : `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

export default function TaxSummary({ taxSummary }) {
  const hasSummary = taxSummary && taxSummary.estimatedTaxLiability != null;
  const regime = taxSummary?.chosenRegime || taxSummary?.recommendedRegime;
  const rows = hasSummary ? [
    { label: "Estimated tax liability", value: formatInr(taxSummary.estimatedTaxLiability) },
    ...(taxSummary.expectedRefund != null ? [{ label: "Estimated excess payment", value: formatInr(taxSummary.expectedRefund) }] : []),
    ...(taxSummary.unused80c != null ? [{ label: "Unused 80C space", value: formatInr(taxSummary.unused80c) }] : []),
    ...(taxSummary.taxHealthScore != null ? [{ label: "Tax health score", value: `${taxSummary.taxHealthScore}/100` }] : []),
  ] : [];
  const insight = taxSummary?.insights?.[0];
  return <section className="flex flex-col justify-between rounded-[20px] border border-border bg-white p-5 sm:p-6">
    <div>
      <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold tracking-tight text-foreground">Your tax picture</h2><p className="mt-1 text-xs text-muted-foreground">{regime ? `${regime} regime` : "Annual planning overview"}</p></div><Landmark aria-hidden="true" size={20} strokeWidth={1.7} className="text-primary" /></div>
      {hasSummary ? <dl className="space-y-4">{rows.map((row) => <div key={row.label} className="flex items-baseline justify-between gap-4 text-xs"><dt className="text-muted-foreground">{row.label}</dt><dd className="font-medium text-foreground tabular-nums">{row.value}</dd></div>)}</dl> : <p className="text-sm leading-relaxed text-muted-foreground">Add your annual salary and deduction details to see a tax estimate.</p>}
    </div>
    <div className="mt-5 border-t border-border pt-4">
      {insight && <p className="mb-4 rounded-xl bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">{insight}</p>}
      <Link href="/taxation" className="inline-flex items-center gap-1 text-xs font-medium text-primary">Open tax workspace<ArrowUpRight size={14} strokeWidth={1.7} /></Link>
    </div>
  </section>;
}
