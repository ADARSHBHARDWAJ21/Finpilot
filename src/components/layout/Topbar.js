"use client";

import { useState } from "react";
import { Bell, Plus, RefreshCw, Gift, Search, Sparkles } from "lucide-react";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";

export default function Topbar() {
  const [addOpen, setAddOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0 sm:justify-end">
        {/* Command Search Trigger */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white/90 border border-slate-200/80 rounded-xl text-xs text-slate-400 hover:border-indigo-300 transition-colors cursor-pointer shadow-2xs">
          <Search size={14} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Search insights, 80C, goals...</span>
          <kbd className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
            ⌘K
          </kbd>
        </div>

        {/* Sync Status Button */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={handleSync}
          className="hidden sm:flex items-center gap-2 bg-white/90 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          title="Click to sync financial feeds"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-beacon shrink-0" />
          <RefreshCw
            size={13}
            className={`text-slate-400 shrink-0 ${isSyncing ? "animate-spin text-indigo-600" : ""}`}
          />
          <span className="truncate">{isSyncing ? "Syncing feeds..." : "Live Data Synced"}</span>
        </button>

        {/* Add Transaction Button */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setAddOpen(true)}
          className="btn-shimmer flex-1 sm:flex-none bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-3.5 sm:px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 min-h-[42px]"
        >
          <Plus size={16} />
          <span className="whitespace-nowrap">Add Expense</span>
        </button>

        {/* Referral / Rewards */}
        <button
          type="button"
          suppressHydrationWarning
          className="w-10 h-10 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-amber-600 transition-colors shrink-0 shadow-2xs"
          title="FinCopilot Rewards"
        >
          <Gift size={17} />
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          suppressHydrationWarning
          className="relative w-10 h-10 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
          title="3 notifications"
        >
          <Bell size={17} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-rose-500 to-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
            3
          </span>
        </button>

        {/* User Profile Avatar */}
        <div className="relative group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            A
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
        </div>
      </div>

      <AddTransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultType="expense"
      />
    </>
  );
}
