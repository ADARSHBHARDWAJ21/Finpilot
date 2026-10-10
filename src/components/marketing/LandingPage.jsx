"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/layout/BrandMark";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleHelp, FileText, LayoutDashboard, MessageSquare, Pause, Play, RotateCcw, Send, Sparkles, Target, Wallet } from "lucide-react";
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
const copilotExamples = [
  {
    label: "Plan an EMI", icon: Wallet,
    question: "How would a ₹10,000 EMI affect my month?",
    answer: "With ₹80,000 in income and ₹42,000 in spending, a ₹10,000 EMI leaves ₹28,000 before savings and other commitments.",
    takeaway: "See the impact before making a commitment.",
    figures: [{ label: "Available", value: "₹38,000" }, { label: "New EMI", value: "₹10,000" }, { label: "After EMI", value: "₹28,000" }],
  },
  {
    label: "Explore spending", icon: MessageSquare,
    question: "Where is most of my spending going?",
    answer: "Housing is your largest category at ₹18,000. Food accounts for ₹10,000 and other expenses ₹14,000 of your ₹42,000 total.",
    takeaway: "Understand the story behind your spending.",
    figures: [{ label: "Housing", value: "₹18,000", share: 43 }, { label: "Food", value: "₹10,000", share: 24 }, { label: "Other", value: "₹14,000", share: 33 }],
  },
];
const DEMO_DURATION = 15000;
const steps = [
  { title: "Bring your records", body: "Start with a bank statement, add your income, or enter a few transactions.", icon: FileText },
  { title: "Review the details", body: "Check imported records, choose categories, and fill in the information that matters to you.", icon: Check },
  { title: "Find your next step", body: "Explore your month, organise tax proofs, and make space for your next goal.", icon: Sparkles },
];

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

function useCopilotDemo(sceneRef) {
  const [scene, setScene] = useState({ index: 0, elapsed: 0 });
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = !("IntersectionObserver" in window);
    let frame = 0;
    let lastTime = 0;
    let pendingTime = 0;
    function advance(time) {
      if (lastTime) pendingTime += Math.min(time - lastTime, 100);
      lastTime = time;
      if (pendingTime >= 45) {
        const elapsed = pendingTime;
        pendingTime = 0;
        setScene(current => current.elapsed + elapsed >= DEMO_DURATION
          ? { index: (current.index + 1) % copilotExamples.length, elapsed: 0 }
          : { ...current, elapsed: current.elapsed + elapsed });
      }
      frame = window.requestAnimationFrame(advance);
    }
    function syncPlayback() {
      window.cancelAnimationFrame(frame);
      lastTime = 0;
      pendingTime = 0;
      if (!paused && !preference.matches && inView && !document.hidden) frame = window.requestAnimationFrame(advance);
    }
    function updatePreference() { setReduced(preference.matches); syncPlayback(); }
    const initialFrame = window.requestAnimationFrame(updatePreference);
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0.15 }) : null;
    if (sceneRef.current) observer?.observe(sceneRef.current);
    document.addEventListener("visibilitychange", syncPlayback);
    preference.addEventListener("change", updatePreference);
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(initialFrame);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      preference.removeEventListener("change", updatePreference);
    };
  }, [paused, sceneRef]);
  function chooseExample(index) { setScene({ index, elapsed: paused ? 9000 : 0 }); }
  function replay() { setScene(current => ({ ...current, elapsed: 0 })); setPaused(false); }
  return { scene, paused, reduced, chooseExample, replay, togglePause: () => setPaused(current => !current) };
}

function Brand() {
  return <Link href="/" className={styles.brand} aria-label="Finpilot home"><BrandMark />finpilot<span>.</span></Link>;
}

