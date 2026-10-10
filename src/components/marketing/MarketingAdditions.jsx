import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, FileCheck2, MessageSquare, Sparkles, Target } from "lucide-react";
import styles from "./MarketingAdditions.module.css";

const audiences = [
  { icon: BriefcaseBusiness, number: "01", title: "For your working life.", body: "Bring your salary, everyday spending and upcoming commitments into one monthly picture.", detail: "A clearer month", href: "/demo", link: "Explore a sample month" },
  { icon: FileCheck2, number: "02", title: "For a calmer tax year.", body: "Keep salary details and proofs together. Review your checklists and compare supported salary tax estimates.", detail: "A more organised year", href: "/demo?view=taxation", link: "Try the tax workspace" },
  { icon: Target, number: "03", title: "For what comes next.", body: "Set spending limits, make room for a goal and see how a future EMI changes your monthly balance.", detail: "A plan you can revisit", href: "/demo?view=copilot&question=emi", link: "Try an EMI example" },
];

export function AudienceSection() {
  return <section id="who-its-for" className={styles.audience} aria-labelledby="audience-heading">
    <div className={styles.heading} data-reveal><div><p className={styles.eyebrow}>Made for your everyday decisions</p><h2 id="audience-heading">Your money has a context.<br /><span>So should your workspace.</span></h2></div><p>Especially useful for Indian salaried professionals who want to bring their own records into a clearer view.</p></div>
    <div className={styles.audienceGrid}>{audiences.map(({ icon: Icon, number, title, body, detail, href, link }) => <article key={number} className={styles.persona} data-reveal style={{ "--reveal-delay": `${(Number(number) - 1) * 70}ms` }}>
      <div className={styles.personaTop}><span><Icon size={22} strokeWidth={1.5} /></span><span>{number}</span></div><p className={styles.detail}>{detail}</p><h3>{title}</h3><p>{body}</p><Link href={href}>{link}<ArrowRight size={15} /></Link>
    </article>)}</div>
  </section>;
}

export function EarlyUserSection() {
  return <section id="early-access" className={styles.earlyUsers} aria-labelledby="early-user-heading" data-reveal>
    <div className={styles.earlyIllustration} aria-hidden="true"><span><MessageSquare size={25} strokeWidth={1.4} /></span><span><Target size={24} strokeWidth={1.4} /></span><span><Sparkles size={23} strokeWidth={1.4} /></span><i /></div>
    <div className={styles.earlyCopy}><p className={styles.eyebrow}>Built with room to grow</p><h2 id="early-user-heading">Be part of<br /><span>Finpilot’s next chapter.</span></h2><p>We’re welcoming early users who want a more organised financial life. Explore the sample, start with your own records and help shape what comes next.</p><div className={styles.earlyActions}><Link href="/auth/signup">Become an early user<ArrowUpRight size={16} /></Link><Link href="/demo">Try the sample first<ArrowRight size={15} /></Link></div></div>
  </section>;
}
