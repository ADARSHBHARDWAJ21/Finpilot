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
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Receipt, label: "Transactions", href: "/transactions" },
  { icon: Wallet, label: "Budget Tracker", href: "#" },
  { icon: Landmark, label: "Taxation", href: "#", badge: "New", badgeColor: "bg-emerald-100 text-emerald-700" },
  { icon: Bot, label: "Tax AI Advisor", href: "#", badge: "AI", badgeColor: "bg-blue-100 text-blue-700" },
  { icon: FileText, label: "Documents", href: "#" },
  { icon: TrendingUp, label: "Investments", href: "#" },
  { icon: PieChart, label: "Net Worth", href: "#", badge: "New", badgeColor: "bg-emerald-100 text-emerald-700" },
  { icon: Target, label: "Goals", href: "#" },
  { icon: Bell, label: "Reminders", href: "#" },
  { icon: BarChart3, label: "Reports", href: "#" },
  { icon: Lightbulb, label: "Insights", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

function HealthScoreRing({ score }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="100" height="100" className="-rotate-90">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#6366f1"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

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
        {menuItems.map((item) => {
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

      <div className="p-4 m-3 mt-auto bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/60">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Financial Health Score
        </p>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <HealthScoreRing score={78} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-gray-900">78</span>
              <span className="text-[10px] text-gray-400">/100</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-600">Good</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              You&apos;re on track. Keep saving consistently.
            </p>
            <a
              href="#"
              className="inline-block text-[11px] font-semibold text-indigo-600 mt-2 hover:underline"
            >
              View full report →
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
