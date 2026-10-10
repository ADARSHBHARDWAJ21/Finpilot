"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/layout/BrandMark";
import { ArrowDown, ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, FileText, LayoutDashboard, MessageSquare, Sparkles, Target, Wallet } from "lucide-react";
import styles from "./LandingPage.module.css";

const features = [
  { icon: Wallet, label: "A clearer everyday", title: "Know where your money goes.", body: "Import your bank statement, review the transactions, and bring your spending into one organised view." },
  { icon: FileText, label: "A calmer tax season", title: "Keep the whole year together.", body: "Compare salary tax regimes, organise your proofs, and revisit the numbers for each financial year." },
  { icon: Target, label: "Room for what matters", title: "Make a plan you can follow.", body: "Set budgets and savings goals. Explore how a planned purchase or EMI could fit into your monthly cash flow." },
  { icon: MessageSquare, label: "A little guidance", title: "Ask your financial Copilot.", body: "Explore questions about your saved financial information with AI explanations and built-in calculations." },
  { icon: CalendarDays, label: "Less to remember", title: "Give important dates a home.", body: "Keep reminders and goal milestones in your calendar, with an export for the calendar you already use." },
  { icon: LayoutDashboard, label: "The bigger picture", title: "Look back. Move forward.", body: "Browse previous months and download reports to understand the progress behind your everyday decisions." },
];
const faqs = [
  { q: "Who is Finpilot for?", a: "Finpilot brings spending, budgets, goals, and Indian salary tax planning into one workspace. It is especially useful when you want to organise your own records and review them before making a decision." },
  { q: "How do I add my transactions?", a: "Add them manually or import a CSV, Excel file, PDF statement, or statement image. You can review extracted transactions and change their categories before importing. Document layouts and image quality can affect extraction." },
  { q: "Does Finpilot file my tax return?", a: "Finpilot helps you organise tax information, estimate salary tax, compare regimes, and export your records. It does not submit a tax return or replace a professional review of complex income." },
  { q: "Do I need to connect my bank account?", a: "No. You can start with a statement upload or manual transactions. Live bank feeds are not required for the current workspace." },
];
const months = [
  { name: "Apr", income: 78000, spending: 38600 },
  { name: "May", income: 85000, spending: 43200 },
  { name: "Jun", income: 82000, spending: 39500 },
  { name: "Jul", income: 91000, spending: 57800 },
  { name: "Aug", income: 88000, spending: 41700 },
  { name: "Sep", income: 92500, spending: 41800 },
];
const steps = [
  { title: "Bring your records", body: "Start with a bank statement, add your income, or enter a few transactions.", icon: FileText },
  { title: "Review the details", body: "Check imported records, choose categories, and fill in the information that matters to you.", icon: Check },
  { title: "Find your next step", body: "Explore your month, organise tax proofs, and make space for your next goal.", icon: Sparkles },
];
const money = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function useLandingMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer;
    let scrollFrame = 0;
    function updateScroll() {
      scrollFrame = 0;
      const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      root.style.setProperty("--page-progress", String(Math.min(1, window.scrollY / distance)));
      root.style.setProperty("--hero-shift", `${Math.min(window.scrollY, 650) * 0.045}px`);
      root.dataset.scrolled = String(window.scrollY > 24);
    }
    function onScroll() {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
    }
    function configureMotion() {
      observer?.disconnect();
      root.dataset.motion = preference.matches ? "reduced" : "on";
      if (preference.matches || !("IntersectionObserver" in window)) {
        root.querySelectorAll("[data-reveal]").forEach(element => { element.dataset.visible = "true"; });
        return;
      }
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });
      root.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
    }
    configureMotion();
    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    preference.addEventListener("change", configureMotion);
    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      preference.removeEventListener("change", configureMotion);
    };
  }, [rootRef]);
}

function Amount({ value }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    if (from === value) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame;
    let started;
    const animate = time => {
      started ??= time;
      const progress = reduced ? 1 : Math.min(1, (time - started) / 650);
      const amount = Math.round(from + (value - from) * (1 - Math.pow(1 - progress, 3)));
      previous.current = amount;
      setDisplay(amount);
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);
  return <span className={styles.amount} aria-label={`₹${money.format(value)}`}><span aria-hidden="true">₹{money.format(display)}</span></span>;
}

function Brand() {
  return <Link href="/" className={styles.brand} aria-label="Finpilot home"><BrandMark />finpilot<span>.</span></Link>;
}

