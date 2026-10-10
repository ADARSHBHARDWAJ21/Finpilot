import Link from "next/link";
import { ArrowUpRight, ChartNoAxesCombined, Clock3, Wallet, Landmark } from "lucide-react";
import { WorkspaceHeader } from "@/components/layout/WorkspaceUI";

export default function ComingSoon({ title, subtitle, features = [] }) {
  const isNetWorth = title.toLowerCase().includes("net worth");
  return <div className="mx-auto max-w-5xl space-y-6">
    <WorkspaceHeader eyebrow="A little further ahead" title={title} description={subtitle}><span className="fp-button"><Clock3 size={16}/>In development</span></WorkspaceHeader>
    <section className="fp-card p-6 sm:p-9"><span className="fp-icon mb-6"><ChartNoAxesCombined size={24}/></span><h2 className="text-2xl font-medium">The next part of your financial picture.</h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">This module is being planned. The layout below previews how your records could be organised; account connections and tracking are not available here yet.</p>
      <div className="my-7 grid gap-4 sm:grid-cols-2">{(isNetWorth ? [[Wallet,"Assets","Cash, property and investment records"],[Landmark,"Liabilities","Loans and repayment commitments"]] : [[ChartNoAxesCombined,"Portfolio records","Your holdings, organised together"],[Landmark,"Annual tax records","Interest and capital-gains documents"]]).map(([Icon,label,description])=><div key={label} className="rounded-2xl border border-dashed border-border bg-muted p-5"><Icon size={20} className="text-primary"/><h3 className="mt-4 text-lg font-medium">{label}</h3><p className="mt-2 text-sm text-muted-foreground">{description}</p><p className="mt-4 text-xs text-muted-foreground">Layout preview · no account data</p></div>)}</div>
      <div className="flex flex-wrap gap-3"><Link className="fp-primary-link" href="/goals">Plan a goal<ArrowUpRight size={16}/></Link><Link className="fp-button" href="/taxation/banking-investments">Organise existing proofs<ArrowUpRight size={16}/></Link></div>
    </section>
    {features.length > 0 && <details className="fp-card p-5 sm:p-6"><summary className="text-sm font-medium">Proposed capabilities</summary><ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">{features.map(feature=><li key={feature}>{feature}</li>)}</ul><p className="mt-5 text-xs text-muted-foreground">These are proposals. Availability and integrations have not been confirmed.</p></details>}
  </div>;
}
