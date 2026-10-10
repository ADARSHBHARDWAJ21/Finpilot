import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown, Equal, Wallet, Landmark, FileText, FileCheck2, ShieldCheck, ListChecks, Clock3, Coins, CalendarDays, Sparkles, CircleAlert } from "lucide-react";
import FinancialYearSelect from "@/components/finance/FinancialYearSelect";
import { ProgressLine } from "@/components/layout/WorkspaceUI";
import { TAX_CATEGORIES } from "@/lib/taxation/categories";

const money = (value) => `₹${Math.round(value || 0).toLocaleString("en-IN")}`;

function MoneyMetric({ icon: Icon, tone, label, amount, detail }) {
  return <div className="fp-money-metric">
    <span className={`fp-dashboard-metric-icon ${tone}`}><Icon size={20} aria-hidden="true" /></span>
    <div><dt>{label}</dt><dd>{amount}</dd><p>{detail}</p></div>
  </div>;
}

export default function WorkspaceOverview({ overview, report, year }) {
  const tax = report?.tax;
  const completed = report?.checklist.reduce((total, item) => total + item.completed, 0) || 0;
  const total = report?.checklist.reduce((total, item) => total + item.total, 0) || 0;
  const nextSection = report?.checklist.find((item) => item.completed < item.total);
  const figures = overview?.summary?.cards || [];
  const count = overview?.summary?.transactionCount || 0;
  const recent = overview?.recentTransactions?.slice(0, 3) || [];
  const amount = (title) => overview ? figures.find((item) => item.title === title)?.amount || "₹0" : "—";
  const countLabel = (value, type) => value ? `${value} ${type} transaction${value === 1 ? "" : "s"}` : `No ${type} recorded`;
  const stats = [
    { label: "Documents", value: report?.documents?.length, icon: FileText, tone: "fp-tone-green", href: `/reports?year=${year}` },
    { label: "Saving proofs", value: report?.checklist.find((item) => item.section === "tax-saving-proofs")?.completed, icon: ShieldCheck, tone: "fp-tone-blue", href: `/taxation/tax-saving-proofs?year=${year}`, title: "Manually reviewed tax-saving checklist items" },
    { label: "Reviewed", value: report ? completed : null, icon: ListChecks, tone: "fp-tone-purple", href: `/taxation?year=${year}`, title: "Manually reviewed preparation items" },
    { label: "Pending", value: report ? total - completed : null, icon: Clock3, tone: "fp-tone-orange", href: `/taxation${nextSection ? `/${nextSection.section}` : ""}?year=${year}`, title: "Preparation items still to review" },
  ];

  return <div className="mb-6 space-y-5">
    <div className="fp-dashboard-panels">
      <section className="fp-dashboard-panel fp-dashboard-money" aria-labelledby="money-outlook">
        <div className="fp-dashboard-panel-heading">
          <span className="fp-dashboard-domain-icon"><Wallet size={28} aria-hidden="true" /></span>
          <div className="min-w-0"><h2 id="money-outlook">Money management</h2><p>Your recorded income, spending and monthly balance.</p></div>
          <span className="fp-dashboard-month-badge">{overview?.monthLabel || "Monthly view"}</span>
        </div>
        <dl className="fp-money-metrics">
          <MoneyMetric icon={ArrowUp} tone="fp-tone-green" label="Total Income" amount={amount("Total Income")} detail={overview ? countLabel(overview.activity?.incomeCount, "income") : "Records unavailable"} />
          <MoneyMetric icon={ArrowDown} tone="fp-tone-red" label="Total Expenses" amount={amount("Total Expenses")} detail={overview ? countLabel(overview.activity?.expenseCount, "expense") : "Records unavailable"} />
          <MoneyMetric icon={Equal} tone="fp-tone-neutral" label="Monthly Balance" amount={amount("Total Savings")} detail={overview ? count ? "Income minus expenses" : "Add income and expenses" : "Records unavailable"} />
        </dl>
        <section className="fp-dashboard-recent" aria-labelledby="recent-activity-heading">
          <div className="fp-dashboard-subheading"><h3 id="recent-activity-heading">Recent activity</h3><Link href="/transactions">View all<ArrowRight size={16} aria-hidden="true" /></Link></div>
          {recent.length ? <ul className="fp-dashboard-activity-list">{recent.map((transaction, index) => <li key={`${transaction.date}-${index}`}>
            <span className={`fp-dashboard-metric-icon ${transaction.income ? "fp-tone-green" : "fp-tone-red"}`}>{transaction.income ? <ArrowUp size={18} aria-hidden="true" /> : <ArrowDown size={18} aria-hidden="true" />}</span>
            <div className="fp-dashboard-activity-description"><strong title={transaction.name}>{transaction.name}</strong><span>{transaction.category} · {transaction.date}</span></div>
            <span className={`fp-dashboard-activity-amount ${transaction.income ? "text-primary" : "text-foreground"}`}>{transaction.amount}</span>
          </li>)}</ul> : <div className="fp-dashboard-activity-empty"><span className="fp-dashboard-empty-icon"><FileText size={25} aria-hidden="true" /></span><strong>{overview ? "No transactions yet" : "Your records could not be loaded"}</strong><p>{overview ? `Add income or expenses, or choose a month with past activity.` : "Refresh your overview to try again."}</p></div>}
        </section>
        <div className="fp-dashboard-panel-actions"><Link className="fp-primary-link" href="/transactions">Review your money<ArrowRight size={17} aria-hidden="true" /></Link><Link className="fp-dashboard-plan-link" href="/budget-tracker"><CalendarDays size={18} aria-hidden="true" />Plan this month</Link></div>
      </section>

      <section className="fp-dashboard-panel fp-dashboard-tax" aria-labelledby="tax-outlook">
        <div className="fp-dashboard-panel-heading">
          <span className="fp-dashboard-domain-icon"><Landmark size={28} aria-hidden="true" /></span>
          <div className="min-w-0"><h2 id="tax-outlook">Tax planning</h2><p>Salary estimates and the records behind them.</p></div>
          <div className="fp-dashboard-year"><FinancialYearSelect year={year} /></div>
        </div>
        <dl className="fp-dashboard-tax-estimates">{["old", "new"].map((regime) => <div key={regime} className={`fp-dashboard-tax-estimate fp-estimate-${regime}`}>
          <span className={`fp-dashboard-metric-icon ${regime === "old" ? "fp-tone-green" : "fp-tone-orange"}`}><Coins size={21} aria-hidden="true" /></span>
          <div><dt>{regime === "old" ? "Old regime" : "New regime"} · salary estimate</dt><dd>{tax?.available ? money(tax[regime].tax) : "—"}</dd><p title={tax?.reason}>{tax?.available ? "Estimated annual salary tax" : report ? "Review details to estimate" : "Tax records unavailable"}</p></div>
        </div>)}</dl>
        <section className="fp-dashboard-tax-preparation" aria-labelledby="tax-preparation-heading">
          <h3 id="tax-preparation-heading">Tax preparation</h3>
          {report ? <ProgressLine value={total ? completed / total * 100 : 0} label={`${completed} of ${total} items reviewed`} /> : <p className="text-sm text-muted-foreground">Tax records could not be loaded. Open your tax workspace to retry.</p>}
          <dl className="fp-dashboard-tax-stats">{stats.map((stat) => {const Icon = stat.icon;return <div key={stat.label}><Link href={stat.href} title={stat.title}><span className={`fp-dashboard-stat-icon ${stat.tone}`}><Icon size={20} aria-hidden="true" /></span><div><dd>{stat.value ?? "—"}</dd><dt>{stat.label}</dt></div></Link></div>;})}</dl>
        </section>
        <div className="fp-dashboard-panel-actions"><Link className="fp-primary-link" href={`/taxation?year=${year}`}>Review your tax year<ArrowRight size={17} aria-hidden="true" /></Link><span className="fp-dashboard-scope">Declared data · salary only</span></div>
      </section>
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