function WorkspacePreview() {
  const [selected, setSelected] = useState(5);
  const month = months[selected];
  const frameRef = useRef(null);
  const pointerFrame = useRef(0);
  useEffect(() => () => window.cancelAnimationFrame(pointerFrame.current), []);
  function movePreview(event) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    window.cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = window.requestAnimationFrame(() => {
      frameRef.current?.style.setProperty("--tilt-x", `${-y * 3}deg`);
      frameRef.current?.style.setProperty("--tilt-y", `${x * 3}deg`);
    });
  }
  function resetPreview() {
    window.cancelAnimationFrame(pointerFrame.current);
    frameRef.current?.style.setProperty("--tilt-x", "0deg");
    frameRef.current?.style.setProperty("--tilt-y", "0deg");
  }
  return (
    <div className={styles.previewScene} data-reveal style={{ "--reveal-delay": "180ms" }}>
      <div className={styles.previewHalo} aria-hidden="true" />
      <div className={styles.previewPointer} onPointerMove={movePreview} onPointerLeave={resetPreview}>
        <div ref={frameRef} className={styles.previewCard}>
          <div className={styles.previewHeader}><div><span className={styles.miniIcon}><LayoutDashboard size={16} /></span><span>Your overview</span></div><span className={styles.sampleLabel}>Interactive sample</span></div>
          <div className={styles.balanceLabel}>Available in {month.name}<span className={styles.liveDot} aria-hidden="true" /></div>
          <div className={styles.balance}><Amount value={month.income - month.spending} /><span>.00</span></div>
          <div className={styles.summary}>
            <div><span className={styles.incomeIcon}><ArrowDownLeft size={16} /></span><div><span>Income</span><strong><Amount value={month.income} /></strong></div></div>
            <div><span className={styles.spendingIcon}><ArrowUpRight size={16} /></span><div><span>Spending</span><strong><Amount value={month.spending} /></strong></div></div>
          </div>
          <span className="sr-only" aria-live="polite">{month.name} sample: available ₹{money.format(month.income - month.spending)}, income ₹{money.format(month.income)}, spending ₹{money.format(month.spending)}.</span>
          <div className={styles.chart}>
            <div className={styles.chartHeading}><span>Monthly cash flow</span><span><i /> Income <i /> Spending</span></div>
            <div className={styles.chartGrid} aria-hidden="true"><span /><span /><span /></div>
            <div className={styles.chartBars}>
              {months.map((item, i) => <button key={item.name} type="button" className={styles.monthColumn} aria-pressed={selected === i} aria-label={`Show ${item.name} sample: income ₹${money.format(item.income)}, spending ₹${money.format(item.spending)}`} onClick={() => setSelected(i)}><span className={styles.barPair} aria-hidden="true"><span className={styles.incomeBar} style={{ "--bar-height": `${item.income / 1000}%`, "--bar-delay": `${i * 65}ms` }} /><span className={styles.spendingBar} style={{ "--bar-height": `${item.spending / 1000}%`, "--bar-delay": `${i * 65 + 50}ms` }} /></span><span className={styles.monthName}>{item.name}</span></button>)}
            </div>
          </div>
          <p className={styles.previewHint}>Choose a month. See the bigger picture.</p>
          <div className={styles.goalRow}><span className={styles.miniIcon}><Target size={18} /></span><div><strong>Your next adventure</strong><span>Sample savings goal</span></div><span className={styles.goalRing}>68%</span></div>
        </div>
      </div>
      <div className={styles.floatingNote}><span><Check size={15} /></span><div><strong>A little more organised.</strong><p>Your records, all in one place.</p></div></div>
      <div className={styles.floatingSpark} aria-hidden="true"><Sparkles size={21} strokeWidth={1.4} /></div>
    </div>
  );
}

