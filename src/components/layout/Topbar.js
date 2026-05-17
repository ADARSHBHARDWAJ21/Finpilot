import { Bell, Plus, RefreshCw, Gift } from "lucide-react";

export default function Topbar() {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <button type="button" suppressHydrationWarning className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 transition-colors">
        <RefreshCw size={14} className="text-gray-400" />
        Data synced: Today, 9:30 AM
      </button>

      <button type="button" suppressHydrationWarning className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
        <Plus size={16} />
        Add Expense
      </button>

      <button type="button" suppressHydrationWarning className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
        <Gift size={18} className="text-gray-500" />
      </button>

      <button type="button" suppressHydrationWarning className="relative w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
        <Bell size={18} className="text-gray-500" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          3
        </span>
      </button>

      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer">
        A
      </div>
    </div>
  );
}



