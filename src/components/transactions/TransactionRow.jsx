import { Trash2 } from "lucide-react";

export default function TransactionRow({ tx, onDelete, deleting = false }) {
  return (
    <tr className="hover:bg-slate-50/70 transition-colors group">
      <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">{tx.date}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl ${tx.iconBg || "bg-indigo-50 text-indigo-600"} flex items-center justify-center text-sm font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
          >
            {tx.icon}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">{tx.name}</p>
            {tx.sub && <p className="text-[11px] text-slate-400 mt-0.5">{tx.sub}</p>}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            tx.categoryStyle || "bg-slate-100 text-slate-700"
          }`}
        >
          {tx.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">{tx.paymentIcon}</span>
          <div>
            <p className="text-xs font-semibold text-slate-800">{tx.payment}</p>
            {tx.paymentSub ? (
              <p className="text-[10px] text-slate-400">{tx.paymentSub}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`text-sm font-extrabold ${
            tx.income ? "text-emerald-600" : "text-slate-900"
          }`}
        >
          {tx.amount}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
            tx.statusStyle || "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {tx.status || "Cleared"}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={() => onDelete?.(tx.id)}
          disabled={deleting || !tx.id}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
          aria-label={`Delete ${tx.name}`}
          title="Delete transaction"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
