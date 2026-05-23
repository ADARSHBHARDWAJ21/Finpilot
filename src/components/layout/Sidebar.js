"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Lightbulb,
  Settings,
  Sparkles,
  ChevronDown,
  Crown,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Receipt, label: "Transactions", href: "/transactions" },
  { icon: Wallet, label: "Budget Tracker", href: "#" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: TrendingUp, label: "Investments", href: "#" },
  { icon: PieChart, label: "Net Worth", href: "#", badge: "New", badgeColor: "bg-emerald-100 text-emerald-700" },
  { icon: Target, label: "Goals", href: "#" },
  { icon: Bell, label: "Reminders", href: "#" },
  { icon: BarChart3, label: "Reports", href: "#" },
  { icon: Lightbulb, label: "Insights", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

const taxationSubItems = [
  { label: "Overview", href: "/taxation" },
  { label: "AI Copilot", href: "/taxation/ai-copilot", badge: "New" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isTaxationSection = pathname.startsWith("/taxation");
  const isTaxationOverview = pathname === "/taxation";
  const isAICopilot = pathname === "/taxation/ai-copilot";

  return (
    <aside className="w-[240px] shrink-0 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-50">
        <Link href="/" className="flex items-center gap-2.5">
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
                  sub.href === "/taxation" ? isTaxationOverview : pathname === sub.href;

                if (sub.label === "AI Copilot") {
                  return (
                    <Link
                      key={sub.label}
                      href={sub.href}
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
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
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
