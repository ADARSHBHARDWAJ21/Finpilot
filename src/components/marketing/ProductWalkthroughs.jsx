"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCheck, FileText, FolderOpen, ShieldCheck, Sparkles, Upload, Wallet } from "lucide-react";
import styles from "./ProductWalkthroughs.module.css";

const sampleTransactions = [
  { merchant: "Monthly salary", date: "01 Sep", amount: "+₹80,000", category: "Income", credit: true },
  { merchant: "Fresh groceries", date: "03 Sep", amount: "−₹1,200", category: "Groceries" },
  { merchant: "Neighbourhood café", date: "05 Sep", amount: "−₹850", category: "Food & dining" },
];
const proofItems = ["Salary documents", "Rent & HRA", "Banking & investments", "Filing checklist"];
const copilotTopics = [
  { label: "Spending", question: "Where is most of my spending going?", answer: "Housing accounts for ₹18,000 of your sample ₹42,000 spending. Start there when reviewing your monthly budget." },
  { label: "EMI planning", question: "What changes with a ₹10,000 EMI?", answer: "Your sample monthly balance of ₹38,000 becomes ₹28,000 after the EMI, before savings and other commitments." },
];

function PreviewHeader({ icon: Icon, title }) {
  return <div className={styles.previewHeader}><span><Icon size={17} strokeWidth={1.7} />{title}</span><span className={styles.sample}>Sample</span></div>;
}

function ImportPreview() {
  const [categories, setCategories] = useState(sampleTransactions.map(row => row.category));
  const [approved, setApproved] = useState(false);
  return <div className={`${styles.preview} ${styles.importPreview}`} role="region" aria-label="Statement import sample">
    <PreviewHeader icon={Upload} title="Statement import" />
    <div className={styles.fileRow}><span className={styles.fileIcon}><FileText size={24} strokeWidth={1.5} /></span><div><strong>monthly-statement.pdf</strong><span>Sample statement · 3 transactions</span></div><span className={styles.fileCheck}><Check size={16} /></span></div>
    <div className={styles.importTrack} aria-hidden="true"><span /><span /><span /></div>
    <div className={styles.reviewHeading}><strong>{approved ? "Sample review complete" : "Review your transactions"}</strong><span>{approved ? "3 reviewed" : "Choose a category"}</span></div>
    <div className={styles.transactionList}>{sampleTransactions.map((row, index) => <div key={row.merchant} className={styles.transactionRow}>
      <span className={styles.transactionCheck}><Check size={12} /></span><div className={styles.merchant}><strong>{row.merchant}</strong><span>{row.date}</span></div><strong className={styles.transactionAmount} data-credit={row.credit}>{row.amount}</strong>
      <label className={styles.categorySelect}><span className="sr-only">Category for {row.merchant}</span><select value={categories[index]} onChange={event => { setCategories(current => current.map((category, i) => i === index ? event.target.value : category)); setApproved(false); }}>{["Income", "Groceries", "Food & dining", "Shopping", "Transport", "Other"].map(category => <option key={category}>{category}</option>)}</select></label>
    </div>)}</div>
    <div className={styles.importBottom}><span role="status">{approved ? "Example approved. Your account stays unchanged." : "You decide what gets imported."}</span><button type="button" onClick={() => setApproved(current => !current)}>{approved ? <><CheckCheck size={14} />Reviewed</> : <>Approve sample<ArrowRight size={14} /></>}</button></div>
  </div>;
}

function TaxPreview() {
  const [checked, setChecked] = useState([true, true, false, false]);
  const completed = checked.filter(Boolean).length;
  return <div className={`${styles.preview} ${styles.taxPreview}`} role="region" aria-label="Tax planning sample">
    <PreviewHeader icon={FolderOpen} title="Your tax workspace" />
    <div className={styles.taxHeading}><div><span>A little more prepared</span><strong>Your year, in one place.</strong></div><span className={styles.year}>FY 2025–26</span></div>
    <div className={styles.checklistProgress}><span style={{ width: `${completed / proofItems.length * 100}%` }} /></div>
    <p className={styles.checklistCount} role="status">{completed} of {proofItems.length} sample sections reviewed</p>
    <div className={styles.proofList}>{proofItems.map((label, index) => <label key={label} className={styles.proofRow}><input type="checkbox" checked={checked[index]} onChange={() => setChecked(current => current.map((value, i) => i === index ? !value : value))} /><span>{label}</span><span>{checked[index] ? "Reviewed" : "To review"}</span></label>)}</div>
    <div className={styles.regimePair}><span><FileText size={16} /><strong>Old regime</strong></span><span><Sparkles size={16} /><strong>New regime</strong></span></div>
    <p className={styles.previewNote}><ShieldCheck size={13} />Organise proofs. Compare salary estimates.</p>
  </div>;
}

