"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import { Menu, Bell, ChevronRight, Settings, X, LayoutDashboard, ArrowLeftRight, Landmark, Sparkles } from "lucide-react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import BrandMark from "./BrandMark";

const pageNames = { dashboard: "Overview", transactions: "Transactions", "budget-tracker": "Budgets", taxation: "Tax workspace", goals: "Goals", reports: "Reports", reminders: "Reminders", calendar: "Calendar", settings: "Settings", investments: "Investments", "net-worth": "Net worth", "ai-copilot": "AI Copilot", "rent-hra": "Rent & HRA" };

export default function DashboardLayout({ children, showRightSidebar = true, rightSidebarProps }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenuButton = useRef(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event) => { if (event.matches) setMobileMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  const pathname = usePathname();
  const year = useSearchParams().get("year");
  const taxSuffix = /^20\d{2}-\d{2}$/.test(year || "") ? `?year=${year}` : "";
  const segments = pathname.split("/").filter(Boolean);
  const title = (part) => pageNames[part] || part.replaceAll("-", " ").replace(/^./, (char) => char.toUpperCase());

  return (
    <div className="fp-app flex min-h-dvh bg-background">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-xl bg-primary px-5 py-3 text-sm text-white focus:not-sr-only">Skip to content</a>
      <div className="fp-sidebar sticky top-0 hidden h-dvh shrink-0 lg:block"><Sidebar /></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <header className="fp-mobile-header safe-top sticky top-0 z-30 flex h-17 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md lg:hidden">
            <Dialog.Trigger asChild><button type="button" aria-label="Open menu" className="fp-button size-10 px-0"><Menu size={19} /></button></Dialog.Trigger>
            <Link href="/dashboard" className="flex items-center gap-2.5"><BrandMark className="size-8" /><span className="font-heading text-lg font-semibold tracking-tight">finpilot.</span></Link>
            <Link href="/reminders" aria-label="View reminders" className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><Bell size={19} /></Link>
          </header>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10211c]/45 backdrop-blur-sm lg:hidden" />
            <Dialog.Content aria-describedby={undefined} onOpenAutoFocus={(event) => { event.preventDefault(); closeMenuButton.current?.focus(); }} className="fixed inset-y-0 left-0 z-50 outline-none lg:hidden">
              <Dialog.Title className="sr-only">Finpilot navigation</Dialog.Title>
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
              <Dialog.Close asChild><button ref={closeMenuButton} aria-label="Close menu" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"><X size={16} /></button></Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <header className="fp-utility-header hidden h-[72px] shrink-0 items-center justify-between border-b border-border px-7 lg:flex xl:px-9">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
            <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-primary">Workspace</Link>
            {segments.map((part, index) => <span key={part} className="flex items-center gap-2"><ChevronRight size={12} className="text-slate-400" aria-hidden="true" /><span className={index === segments.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}>{title(part)}</span></span>)}
          </nav>
          <div className="flex items-center gap-3">
            <span className="mr-2 text-[11px] text-muted-foreground">Your space. Your pace.</span>
            <Link href="/reminders" aria-label="View reminders" className="flex size-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted"><Bell size={16} /></Link>
            <Link href="/settings" aria-label="Account settings" className="flex size-9 items-center justify-center rounded-xl bg-muted text-primary hover:bg-accent"><Settings size={16} /></Link>
          </div>
        </header>
        <div className="flex min-w-0 flex-1">
          <main id="main-content" tabIndex={-1} className={`fp-main ${pathname === "/dashboard" ? "fp-dashboard-main" : ""} w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 xl:px-9`}>
            <div key={pathname} className="fp-page-content mx-auto w-full max-w-[1440px] min-w-0">{children}</div>
          </main>
          {showRightSidebar && <div className="hidden shrink-0 min-[1600px]:block"><RightSidebar {...rightSidebarProps} /></div>}
        </div>
        <nav aria-label="Quick navigation" className="fp-bottom-nav safe-bottom lg:hidden">
          {[["Overview", "/dashboard", LayoutDashboard], ["Transactions", "/transactions", ArrowLeftRight], ["Tax", "/taxation", Landmark], ["Copilot", "/taxation/ai-copilot", Sparkles]].map(([label, href, Icon]) => <Link key={href} href={`${href}${href.startsWith("/taxation") ? taxSuffix : ""}`} aria-current={(href === "/taxation" ? pathname.startsWith(href) && pathname !== "/taxation/ai-copilot" : pathname === href) ? "page" : undefined}><Icon size={19} aria-hidden="true" /><span>{label}</span></Link>)}
        </nav>
      </div>
    </div>
  );
}
