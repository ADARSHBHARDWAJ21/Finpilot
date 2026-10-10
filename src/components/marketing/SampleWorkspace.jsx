"use client";

import { useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/layout/BrandMark";
import SampleTaxWorkspace, { SampleProofChecklist, SampleRegimePair, regimeLabel } from "./SampleTaxWorkspace";
import { buildSampleTaxModel, createSampleTaxYears, SAMPLE_TAX_YEARS } from "./sample-tax-model";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, FileCheck2, LayoutDashboard, RotateCcw, Search, ShieldCheck, Sparkles, Target, Wallet } from "lucide-react";
import styles from "./SampleWorkspace.module.css";

const categories = ["Housing", "Food & dining", "Transport", "Shopping", "Other"];
const categoryColors = ["#5e8065", "#9caf86", "#c4cfae", "#dbcbb0", "#e8e9dc"];
const months = [
  { label: "July 2026", short: "Jul", income: 78000, spending: [18000, 11000, 4000, 6500, 5000] },
  { label: "August 2026", short: "Aug", income: 80000, spending: [18000, 8500, 3500, 5000, 4500] },
  { label: "September 2026", short: "Sep", income: 80000, spending: [18000, 10000, 4000, 6000, 4000] },
];
const views = [{ id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "money", label: "Money", icon: Wallet }, { id: "taxation", label: "Taxation", icon: FileCheck2 }, { id: "copilot", label: "Copilot", icon: Sparkles }];
const questions = [{ id: "spending", label: "Understand my spending", domain: "Money" }, { id: "emi", label: "Explore an EMI", domain: "Money" }, { id: "budget", label: "Check my food budget", domain: "Money" }, { id: "regime", label: "Compare my tax regimes", domain: "Taxation" }, { id: "hra", label: "Explain my HRA exemption", domain: "Taxation" }, { id: "deductions", label: "Understand my deductions", domain: "Taxation" }];
const currency = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

function createTransactions() {
  return months.map(({ income, spending }, monthIndex) => {
    const [housing, food, transport, shopping, other] = spending;
    return [
      { merchant: "Monthly salary", day: "01", amount: income, type: "income", category: "Income" },
      { merchant: "Apartment rent", day: "02", amount: housing, type: "expense", category: "Housing" },
      { merchant: "Fresh groceries", day: "04", amount: food - 3000, type: "expense", category: "Food & dining" },
      { merchant: "Cafés & dining", day: "08", amount: 3000, type: "expense", category: "Food & dining" },
      { merchant: "Metro & cab rides", day: "12", amount: transport, type: "expense", category: "Transport" },
      { merchant: "Everyday purchases", day: "16", amount: shopping, type: "expense", category: "Shopping" },
      { merchant: "Utilities", day: "21", amount: other - 1500, type: "expense", category: "Other" },
      { merchant: "Internet & phone", day: "25", amount: 1500, type: "expense", category: "Other" },
    ].map((row, index) => ({ ...row, id: `${monthIndex}-${index}`, reviewed: false }));
  });
}

function summarizeRows(rows) {
  const income = rows.filter(row => row.type === "income").reduce((sum, row) => sum + row.amount, 0);
  const spending = rows.filter(row => row.type === "expense").reduce((sum, row) => sum + row.amount, 0);
  const totals = categories.map(category => rows.filter(row => row.type === "expense" && row.category === category).reduce((sum, row) => sum + row.amount, 0));
  return { income, spending, available: income - spending, totals };
}

