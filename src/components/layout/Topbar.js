import { Bell, Plus, RefreshCw, Gift } from "lucide-react";

export default function Topbar() {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0 sm:justify-end">
      <button
        type="button"
        suppressHydrationWarning
        className="hidden md:flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 transition-colors max-w-full"
      >
        <RefreshCw size={14} className="text-gray-400 shrink-0" />
        <span className="truncate">Data synced: Today, 9:30 AM</span>
      </button>

      <button
        type="button"
        suppressHydrationWarning
        className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm min-h-[44px]"
      >
        <Plus size={16} />
        <span className="whitespace-nowrap">Add Expense</span>
      </button>

      <button
        type="button"
        suppressHydrationWarning
        className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
      >
        <Gift size={18} className="text-gray-500" />
      </button>

      <button
        type="button"
        suppressHydrationWarning
        className="relative w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
      >
        <Bell size={18} className="text-gray-500" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          3
        </span>
      </button>

      <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer shrink-0">
        A
      </div>
    </div>
  );
}
