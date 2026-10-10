import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AIInsights({ insights = [] }) {
  return <section className="rounded-[20px] border border-border bg-white p-5 sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div><h2 className="text-base font-semibold tracking-tight text-foreground">A little more clarity</h2><p className="mt-1 text-xs text-muted-foreground">Insights from your financial overview</p></div>
      <Sparkles aria-hidden="true" size={20} strokeWidth={1.7} className="text-primary" />
    </div>
    {insights.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {insights.map((message, index) => <div key={index} className="flex flex-col justify-between rounded-xl border border-border bg-background/60 p-4">
        <p className="text-sm leading-relaxed text-foreground">{message}</p>
        <Link href="/taxation" className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary">Review your plan<ArrowUpRight size={14} strokeWidth={1.7} /></Link>
      </div>)}
    </div> : <div className="rounded-xl bg-secondary/60 p-5"><p className="text-sm leading-relaxed text-muted-foreground">Explore your saved financial data with Copilot.</p><Link href="/taxation/ai-copilot" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">Ask a question<ArrowUpRight size={14} strokeWidth={1.7} /></Link></div>}
  </section>;
}