function MoneyOverview({ allRows, monthIndex, onMonthChange, onViewChange }) {
  const { income, spending, available, totals } = summarizeRows(allRows[monthIndex]);
  const segments = totals.map((total, index) => {
    const start = totals.slice(0, index).reduce((sum, value) => sum + value, 0) / spending * 100;
    return `${categoryColors[index]} ${start}% ${start + total / spending * 100}%`;
  }).join(",");
  const food = totals[categories.indexOf("Food & dining")];
  return <>
    <div className={styles.stats} aria-label="Sample monthly totals">{[{ label: "Income", amount: income, note: "Recorded salary", icon: ArrowUpRight }, { label: "Spending", amount: spending, note: `${allRows[monthIndex].filter(row => row.type === "expense").length} sample expenses`, icon: Wallet }, { label: "Available", amount: available, note: "Before savings & commitments", icon: Target }].map(({ label, amount, note, icon: Icon }) => <article key={label}><div><span>{label}</span><Icon size={17} strokeWidth={1.5} /></div><strong>{currency(amount)}</strong><p>{note}</p></article>)}</div>
    <div className={styles.overviewGrid}>
      <section className={styles.card} aria-labelledby="cashflow-heading"><div className={styles.cardHeading}><h2 id="cashflow-heading">A little perspective.</h2><span>Sample cash flow</span></div><div className={styles.legend}><span><i />Income</span><span><i />Spending</span></div><div className={styles.chart}>{months.map((month, index) => {
        const totals = summarizeRows(allRows[index]);
        return <button type="button" key={month.short} aria-label={`View ${month.label}: income ${currency(totals.income)}, spending ${currency(totals.spending)}`} aria-pressed={monthIndex === index} onClick={() => onMonthChange(index)}><div className={styles.bars} aria-hidden="true"><span style={{ height: `${totals.income / 85000 * 100}%` }} /><span style={{ height: `${totals.spending / 85000 * 100}%` }} /></div><span>{month.short}</span></button>;
      })}</div><p className={styles.hint}>Choose a month to explore its numbers.</p></section>
      <section className={styles.card} aria-labelledby="spending-heading"><div className={styles.cardHeading}><h2 id="spending-heading">Where it goes.</h2><span>{months[monthIndex].short}</span></div><div className={styles.spendingContent}><div className={styles.donut} style={{ background: `conic-gradient(${segments})` }} aria-hidden="true"><div><span>Total</span><strong>{currency(spending)}</strong></div></div><ul className={styles.categoryList}>{categories.map((category, index) => <li key={category}><i style={{ background: categoryColors[index] }} /><span>{category}</span><strong>{currency(totals[index])}</strong></li>)}</ul></div><button type="button" className={styles.textButton} onClick={() => onViewChange("transactions")}>Review the transactions<ArrowRight size={15} /></button></section>
      <section className={`${styles.card} ${styles.goalCard}`} aria-labelledby="goal-heading"><div className={styles.cardHeading}><h2 id="goal-heading">Room for a goal.</h2><Target size={18} /></div><p>Emergency fund</p><div className={styles.goalAmount}><strong>₹96,000</strong><span>of ₹1,50,000</span></div><div className={styles.progress}><span style={{ width: "64%" }} /></div><p className={styles.hint}>64% of an illustrative savings goal.</p></section>
      <section className={styles.card} aria-labelledby="budget-heading"><div className={styles.cardHeading}><h2 id="budget-heading">A budget to revisit.</h2><span>Food & dining</span></div><div className={styles.goalAmount}><strong>{currency(food)}</strong><span>of ₹11,000</span></div><div className={styles.progress} data-over={food > 11000}><span style={{ width: `${Math.min(100, food / 11000 * 100)}%` }} /></div><p className={styles.hint}>{food <= 11000 ? `${currency(11000 - food)} left in this sample category budget.` : `${currency(food - 11000)} over this sample category budget.`}</p><button type="button" className={styles.textButton} onClick={() => onViewChange("copilot")}>See the bigger picture<Sparkles size={14} /></button></section>
    </div>
  </>;
}

