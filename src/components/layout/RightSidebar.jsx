"use client";

import { useState } from "react";
import { Sparkles, ArrowUp, ArrowUpRight, ArrowDownLeft, ArrowUpRight as Outgoing, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const prompts = ["Review my spending", "How can I prepare for tax season?"];
export default function RightSidebar({ recentTransactions = [], monthLabel }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  function ask(text) {
    const question = (text || query).trim().slice(0, 3000);
    if (question) router.push(`/taxation/ai-copilot?question=${encodeURIComponent(question)}`);
  }
  return <aside aria-label="Financial highlights" className="w-[288px] space-y-7 border-l border-border px-5 py-8">
    <section className="rounded-2xl bg-[#214d43] p-5 text-white">
      <span className="mb-6 inline-flex size-10 items-center justify-center rounded-xl border border-white/20"><Sparkles size={20} aria-hidden="true" /></span>
      <p className="text-[9px] uppercase tracking-[0.16em] text-[#c4d5c5]">A LITTLE PERSPECTIVE</p>
      <h2 className="mt-2 text-xl font-medium leading-snug">Meet your<br />financial Copilot.</h2>
      <p className="mt-3 text-xs leading-relaxed text-[#d0ddd2]">Make sense of your saved finances, one question at a time.</p>
      <div className="my-5 space-y-2">{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)} className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-left text-[11px] text-[#eef3e8] transition-colors hover:bg-white/10">{prompt}<ArrowUpRight size={13} className="shrink-0" /></button>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); ask(); }} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-primary">
        <input aria-label="Your Copilot question" maxLength={3000} placeholder="Ask a question…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
        <button type="submit" aria-label="Ask Copilot" disabled={!query.trim()} className="flex size-7 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-40"><ArrowUp size={14} /></button>
      </form>
    </section>
    <section>
      <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Recent activity</h2><Link href="/transactions" aria-label="View all transactions" className="text-muted-foreground hover:text-primary"><ArrowUpRight size={17} /></Link></div>
      {monthLabel && <p className="mt-1 text-[11px] text-muted-foreground">{monthLabel}</p>}
      {!recentTransactions.length ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-xs leading-relaxed text-muted-foreground">Your recorded transactions will appear here.</p> : <div className="mt-3 divide-y divide-border">{recentTransactions.map((transaction, index) => <div key={`${transaction.name}-${index}`} className="flex items-center gap-2.5 py-3.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">{transaction.income ? <ArrowDownLeft size={16} /> : <Outgoing size={16} />}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{transaction.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{transaction.category}</p></div>
        <div className="shrink-0 text-right"><p className={`text-[11px] font-medium tabular-nums ${transaction.income ? "text-primary" : "text-foreground"}`}>{transaction.amount}</p><p className="mt-1 text-[9px] text-muted-foreground">{transaction.date}</p></div>
      </div>)}</div>}
    </section>
    <Link href="/calendar" className="flex items-center gap-3 rounded-xl border border-border bg-white p-4"><CalendarDays size={18} className="text-primary" /><span className="flex-1 text-xs font-medium">A look at what’s ahead</span><ArrowUpRight size={14} className="text-muted-foreground" /></Link>
  </aside>;
}
