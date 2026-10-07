"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SignOutButton from "@/components/auth/SignOutButton";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Landmark,
  Bot,
  TrendingUp,
  PieChart,
  Target,
  Bell,
  BarChart3,
  CalendarDays,
  Settings,
  Sparkles,
  ChevronDown,
  Crown,
  Zap,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Receipt, label: "Transactions", href: "/transactions" },
  { icon: Wallet, label: "Budget Tracker", href: "/budget-tracker" },
  { icon: TrendingUp, label: "Investments", href: "/investments", badge: "Pro", badgeColor: "bg-amber-100 text-amber-700 border-amber-200" },
  { icon: PieChart, label: "Net Worth", href: "/net-worth", badge: "Live", badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Bell, label: "Reminders", href: "/reminders" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const taxationSubItems = [
  { label: "Overview", href: "/taxation" },
  { label: "Salary Documents", href: "/taxation/salary-documents" },
  { label: "Tax Saving Proofs", href: "/taxation/tax-saving-proofs" },
  { label: "Rent & HRA", href: "/taxation/rent-hra" },
  { label: "Banking & Investments", href: "/taxation/banking-investments" },
  { label: "Compliance & Filing", href: "/taxation/compliance-filing" },
  { label: "AI Copilot", href: "/taxation/ai-copilot", badge: "AI 2.0" },
];

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const year = useSearchParams().get("year");
  const taxHref = (href) => /^20\d{2}-\d{2}$/.test(year || "") ? `${href}?year=${year}` : href;
  const isTaxationSection = pathname.startsWith("/taxation");
  const isAICopilot = pathname === "/taxation/ai-copilot";

  const handleNav = () => {
    onNavigate?.();
  };

  return (
    <aside className="w-[min(280px,85vw)] sm:w-[250px] shrink-0 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 min-h-screen min-h-[100dvh] flex flex-col shadow-xl lg:shadow-none z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100/90">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={handleNav}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">FinCopilot</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Autonomous Wealth</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {/* First 3 core items */}
        {menuItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== "#" && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleNav}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? "bg-gradient-to-r from-indigo-50 via-indigo-50/80 to-violet-50/40 text-indigo-700 border-l-[3px] border-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}

        {/* Taxation Group */}
        <div>
          <Link
            href={taxHref("/taxation")}
            onClick={handleNav}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium w-full ${
              isTaxationSection
                ? "bg-gradient-to-r from-indigo-50 to-violet-50/40 text-indigo-700 border-l-[3px] border-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <Landmark
              size={18}
              className={isTaxationSection ? "text-indigo-600" : "text-slate-400"}
            />
            <span className="flex-1">Taxation</span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${
                isTaxationSection ? "rotate-180 text-indigo-600" : ""
              }`}
            />
          </Link>

          {isTaxationSection && (
            <div className="mt-1 ml-4 pl-3 border-l-2 border-indigo-100 space-y-1 py-1">
              {taxationSubItems.map((sub) => {
                const isActive =
                  sub.href === "/taxation"
                    ? pathname === "/taxation"
                    : pathname === sub.href || pathname.startsWith(`${sub.href}/`);

                if (sub.label === "AI Copilot") {
                  return (
                    <Link
                      key={sub.label}
                      href={taxHref(sub.href)}
                      onClick={handleNav}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
                        isAICopilot
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25"
                          : "bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100/70 border border-indigo-100"
                      }`}
                    >
                      <Bot size={15} className={isAICopilot ? "text-white" : "text-indigo-600"} />
                      <span className="flex-1">{sub.label}</span>
                      {sub.badge && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isAICopilot
                              ? "bg-white/20 text-white"
                              : "bg-indigo-200/80 text-indigo-800"
                          }`}
                        >
                          {sub.badge}
                        </span>
                      )}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={sub.label}
                    href={taxHref(sub.href)}
                    onClick={handleNav}
                    className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive && !isAICopilot
                        ? "text-indigo-700 font-semibold bg-indigo-50/80"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                    }`}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Rest of menu items */}
        {menuItems.slice(3).map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== "#" && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleNav}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? "bg-gradient-to-r from-indigo-50 via-indigo-50/80 to-violet-50/40 text-indigo-700 border-l-[3px] border-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-indigo-600" : "text-slate-400"}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Signout */}
      <div className="px-3 py-2 border-t border-slate-100">
        <SignOutButton />
      </div>

      <div className="m-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-sm font-semibold text-indigo-950">Your tax workspace</p>
        <p className="my-3 text-xs leading-relaxed text-indigo-700">Yearly salary estimates, private proof documents and filing checklists in one place.</p>
        <Link href={taxHref("/taxation")} onClick={handleNav} className="inline-flex rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Open tax overview</Link>
      </div>
    </aside>
  );
}
