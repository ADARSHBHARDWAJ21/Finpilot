"use client";

import { useState } from "react";
import { ArrowUpRight, Check, ChartNoAxesCombined, Clock3 } from "lucide-react";
import Link from "next/link";

export default function ComingSoon({ title, subtitle, features = [] }) {
  const [monthlySip, setMonthlySip] = useState(25000);
  const [years, setYears] = useState(10);
  const rate = 0.13;
  const totalMonths = years * 12;
  const monthlyRate = rate / 12;
  const investedAmount = monthlySip * totalMonths;
  const futureValue = monthlySip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  const estimatedReturns = Math.max(0, futureValue - investedAmount);
  const displayFeatures = features.length ? features : ["An organised view of investment records", "Portfolio performance over time", "A clearer view of asset allocation", "Investment information alongside your financial plans"];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-medium uppercase tracking-[.18em] text-muted-foreground">Looking ahead</p><h1 className="text-3xl font-semibold tracking-[-.04em] text-foreground">{title}</h1></div><span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground"><Clock3 size={13} strokeWidth={1.7} />In development</span></div>
      <section className="grid gap-8 rounded-[20px] border border-border bg-white p-6 sm:p-9 md:grid-cols-[1.1fr_1fr]">
        <div><span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#edf2eb] text-primary"><ChartNoAxesCombined size={23} strokeWidth={1.6} /></span><h2 className="text-2xl font-medium tracking-tight text-foreground">The next part of your<br />financial picture.</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{subtitle || "We’re building a thoughtful space for your longer-term finances. This module is not available yet."}</p><Link href="/goals" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">Explore your goals <ArrowUpRight size={16} /></Link></div>
        <div className="rounded-2xl bg-muted p-5"><p className="mb-5 text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground">Planned capabilities</p><div className="space-y-5">{displayFeatures.map((feature, i) => <div key={i} className="flex items-start gap-3 text-sm leading-relaxed text-[#647268]"><Check size={16} className="mt-0.5 shrink-0 text-[#7b9479]" /><span>{feature}</span></div>)}</div><p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">These features are planned and are not connected to your accounts.</p></div>
      </section>
      <section className="rounded-[20px] border border-border bg-white p-6 sm:p-8">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground">Explore a possibility</p><h2 className="mt-2 text-xl font-medium tracking-tight">A savings illustration</h2></div><span className="rounded-full bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">Assumed annual return: 13%</span></div>
        <div className="grid items-center gap-8 md:grid-cols-2"><div className="space-y-7"><div><label htmlFor="preview-investment" className="mb-3 flex flex-wrap justify-between gap-2 text-sm"><span className="text-muted-foreground">Monthly investment</span><span className="font-semibold text-primary">₹{monthlySip.toLocaleString("en-IN")}</span></label><input id="preview-investment" type="range" min={5000} max={200000} step={5000} value={monthlySip} onChange={(e) => setMonthlySip(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-[#214d43]" /></div><div><label htmlFor="preview-years" className="mb-3 flex justify-between gap-2 text-sm"><span className="text-muted-foreground">Time horizon</span><span className="font-semibold text-primary">{years} years</span></label><input id="preview-years" type="range" min={1} max={30} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-[#214d43]" /></div></div><div className="rounded-2xl bg-[#edf2eb] p-6"><p className="text-xs text-[#6b7d6c]">Illustrated future value</p><p className="mt-3 text-3xl font-medium tracking-tight text-primary">₹{(futureValue / 100000).toFixed(2)} lakh</p><div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#d4dfcf] pt-4 text-xs"><div><p className="text-[#738078]">Contributions</p><p className="mt-1 font-semibold text-[#214d43]">₹{(investedAmount / 100000).toFixed(2)}L</p></div><div><p className="text-[#738078]">Illustrated growth</p><p className="mt-1 font-semibold text-[#214d43]">₹{(estimatedReturns / 100000).toFixed(2)}L</p></div></div></div></div>
        <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">This illustration uses a fixed assumed return and monthly contributions at the beginning of each month. It is not a forecast or a guaranteed return and excludes taxes, fees, and inflation.</p>
      </section>
    </div>
  );
}
