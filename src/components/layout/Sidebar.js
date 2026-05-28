"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/auth/SignOutButton";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Landmark,
  Bot,
  FileText,
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
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Receipt, label: "Transactions", href: "/transactions" },
  { icon: Wallet, label: "Budget Tracker", href: "/budget-tracker" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: TrendingUp, label: "Investments", href: "/investments" },
  { icon: PieChart, label: "Net Worth", href: "/net-worth", badge: "New", badgeColor: "bg-emerald-100 text-emerald-700" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Bell, label: "Reminders", href: "/reminders" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: CalendarDays, label: "Calendar", href: "/calendar" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const taxationSubItems = [
  { label: "Overview", href: "/taxation" },
  { label: "Salary Documents", href: "/taxation/salary-documents" },
  { label: "Tax Saving Proofs", href: "/taxation/deductions" },
  { label: "Rent & HRA", href: "/taxation/rent-hra" },
  { label: "Banking & Investments", href: "/taxation/banking-investments" },
  { label: "Compliance & Filing", href: "/taxation/compliance-filing" },
  { label: "AI Copilot", href: "/taxation/ai-copilot", badge: "New" },
];

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const isTaxationSection = pathname.startsWith("/taxation");
  const isAICopilot = pathname === "/taxation/ai-copilot";

  const handleNav = () => {
    onNavigate?.();
  };

  return (
    <aside className="w-[min(280px,85vw)] sm:w-[240px] shrink-0 bg-white border-r border-gray-100 min-h-screen min-h-[100dvh] flex flex-col shadow-xl lg:shadow-none">
      <div className="p-5 border-b border-gray-50">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={handleNav}>
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">FinCopilot</h1>
            <p className="text-[11px] text-gray-400 leading-tight">Your AI Finance & Tax Copilot</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== "#" && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}

        {/* Taxation group */}
        <div>
          <Link
            href="/taxation"
            onClick={handleNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm w-full ${
              isTaxationSection
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Landmark size={18} className={isTaxationSection ? "text-indigo-600" : "text-gray-400"} />
            <span className="flex-1">Taxation</span>
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${isTaxationSection ? "rotate-180" : ""}`}
            />
          </Link>

          {isTaxationSection && (
            <div className="mt-1 ml-3 pl-3 border-l border-indigo-100 space-y-1">
              {taxationSubItems.map((sub) => {
                const isActive =
                  sub.href === "/taxation"
                    ? pathname === "/taxation"
                    : pathname === sub.href || pathname.startsWith(`${sub.href}/`);

                if (sub.label === "AI Copilot") {
                  return (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      onClick={handleNav}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-full transition-all text-sm ${
                        isAICopilot
                          ? "bg-indigo-600 text-white font-medium shadow-sm"
                          : "bg-[#f8faff] text-gray-600 hover:bg-indigo-50"
                      }`}
                    >
                      <Bot size={16} className={isAICopilot ? "text-white" : "text-gray-400"} />
                      <span className="flex-1">{sub.label}</span>
                      {sub.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isAICopilot
                              ? "bg-white/20 text-white"
                              : "bg-indigo-100 text-indigo-700"
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
                    href={sub.href}
                    onClick={handleNav}
                    className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive && !isAICopilot
                        ? "text-indigo-700 font-medium bg-indigo-50/60"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {menuItems.slice(3).map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== "#" && pathname === item.href;
          const hasAccentBar =
            isActive &&
            (item.href === "/reports" ||
              item.href === "/calendar" ||
              item.href === "/reminders");
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm relative ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              } ${hasAccentBar ? "border-l-[3px] border-l-indigo-600 rounded-l-lg" : ""}`}
            >
              <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2">
        <SignOutButton />
      </div>

      <div className="p-4 m-3 mt-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Crown size={18} className="text-amber-500" />
          <p className="text-sm font-semibold text-gray-900">Upgrade to Pro</p>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
          Unlock advanced tax planning, unlimited AI chats, and priority support.
        </p>
        <button
          type="button"
          suppressHydrationWarning
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Upgrade Now
        </button>
      </div>
    </aside>
  );
}