function BalancedOverview({ rows, monthIndex, taxModel, onTaxChange, onViewChange, onAskCopilot }) {
  const { income, spending, available, totals } = summarizeRows(rows);
  return <>
    <div className={styles.balancedGrid}>
      <section className={`${styles.card} ${styles.domainCard}`} aria-labelledby="money-glance-heading">
        <div className={styles.domainHeader}><span className={styles.domainKicker}><Wallet size={16} />Money management</span><span>{months[monthIndex].label}</span></div>
        <h2 id="money-glance-heading">Make sense of your month.</h2><p>Your income, everyday spending and room for what comes next.</p>
        <dl className={styles.glanceNumbers}>{[{ label: "Income", value: income }, { label: "Spending", value: spending }, { label: "Available before savings", value: available }].map(item => <div key={item.label}><dt>{item.label}</dt><dd>{currency(item.value)}</dd></div>)}</dl>
        <button type="button" className={styles.domainButton} onClick={() => onViewChange("money")}>Explore monthly finances<ArrowRight size={16} /></button>
      </section>
      <section className={`${styles.card} ${styles.domainCard} ${styles.taxTint}`} aria-labelledby="tax-glance-heading">
        <div className={styles.domainHeader}><span className={styles.domainKicker}><FileCheck2 size={16} />Tax planning</span><span>FY {taxModel.year}</span></div>
        <h2 id="tax-glance-heading">Make room for a calmer tax year.</h2><p>Salary estimates, deductions and the records behind your return.</p><SampleRegimePair model={taxModel} />
        <dl className={styles.taxGlanceDetails}><div><dt>Sample annual gross salary</dt><dd>{taxModel.available ? currency(taxModel.tax.annualSalary) : "Complete inputs"}</dd></div><div><dt>Old-regime eligible deductions</dt><dd>{taxModel.available ? currency(taxModel.totalOldDeductions) : "—"}</dd></div></dl>
        <button type="button" className={styles.domainButton} onClick={() => onViewChange("taxation")}>Explore your tax year<ArrowRight size={16} /></button>
      </section>
      <section className={styles.card} aria-labelledby="sample-records-heading"><div className={styles.cardHeading}><h2 id="sample-records-heading">Review everyday records.</h2><span>Money</span></div><div className={styles.miniTransactions}>{rows.filter(row => row.type === "expense").slice(0, 4).map(row => <div key={row.id}><span><strong>{row.merchant}</strong><small>{row.category}</small></span><strong>−{currency(row.amount)}</strong></div>)}</div><p className={styles.hint}>Food & dining: {currency(totals[1])} against a sample ₹11,000 budget.</p><button type="button" className={styles.textButton} onClick={() => onViewChange("transactions")}>Try reviewing transactions<ArrowRight size={15} /></button></section>
      <section className={styles.card} aria-labelledby="tax-records-heading"><div className={styles.cardHeading}><h2 id="tax-records-heading">Prepare your tax records.</h2><span>Taxation</span></div><SampleProofChecklist model={taxModel} onChange={onTaxChange} compact /><button type="button" className={styles.textButton} onClick={() => onViewChange("taxation")}>Try deductions, HRA & filing prep<ArrowRight size={15} /></button></section>
    </div>
    <section className={styles.sharedCopilot} aria-label="Money and tax Copilot examples"><div><Sparkles size={21} /><span><strong>One Copilot. Both sides of your finances.</strong><small>Explore spending decisions and salary tax questions with sample context.</small></span></div><div><button type="button" onClick={() => onAskCopilot("spending")}>Ask about money<ArrowUpRight size={14} /></button><button type="button" onClick={() => onAskCopilot("regime")}>Ask about taxes<ArrowUpRight size={14} /></button></div></section>
  </>;
}