function CopilotContextPreview() {
  const [topic, setTopic] = useState(0);
  const example = copilotTopics[topic];
  return <div className={`${styles.preview} ${styles.contextPreview}`} role="region" aria-label="Copilot financial context sample">
    <PreviewHeader icon={Sparkles} title="Clarity, with context" />
    <div className={styles.contextHeading}><Wallet size={15} /><span>Your saved financial summary</span></div>
    <div className={styles.contextFigures}>{[{ label: "Income", value: "₹80,000" }, { label: "Spending", value: "₹42,000" }, { label: "Balance", value: "₹38,000" }].map(figure => <div key={figure.label}><span>{figure.label}</span><strong>{figure.value}</strong></div>)}</div>
    <div className={styles.contextConnection} aria-hidden="true"><span /><Sparkles size={17} /><span /></div>
    <div className={styles.topicButtons} aria-label="Choose a financial question">{copilotTopics.map(({ label }, index) => <button key={label} type="button" aria-pressed={topic === index} onClick={() => setTopic(index)}>{label}</button>)}</div>
    <div key={topic} className={styles.contextAnswer}><p className={styles.contextQuestion}>{example.question}</p><div><Sparkles size={15} /><strong>Finpilot Copilot</strong></div><p>{example.answer}</p></div>
    <p className={styles.previewNote}><FileText size={13} />Illustrative answer using sample figures</p>
  </div>;
}

const walkthroughs = [
  { number: "01", icon: Upload, label: "From statement to a clear picture", title: <>Your records.<br /><span>Ready to make sense.</span></>, body: "Bring a bank statement and turn it into a reviewable transaction list. Keep the details that matter, with the final say on what you import.", points: ["CSV, Excel, PDF and statement photos", "Review dates, amounts and suggested categories", "Change a category before importing"], link: "Start with a statement", Preview: ImportPreview },
  { number: "02", icon: FileText, label: "A calmer tax year", title: <>Everything together.<br /><span>Nothing to chase.</span></>, body: "Give salary details, tax proofs and yearly declarations a home. Revisit a financial year and see your salary tax estimates side by side.", points: ["A workspace for each financial year", "Private proof uploads and editable checklists", "Salary regime comparisons and downloadable records"], link: "Organise your tax year", Preview: TaxPreview },
  { number: "03", icon: Sparkles, label: "A thoughtful second perspective", title: <>Ask a question.<br /><span>See the bigger picture.</span></>, body: "Explore spending and future commitments with your saved financial summary in view. Copilot brings your numbers into the conversation.", points: ["Explore spending, salary taxes and EMI scenarios", "Explanations with calculation assumptions", "Continue the conversation in saved chats"], link: "Meet your Copilot", Preview: CopilotContextPreview },
];

export default function ProductWalkthroughs() {
  return <div className={styles.walkthroughs}>{walkthroughs.map(({ number, icon: Icon, label, title, body, points, link, Preview }, index) => <article key={number} id={index === 1 ? "tax-workspace" : undefined} className={styles.walkthrough} data-reverse={index % 2 === 1}>
    <div className={styles.copy} data-reveal><span className={styles.featureKicker}><Icon size={15} />{label}</span><h3>{title}</h3><p>{body}</p><ul>{points.map(point => <li key={point}><Check size={14} />{point}</li>)}</ul><Link href="/auth/signup" className={styles.featureLink}>{link}<ArrowRight size={16} /></Link></div>
    <div className={styles.visual} data-reveal style={{ "--reveal-delay": "100ms" }}><span className={styles.visualNumber} aria-hidden="true">{number}</span><Preview /></div>
  </article>)}</div>;
}

export function ImportJourney() {
  const journeySteps = [
    { title: "Upload your statement", body: "Bring a CSV, Excel file, PDF or photo of your statement.", icon: Upload },
    { title: "Review the transactions", body: "Check the details and choose categories before importing.", icon: CheckCheck },
    { title: "Understand your money", body: "See your spending, explore your month and ask Copilot.", icon: Sparkles },
  ];
  return <div className={styles.journey} data-journey>
    <div className={styles.journeyTrack} aria-hidden="true"><span /></div>
    <ol className={styles.journeyList}>{journeySteps.map(({ title, body, icon: Icon }, index) => <li key={title} className={styles.journeyStep} data-reveal style={{ "--reveal-delay": `${index * 100}ms` }}>
      <span className={styles.journeyIcon}><Icon size={22} strokeWidth={1.5} /></span><div className={styles.journeyContent}><span className={styles.journeyNumber}>0{index + 1}</span><h3>{title}</h3><p>{body}</p>
        <div className={styles.journeyIllustration} aria-hidden="true">{index === 0 ? <div className={styles.journeyFile}><FileText size={29} strokeWidth={1.3} /><span>monthly-statement.pdf<small>Your starting point</small></span><Check size={15} /></div> : index === 1 ? <div className={styles.journeyReview}><span><Check size={12} />Fresh groceries<strong>₹1,200</strong></span><span><Check size={12} />Neighbourhood café<strong>₹850</strong></span><small>Review first. Import when ready.</small></div> : <div className={styles.journeySummary}><span className={styles.journeyRing} /><div><small>Sample monthly spending</small><strong>₹42,000</strong><span>A clearer picture.</span></div></div>}</div>
      </div>
    </li>)}</ol>
  </div>;
}
