"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SignOutButton from "@/components/auth/SignOutButton";
import BrandMark from "./BrandMark";
import { LayoutDashboard, ArrowLeftRight, Wallet, Landmark, Sparkles, TrendingUp, ChartNoAxesCombined, Target, Bell, ChartNoAxesColumnIncreasing, CalendarDays, Settings, ChevronDown } from "lucide-react";

const sections = [
  { label: "Money", items: [
    { icon: ArrowLeftRight, label: "Transactions", href: "/transactions" },
    { icon: Wallet, label: "Budgets", href: "/budget-tracker" },
  ]},
  { label: "Planning", items: [
    { icon: Target, label: "Goals", href: "/goals" },
    { icon: ChartNoAxesColumnIncreasing, label: "Reports", href: "/reports" },
    { icon: CalendarDays, label: "Calendar", href: "/calendar" },
    { icon: Bell, label: "Reminders", href: "/reminders" },
  ]},
  { label: "Coming next", items: [
    { icon: TrendingUp, label: "Investments", href: "/investments", preview: true },
    { icon: ChartNoAxesCombined, label: "Net worth", href: "/net-worth", preview: true },
  ]},
];
const taxItems = [
  ["Overview", "/taxation"],
  ["Salary documents", "/taxation/salary-documents"],
  ["Tax saving proofs", "/taxation/tax-saving-proofs"],
  ["Rent & HRA", "/taxation/rent-hra"],
  ["Banking & investments", "/taxation/banking-investments"],
  ["Compliance & filing", "/taxation/compliance-filing"],
  ["Compare regimes", "/taxation/compare-regimes"],
  ["Deductions", "/taxation/deductions"],
  ["Tax payments", "/taxation/liability-tracker"],
  ["What-if calculator", "/taxation/simulation"],
];

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const year = useSearchParams().get("year");
  const taxHref = (href) => /^20\d{2}-\d{2}$/.test(year || "") ? `${href}?year=${year}` : href;
  const isTax = pathname.startsWith("/taxation") && pathname !== "/taxation/ai-copilot";

  function itemLink(item) {
    const Icon = item.icon;
    return <Link key={item.href} href={["/reports","/dashboard"].includes(item.href) ? taxHref(item.href) : item.href} onClick={onNavigate} aria-current={pathname === item.href ? "page" : undefined} className="fp-nav-item">
      <Icon size={18} aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {item.preview && <span className="rounded-md border border-white/15 px-1.5 py-0.5 text-[8px] tracking-wide">SOON</span>}
    </Link>;
  }

  return <aside className="flex h-dvh w-[250px] max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground lg:w-[232px]">
    <Link href="/dashboard" onClick={onNavigate} className="mx-5 mb-3 mt-7 flex items-center gap-3 rounded-xl">
      <BrandMark dark className="size-10" />
      <span><span className="block font-heading text-xl font-semibold tracking-[-0.06em] text-white">finpilot<span className="text-[#b9cea1]">.</span></span><span className="mt-0.5 block text-[9px] tracking-[0.12em] text-[#a4b9ab]">A CLEARER FINANCIAL LIFE</span></span>
    </Link>
    <nav aria-label="Main navigation" className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-3">
      <div className="mt-3 space-y-1">
        {itemLink({ icon: LayoutDashboard, label: "Overview", href: "/dashboard" })}
        <Link href={taxHref("/taxation/ai-copilot")} onClick={onNavigate} aria-current={pathname === "/taxation/ai-copilot" ? "page" : undefined} className="fp-nav-item"><Sparkles size={18} aria-hidden="true" /><span className="flex-1">AI Copilot</span><span className="size-1.5 rounded-full bg-[#afc596]" aria-hidden="true" /></Link>
      </div>
      <p className="fp-nav-label">{sections[0].label}</p>
      <div className="space-y-1">{sections[0].items.map(itemLink)}</div>
      <div>
        <p className="fp-nav-label">Taxation{year && <span className="ml-2 normal-case tracking-normal">FY {year}</span>}</p>
        <Link href={taxHref("/taxation")} onClick={onNavigate} aria-current={isTax ? "page" : undefined} className="fp-nav-item">
          <Landmark size={18} aria-hidden="true" /><span className="flex-1">Tax workspace</span><ChevronDown size={14} className={isTax ? "rotate-180" : ""} aria-hidden="true" />
        </Link>
        {isTax && <div className="my-2 ml-5 space-y-0.5 border-l border-white/15 pl-3">
          {taxItems.map(([label, href]) => <Link key={href} href={taxHref(href)} onClick={onNavigate} aria-current={pathname === href ? "page" : undefined} className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white/5 hover:text-white ${pathname === href ? "bg-white/10 font-medium text-white" : "text-[#b9cbbd]"}`}>{label}</Link>)}
        </div>}
      </div>
      {sections.slice(1).map((section) => <div key={section.label}><p className="fp-nav-label">{section.label}</p><div className="space-y-1">{section.items.map(itemLink)}</div></div>)}
    </nav>
    <div className="border-t border-white/10 p-3">
      {itemLink({ icon: Settings, label: "Settings", href: "/settings" })}
      <SignOutButton className="text-[#bdcdc0] hover:bg-white/5 hover:text-white [&_svg]:text-[#a4b9ab]" />
    </div>
  </aside>;
}