function CopilotPreview() {
  const sceneRef = useRef(null);
  const { scene, paused, reduced, chooseExample, replay, togglePause } = useCopilotDemo(sceneRef);
  const example = copilotExamples[scene.index];
  const elapsed = reduced ? 9000 : scene.elapsed;
  const asked = elapsed >= 2000;
  const answering = elapsed >= 4200;
  const complete = elapsed >= 6500;
  const typedQuestion = example.question.slice(0, Math.floor(elapsed / 38));
  const typedAnswer = example.answer.slice(0, Math.max(0, Math.ceil((elapsed - 4200) / 14)));
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
    <section ref={sceneRef} className={styles.previewScene} aria-label="Financial Copilot interactive demo" aria-describedby="copilot-demo-description" data-reveal data-playing={!paused && !reduced} style={{ "--reveal-delay": "180ms" }}>
      <div className={styles.previewHalo} aria-hidden="true" />
      <div className={styles.previewPointer} onPointerMove={movePreview} onPointerLeave={resetPreview}>
        <div ref={frameRef} className={styles.previewCard}>
          <div className={styles.previewHeader}><div><span className={styles.miniIcon}><Sparkles size={18} /></span><div className={styles.copilotTitle}><strong>Financial Copilot</strong><span>A thoughtful second perspective</span></div></div><span className={styles.sampleLabel}>Demo</span></div>
          <div className={styles.demoTopics} aria-label="Choose a Copilot example">{copilotExamples.map(({ label, icon: Icon }, index) => <button key={label} type="button" aria-pressed={scene.index === index} onClick={() => chooseExample(index)}><Icon size={13} />{label}</button>)}</div>
          <p id="copilot-demo-description" className={styles.demoCaption}>See it in action · Illustrative answers with sample data</p>
          <div className="sr-only"><p>{example.question}</p><p>{example.answer}</p><p>{example.takeaway}</p></div>
          <div key={scene.index} className={styles.demoConversation} aria-hidden="true">
            <div className={styles.demoQuestion} data-visible={asked}><span>You</span><p>{example.question}</p></div>
            <div className={styles.demoThinking} data-visible={asked && !answering}><span className={styles.thinkingDots}><i /><i /><i /></span>Checking sample financial data…</div>
            <article className={styles.demoAnswer} data-visible={answering}>
              <div className={styles.answerHeading}><Sparkles size={14} /><span>Finpilot Copilot</span><span className={styles.answerBadge}><Check size={10} />Sample context</span></div>
              <p className={styles.answerText}><span className={styles.answerReservation}>{example.answer}</span><span>{typedAnswer}{answering && !complete && <i className={styles.typingCursor} />}</span></p>
              <div className={styles.demoFigures} data-visible={complete} data-kind={scene.index === 0 ? "emi" : "spending"}>{example.figures.map(figure => <div key={figure.label}><span>{figure.label}</span><strong>{figure.value}</strong>{figure.share && <span className={styles.spendingTrack}><i style={{ "--share": `${figure.share}%` }} /></span>}</div>)}</div>
              <div className={styles.answerSource} data-visible={complete}><FileText size={12} />Financial profile & transaction summary</div>
            </article>
            <p className={styles.demoTakeaway} data-visible={complete}><Check size={12} />{example.takeaway}</p>
          </div>
          <div className={styles.demoComposer} aria-hidden="true"><span>{asked ? "What else would you like to explore?" : typedQuestion || "Ask about your money…"}{!asked && <i className={styles.typingCursor} />}</span><span className={styles.demoSend} data-ready={asked}><Send size={14} /></span></div>
          <div className={styles.demoFooter}><div className={styles.demoControls}>{!reduced && <button type="button" onClick={togglePause} aria-label={paused ? "Play Copilot demo" : "Pause Copilot demo"}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>}{!reduced && <button type="button" onClick={replay} aria-label="Replay Copilot demo"><RotateCcw size={13} /></button>}<span>{reduced ? "Sample conversation" : paused ? "Paused" : "Playing demo"}</span></div><Link href="/taxation/ai-copilot" className={styles.demoLink}>Try Copilot <ArrowUpRight size={13} /></Link></div>
          <div className={styles.demoProgress} aria-hidden="true"><span style={{ transform: `scaleX(${reduced ? 1 : scene.elapsed / DEMO_DURATION})` }} /></div>
        </div>
      </div>
      <div className={styles.floatingNote}><span><Sparkles size={15} /></span><div><strong>Your numbers. A clearer next step.</strong><p>Meet your personal financial Copilot.</p></div></div>
      <div className={styles.floatingSpark} aria-hidden="true"><Sparkles size={21} strokeWidth={1.4} /></div>
    </section>
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
          <CopilotPreview />
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