export default function LandingPage() {
  const rootRef = useRef(null);
  const [openFaq, setOpenFaq] = useState(null);
  useLandingMotion(rootRef);
  return (
    <div ref={rootRef} className={styles.landing}>
      <div className={styles.scrollProgress} aria-hidden="true" />
      <header className={styles.header}><div className={styles.headerInner}><Brand /><nav className={styles.nav} aria-label="Main navigation"><a href="#features">The workspace</a><a href="#how-it-works">How it works</a><a href="#faq">Questions</a></nav><div className={styles.headerActions}><Link href="/auth/login" className={styles.signIn}>Sign in</Link><Link href="/auth/signup" className={styles.smallButton}>Get started <ArrowUpRight size={16} /></Link></div></div></header>
      <main>
        <section className={styles.hero}>
          <div className={styles.heroOrb} aria-hidden="true" /><div className={styles.heroDots} aria-hidden="true" />
          <div className={styles.heroCopy} data-reveal>
            <p className={styles.eyebrow}><span /> Your personal finance workspace</p>
            <h1>Money, with a<br /><span>little more clarity.<svg viewBox="0 0 480 18" aria-hidden="true" preserveAspectRatio="none"><path d="M3 12C126 1 350 2 476 11" /></svg></span></h1>
            <p className={styles.heroDescription}>Your spending, taxes, and future plans. Thoughtfully brought together, so you can feel more in control of what comes next.</p>
            <div className={styles.heroActions}><Link href="/auth/signup" className={styles.primaryButton}>Create your workspace <ArrowRight size={18} /></Link><a href="#features" className={styles.secondaryButton}>Take a look <ArrowDown size={16} /></a></div>
            <div className={styles.trustNotes}><span><Check size={14} /> Built for Indian finances</span><span><Check size={14} /> Start with your own records</span></div>
          </div>
          <WorkspacePreview />
          <a href="#features" className={styles.scrollCue}><span className={styles.scrollMouse} aria-hidden="true"><i /></span> A clearer view awaits <ArrowDown size={13} /></a>
        </section>
        <div className={styles.connectionStrip} data-reveal><span>One space. A little less scattered.</span><div>{[{ icon: Wallet, text: "Everyday money" }, { icon: FileText, text: "Your tax year" }, { icon: Target, text: "Future plans" }].map(({ icon: Icon, text }) => <span key={text}><Icon size={17} strokeWidth={1.6} />{text}</span>)}</div></div>
        <section id="features" className={styles.features}><div className={styles.container}>
          <div className={styles.sectionHeading} data-reveal><div><p className={styles.eyebrow}>One thoughtfully connected space</p><h2>Less scattered.<br /><span>More considered.</span></h2></div><p>Small everyday decisions and bigger financial plans deserve the same clear view.</p></div>
          <div className={styles.featureGrid}>{features.map(({ icon: Icon, label, title, body }, index) => <article key={title} className={styles.featureCard} data-reveal style={{ "--reveal-delay": `${index % 3 * 75}ms` }}><span className={styles.featureIcon}><Icon size={23} strokeWidth={1.6} /></span><span className={styles.featureNumber} aria-hidden="true">0{index + 1}</span><p className={styles.featureLabel}>{label}</p><h3>{title}</h3><p className={styles.featureDescription}>{body}</p></article>)}</div>
        </div></section>
        <section id="how-it-works" className={`${styles.container} ${styles.howItWorks}`}>
          <div className={styles.stepsIntro} data-reveal><p className={styles.eyebrow}>Make yourself at home</p><h2>A fresh perspective.<br /><span>A familiar starting point.</span></h2><p>From scattered records to a considered plan. Just take it one step at a time.</p><Link href="/auth/signup" className={styles.textLink}>Let’s get organised <ArrowRight size={17} /></Link><div className={styles.organisedIllustration} aria-hidden="true"><span><FileText size={22} /></span><span><Wallet size={22} /></span><span><Target size={22} /></span><i><Check size={15} /></i></div></div>
          <div className={styles.steps}>{steps.map(({ title, body, icon: Icon }, i) => <div key={title} className={styles.step} data-reveal style={{ "--reveal-delay": `${i * 90}ms` }}><span className={styles.stepNumber}>0{i + 1}</span><div><span className={styles.stepIcon}><Icon size={20} strokeWidth={1.5} /></span><h3>{title}</h3><p>{body}</p></div></div>)}</div>
        </section>
        <section id="faq" className={styles.faqSection}><div className={`${styles.container} ${styles.faqGrid}`}><div data-reveal><CircleHelp size={28} strokeWidth={1.5} className={styles.faqIcon} /><h2>A few good questions.</h2><p className={styles.sectionDescription}>A little more clarity before you begin.</p></div><div data-reveal>{faqs.map((faq, i) => <div key={faq.q} className={styles.faqItem} data-open={openFaq === i}><button id={`faq-question-${i}`} type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} aria-controls={`faq-answer-${i}`}><span>{faq.q}</span><span><ChevronDown size={17} /></span></button><div id={`faq-answer-${i}`} className={styles.faqAnswer} aria-hidden={openFaq !== i} inert={openFaq !== i} role="region" aria-labelledby={`faq-question-${i}`}><div><p>{faq.a}</p></div></div></div>)}</div></div></section>
        <section className={`${styles.container} ${styles.ctaSection}`}><div className={styles.cta} data-reveal><div className={styles.ctaOrb} aria-hidden="true" /><div className={styles.ctaCopy}><p className={styles.eyebrow}>Your next chapter</p><h2>Make room for<br />a clearer financial life.</h2><p>A thoughtful space for your money. And everything ahead.</p></div><Link href="/auth/signup" className={styles.ctaButton}>Start with Finpilot <ArrowUpRight size={18} /></Link></div></section>
      </main>
      <footer className={styles.footer}><div className={styles.container}><Brand /><p>A little clarity goes a long way.</p><p>© {new Date().getFullYear()} Finpilot</p></div></footer>
    </div>
  );
}
