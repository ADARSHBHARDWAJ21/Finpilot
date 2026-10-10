import Link from "next/link";
import { ArrowRight, Wallet, Landmark, FileCheck2, Sparkles, CircleAlert } from "lucide-react";
import FinancialYearSelect from "@/components/finance/FinancialYearSelect";
import { ProgressLine } from "@/components/layout/WorkspaceUI";
import { TAX_CATEGORIES } from "@/lib/taxation/categories";

const money = (value) => `₹${Math.round(value || 0).toLocaleString("en-IN")}`;
export default function WorkspaceOverview({ overview, report, year }) {
  const tax = report?.tax;
  const completed = report?.checklist.reduce((total, item) => total + item.completed, 0) || 0;
  const total = report?.checklist.reduce((total, item) => total + item.total, 0) || 0;
  const nextSection = report?.checklist.find((item) => item.completed < item.total);
  const figures = overview?.summary?.cards || [];
  return <div className="mb-8 space-y-5">
    <div className="fp-overview-domains">
      <section className="fp-domain-card" aria-labelledby="money-outlook"><div className="fp-domain-heading"><span><Wallet size={17} />Money management</span><span>{overview?.monthLabel || "Monthly view"}</span></div><h2 id="money-outlook">A little room for what’s next.</h2><p>Your recorded income, spending and monthly balance.</p><dl className="fp-domain-figures">{figures.slice(0, 2).map((item) => <div key={item.title}><dt>{item.title}</dt><dd>{item.amount}</dd></div>)}</dl><div className="fp-domain-bottom"><Link className="fp-primary-link" href="/transactions">Review your money<ArrowRight size={16} /></Link><Link className="fp-inline-link" href="/budget-tracker">Plan this month</Link></div></section>
      <section className="fp-domain-card fp-tax-surface" aria-labelledby="tax-outlook"><div className="fp-domain-heading"><span><Landmark size={17} />Tax planning</span><FinancialYearSelect year={year} /></div><h2 id="tax-outlook">A clearer view of your tax year.</h2><p>Salary estimates and the records behind them.</p><dl className="fp-domain-figures">{["old", "new"].map((regime) => <div key={regime}><dt>{regime === "old" ? "Old regime" : "New regime"} · salary estimate</dt><dd>{tax?.available ? money(tax[regime].tax) : "—"}</dd></div>)}</dl>{report ? <ProgressLine value={total ? completed / total * 100 : 0} label={`${completed} of ${total} preparation items reviewed`} /> : <p className="text-sm text-muted-foreground">Tax records could not be loaded. Open your tax workspace to retry.</p>}<div className="fp-domain-bottom"><Link className="fp-primary-link" href={`/taxation?year=${year}`}>Review your tax year<ArrowRight size={16} /></Link><span className="text-xs text-muted-foreground">Declared data · salary only</span></div></section>
    </div>
    <section className="fp-attention" aria-labelledby="attention-heading"><div><p className="fp-eyebrow">Your next steps</p><h2 id="attention-heading">Needs your attention</h2></div><div className="fp-attention-links">
      {!overview?.summary?.transactionCount && <Link href="/transactions"><CircleAlert size={18} /><span>Add this month’s records<small>Import a statement or record a transaction.</small></span><ArrowRight size={15} /></Link>}
      {overview?.summary?.transactionCount > 0 && <Link href="/transactions"><Wallet size={18} /><span>Review your recorded activity<small>Check amounts and categories before relying on totals.</small></span><ArrowRight size={15} /></Link>}
      {tax && !tax.available && <Link href={`/taxation/salary-documents?year=${year}`}><Landmark size={18} /><span>Complete your salary details<small>Valid annual inputs unlock the tax comparison.</small></span><ArrowRight size={15} /></Link>}
      {nextSection && <Link href={`/taxation/${nextSection.section}?year=${year}`}><FileCheck2 size={18} /><span>{TAX_CATEGORIES.find((item) => item.slug === nextSection.section)?.title}<small>{nextSection.total - nextSection.completed} preparation items still to review.</small></span><ArrowRight size={15} /></Link>}
      <Link href={`/taxation/ai-copilot?year=${year}`}><Sparkles size={18} /><span>Explore with Copilot<small>Understand a money decision or a tax estimate.</small></span><ArrowRight size={15} /></Link>
    </div></section>
  </div>;
}