function Transactions({ rows, monthIndex, onRowChange }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All categories");
  const filtered = rows.filter(row => (filter === "All categories" || row.category === filter) && row.merchant.toLowerCase().includes(query.toLowerCase()));
  const reviewed = rows.filter(row => row.reviewed).length;
  return <section className={styles.card} aria-labelledby="transactions-heading"><div className={styles.cardHeading}><div><h2 id="transactions-heading">Review before you decide.</h2><p className={styles.hint}>Try changing a category. Your sample summaries update too.</p></div><span role="status">{reviewed} of {rows.length} reviewed</span></div>
    <div className={styles.filters}><label className={styles.search}><Search size={16} /><span className="sr-only">Search sample transactions</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search transactions…" /></label><label><span className="sr-only">Filter sample category</span><select value={filter} onChange={event => setFilter(event.target.value)}>{["All categories", "Income", ...categories].map(category => <option key={category}>{category}</option>)}</select></label></div>
    <div className={styles.transactionLabels} aria-hidden="true"><span>Transaction</span><span>Category</span><span>Amount</span><span>Review</span></div>
    <div className={styles.transactionRows}>{filtered.map(row => <div key={row.id} className={styles.transactionRow}><div className={styles.merchant}><span className={styles.rowIcon}>{row.type === "income" ? <ArrowUpRight size={17} /> : <Wallet size={17} />}</span><div><strong>{row.merchant}</strong><span>{row.day} {months[monthIndex].short} 2026</span></div></div><div className={styles.categoryCell}>{row.type === "income" ? <span className={styles.incomeChip}>Income</span> : <label><span className="sr-only">Category for {row.merchant}</span><select value={row.category} onChange={event => onRowChange(row.id, { category: event.target.value, reviewed: false })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>}</div><strong className={styles.amount} data-income={row.type === "income"}>{row.type === "income" ? "+" : "−"}{currency(row.amount)}</strong><label className={styles.review}><input type="checkbox" checked={row.reviewed} onChange={event => onRowChange(row.id, { reviewed: event.target.checked })} /><span className="sr-only">Review {row.merchant}</span></label></div>)}</div>
    {filtered.length === 0 && <p className={styles.empty} role="status">No sample transactions match. Try another category or search.</p>}
    <div className={styles.reviewFooter}><span role="status">{filtered.length} of {rows.length} sample transactions shown</span><button type="button" className={styles.outlineButton} disabled={filtered.length === 0 || filtered.every(row => row.reviewed)} onClick={() => filtered.forEach(row => onRowChange(row.id, { reviewed: true }))}><Check size={15} />Mark shown as reviewed</button></div>
  </section>;
}

function Copilot({ rows, monthIndex, initialQuestion, taxModel }) {
  const [question, setQuestion] = useState(initialQuestion);
  const [emi, setEmi] = useState("10000");
  const { income, spending, available, totals } = summarizeRows(rows);
  const largest = totals.indexOf(Math.max(...totals));
  const food = totals[categories.indexOf("Food & dining")];
  const validEmi = emi.trim() !== "" && Number.isFinite(Number(emi)) && Number(emi) >= 0 && Number(emi) <= 100000;
  const afterEmi = available - Number(emi);
  const moneyQuestion = ["spending", "emi", "budget"].includes(question);
  const taxAnswer = !taxModel.available ? "Complete the salary and deduction amounts in the Taxation view to explore this sample tax question." : question === "regime"
    ? `For FY ${taxModel.year}, the sample old-regime estimate is ${currency(taxModel.tax.old.tax)} and the new-regime estimate is ${currency(taxModel.tax.new.tax)}. ${taxModel.tax.recommended === "equal" ? "Both estimates are equal." : `${regimeLabel(taxModel.tax.recommended)} is lower by ${currency(taxModel.tax.difference)}.`} This compares ordinary salary income, including applicable rebates and cess; it excludes banking interest, capital gains and side income.`
    : question === "hra"
      ? `The sample old-regime HRA exemption is ${currency(taxModel.tax.old.deductions.hra)}. It uses the lowest eligible amount among ${currency(Number(taxModel.profile.annualHra))} HRA received, 40% of ${currency(Number(taxModel.profile.annualBasic))} basic salary, and ${currency(Number(taxModel.profile.monthlyRent) * 12)} annual rent minus 10% of basic salary, with a floor of zero. This sample assumes 12 rental months in a non-metro city. HRA exemption is excluded from the new-regime estimate.`
      : `The sample old regime uses ${currency(taxModel.totalOldDeductions)} in eligible deductions, including standard deduction, 80C, health insurance, personal NPS and HRA. Annual amounts are capped by the shared tax engine. The new-regime salary estimate uses its own ${currency(taxModel.tax.new.deductions.standard)} standard deduction, without carrying those old-regime deductions across. Change inputs in Taxation to explore the difference.`;
  const answer = !moneyQuestion ? taxAnswer : question === "spending"
    ? `${categories[largest]} is the largest sample category at ${currency(totals[largest])}, or ${Math.round(totals[largest] / spending * 100)}% of your ${currency(spending)} spending. Your recorded income less spending is ${currency(available)}, before savings and other commitments.`
    : question === "budget"
      ? `Food & dining totals ${currency(food)} against the sample ₹11,000 budget. That is ${food <= 11000 ? `${currency(11000 - food)} remaining` : `${currency(food - 11000)} over the limit`}. Change a transaction category to see how this explanation changes.`
      : validEmi ? `${currency(income)} income − ${currency(spending)} spending − ${currency(Number(emi))} EMI = ${currency(afterEmi)}. ${afterEmi >= 0 ? "This is the sample balance before savings and other commitments." : "The EMI exceeds the sample monthly balance by " + currency(Math.abs(afterEmi)) + "."}` : null;
  return <div className={styles.copilotGrid}><div className={styles.contextStack}><section className={styles.card} aria-labelledby="copilot-context-heading"><div className={styles.cardHeading}><h2 id="copilot-context-heading">Your month.</h2><Wallet size={17} /></div><p className={styles.hint}>{months[monthIndex].label} · Sample money context</p><dl className={styles.context}>{[{ label: "Income", value: income }, { label: "Spending", value: spending }, { label: "Available before savings", value: available }].map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{currency(value)}</dd></div>)}</dl></section><section className={`${styles.card} ${styles.taxTint}`} aria-labelledby="copilot-tax-context-heading"><div className={styles.cardHeading}><h2 id="copilot-tax-context-heading">Your tax year.</h2><FileCheck2 size={17} /></div><p className={styles.hint}>FY {taxModel.year} · Sample salary context</p><dl className={styles.context}>{[{ label: "Annual gross salary", value: taxModel.available ? currency(taxModel.tax.annualSalary) : "—" }, { label: "Lower tax estimate", value: taxModel.available ? currency(Math.min(taxModel.tax.old.tax, taxModel.tax.new.tax)) : "—" }, { label: "Comparison", value: taxModel.available ? regimeLabel(taxModel.tax.recommended) : "Complete inputs" }].map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section><p className={styles.contextNote}><ShieldCheck size={15} />Illustrative records and calculated examples. No live AI request is sent.</p></div>
    <section className={`${styles.card} ${styles.copilotCard}`} aria-labelledby="copilot-heading"><div className={styles.cardHeading}><h2 id="copilot-heading"><Sparkles size={19} />A thoughtful second perspective.</h2><span>Example</span></div><p className={styles.hint}>Explore everyday money and your salary tax year.</p><div className={styles.questionGroups}>{["Money", "Taxation"].map(domain => <div key={domain}><h3>{domain}</h3><div className={styles.questions} aria-label={`${domain} Copilot questions`}>{questions.filter(item => item.domain === domain).map(item => <button key={item.id} type="button" aria-pressed={question === item.id} onClick={() => setQuestion(item.id)}>{item.label}<ArrowUpRight size={14} /></button>)}</div></div>)}</div>
      {question === "emi" && <label className={styles.emiInput}><span>Try a monthly EMI amount</span><div><span aria-hidden="true">₹</span><input type="number" inputMode="numeric" min="0" max="100000" step="500" value={emi} onChange={event => setEmi(event.target.value)} aria-label="Sample monthly EMI amount" aria-invalid={!validEmi} aria-describedby={!validEmi ? "emi-error" : undefined} /></div>{!validEmi && <span id="emi-error" className={styles.error}>Enter an amount from ₹0 to ₹1,00,000.</span>}</label>}
      <div className={styles.copilotAnswer} role="status"><span><Sparkles size={16} />Finpilot sample explanation</span><p>{answer ?? "Choose a valid EMI amount to see the calculation."}</p></div><p className={styles.hint}>In your own workspace, Gemini Copilot can answer questions using your saved financial summary.</p><Link href="/auth/signup" className={styles.textButton}>Create your own workspace<ArrowRight size={15} /></Link>
    </section></div>;
}

export default function SampleWorkspace({ initialView = "overview", initialQuestion = "spending" }) {
  const [view, setView] = useState(initialView === "transactions" ? "money" : initialView);
  const [moneySection, setMoneySection] = useState(initialView === "transactions" ? "transactions" : "overview");
  const [monthIndex, setMonthIndex] = useState(2);
  const [allRows, setAllRows] = useState(createTransactions);
  const [resetCount, setResetCount] = useState(0);
  const [taxYear, setTaxYear] = useState("2026-27");
  const [taxYears, setTaxYears] = useState(createSampleTaxYears);
  const [copilotQuestion, setCopilotQuestion] = useState(initialQuestion);
  const taxModel = buildSampleTaxModel(taxYear, taxYears[taxYear]);
  function onTaxChange(changes) { setTaxYears(current => ({ ...current, [taxYear]: { ...current[taxYear], ...changes } })); }
  function navigateView(nextView) { if (nextView === "transactions") { setMoneySection("transactions"); setView("money"); } else { setView(nextView); if (nextView === "money") setMoneySection("overview"); } }
  function askCopilot(question) { setCopilotQuestion(question); setView("copilot"); }
  function onRowChange(id, changes) {
    setAllRows(current => current.map((rows, index) => index === monthIndex ? rows.map(row => row.id === id ? { ...row, ...changes } : row) : rows));
  }
  function resetDemo() { setAllRows(createTransactions()); setMonthIndex(2); setTaxYears(createSampleTaxYears()); setTaxYear("2026-27"); setCopilotQuestion(initialQuestion); setResetCount(count => count + 1); }
  return <div className={styles.workspace}>
    <header className={styles.header}><Link href="/" className={styles.brand} aria-label="Finpilot home"><BrandMark />finpilot<span>.</span></Link><span className={styles.sampleBadge}>Sample workspace</span><div className={styles.headerActions}><Link href="/" className={styles.backLink}><ArrowLeft size={15} />Back to home</Link><Link href="/auth/signup" className={styles.primaryButton}>Make it yours<ArrowUpRight size={16} /></Link></div></header>
    <main className={styles.main}><div className={styles.intro}><div><p className={styles.eyebrow}>Everyday money. A more organised tax year.</p><h1>Your money and taxes.<br /><span>One clearer view.</span></h1><p>Explore both sides of Finpilot. Start with a month or a tax year.</p></div><div className={styles.introControls}>{view !== "taxation" && <label className={styles.monthPicker}><span className={styles.pickerLabel}>Money month</span><span className="sr-only">Sample month</span><select aria-label="Sample month" value={monthIndex} onChange={event => setMonthIndex(Number(event.target.value))}>{months.map((month, index) => <option key={month.label} value={index}>{month.label}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></label>}{view !== "money" && <label className={styles.monthPicker}><span className={styles.pickerLabel}>Tax year</span><span className="sr-only">Sample tax year</span><select aria-label="Sample tax year" value={taxYear} onChange={event => setTaxYear(event.target.value)}>{SAMPLE_TAX_YEARS.map(year => <option key={year} value={year}>FY {year}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></label>}<button type="button" className={styles.resetButton} onClick={resetDemo}><RotateCcw size={14} />Reset demo</button></div></div>
      <div className={styles.notice}><ShieldCheck size={17} /><p><strong>Try it freely.</strong> All figures are illustrative. Changes stay in this tab and reset when you reload. No signup needed.</p></div>
      <nav className={styles.viewNav} aria-label="Sample workspace views">{views.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={view === id} aria-controls="sample-workspace-panel" onClick={() => navigateView(id)}><Icon size={17} strokeWidth={1.6} />{label}</button>)}</nav>
      <div id="sample-workspace-panel" className={styles.viewPanel} key={`${view}-${resetCount}`}>
        {view === "overview" && <BalancedOverview rows={allRows[monthIndex]} monthIndex={monthIndex} taxModel={taxModel} onTaxChange={onTaxChange} onViewChange={navigateView} onAskCopilot={askCopilot} />}
        {view === "money" && <><div className={styles.moneySubnav} aria-label="Money sample sections"><button type="button" aria-pressed={moneySection === "overview"} onClick={() => setMoneySection("overview")}>Monthly overview</button><button type="button" aria-pressed={moneySection === "transactions"} onClick={() => setMoneySection("transactions")}>Review transactions</button></div>{moneySection === "overview" ? <MoneyOverview allRows={allRows} monthIndex={monthIndex} onMonthChange={setMonthIndex} onViewChange={navigateView} /> : <Transactions rows={allRows[monthIndex]} monthIndex={monthIndex} onRowChange={onRowChange} />}</>}
        {view === "taxation" && <SampleTaxWorkspace model={taxModel} onChange={onTaxChange} onAskCopilot={askCopilot} />}
        {view === "copilot" && <Copilot key={copilotQuestion} rows={allRows[monthIndex]} monthIndex={monthIndex} initialQuestion={copilotQuestion} taxModel={taxModel} />}
      </div>
      <div className={styles.bottomCta}><div><strong>A home for your money and your tax year.</strong><p>Start with your own records. Review finances and salary tax planning together.</p></div><Link href="/auth/signup" className={styles.primaryButton}>Create workspace<ArrowRight size={16} /></Link></div>
    </main><footer className={styles.footer}>Finpilot · Sample experience with illustrative data.</footer>
  </div>;
}
