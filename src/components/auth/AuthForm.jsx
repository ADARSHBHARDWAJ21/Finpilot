"use client";

import Link from "next/link";
import BrandMark from "@/components/layout/BrandMark";
import { ArrowLeft, Check, Wallet, FileText, Target } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[100dvh] bg-[#f6f7f4] text-[#202a25] lg:grid-cols-[.95fr_1.05fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#214d43] px-12 py-10 text-white lg:flex xl:px-16">
        <Link href="/" className="inline-flex w-fit items-center gap-2.5 text-xl font-semibold tracking-tight"><BrandMark className="size-10" dark />finpilot<span className="text-[#b6cbb5]">.</span></Link>
        <div className="relative z-10 my-16 max-w-md"><p className="mb-6 text-[11px] uppercase tracking-[.2em] text-[#b6cbb5]">A little more clarity</p><h2 className="text-[44px] font-medium leading-[1.15] tracking-[-.045em] xl:text-[52px]">Good things start<br />with a clear view.</h2><p className="mt-6 max-w-sm text-sm leading-[1.9] text-[#c4d3c5]">Bring your everyday finances and future plans into a space that feels a little more considered.</p><div className="mt-10 space-y-4">{[{ icon: Wallet, text: "Know your spending" }, { icon: FileText, text: "Keep your tax year organised" }, { icon: Target, text: "Make room for your goals" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 text-sm text-[#e0e9dc]"><span className="flex size-9 items-center justify-center rounded-xl border border-white/15"><Icon size={16} strokeWidth={1.7} /></span>{text}<Check size={13} className="ml-auto text-[#91ad93]" /></div>)}</div></div>
        <p className="text-xs text-[#a9c0ab]">Your money. Your pace. Your next chapter.</p>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 -right-36 size-[500px] rounded-full border border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -right-16 size-[340px] rounded-full border border-white/5" />
      </aside>
      <div className="flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between gap-3 px-6 py-7 sm:px-10"><Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight lg:hidden"><BrandMark className="size-8" />finpilot<span className="text-[#8ba88e]">.</span></Link><Link href="/" className="ml-auto inline-flex items-center gap-2 text-xs text-[#738078] transition-colors hover:text-[#214d43]"><ArrowLeft size={14} />Back to home</Link></header>
        <main className="flex flex-1 items-center justify-center px-6 pb-14 pt-7 sm:px-10"><div className="w-full max-w-[380px]"><div className="mb-9"><p className="mb-3 text-[10px] font-medium uppercase tracking-[.18em] text-[#7b8c77]">Your financial workspace</p><h1 className="text-[32px] font-medium leading-tight tracking-[-.04em]">{title}</h1>{subtitle && <p className="mt-3 text-sm leading-relaxed text-[#738078]">{subtitle}</p>}</div>{children}{footer && <div className="mt-7 border-t border-[#dfe5db] pt-6 text-center text-xs leading-relaxed text-[#738078]">{footer}</div>}</div></main>
        <footer className="px-6 py-5 text-center text-[11px] text-[#8a958b]">A little clarity goes a long way.</footer>
      </div>
    </div>
  );
}
