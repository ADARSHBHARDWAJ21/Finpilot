import { Trash2 } from "lucide-react";

export default function TransactionRow({ tx, onDelete, deleting = false }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{tx.date}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full ${tx.iconBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}
          >
            {tx.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{tx.name}</p>
            <p className="text-xs text-gray-400">{tx.sub}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${tx.categoryStyle}`}
        >
          {tx.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-base">{tx.paymentIcon}</span>
          <div>
            <p className="text-sm font-medium text-gray-800">{tx.payment}</p>
            {tx.paymentSub ? (
              <p className="text-xs text-gray-400">{tx.paymentSub}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`text-sm font-bold whitespace-nowrap ${
            tx.income ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {tx.amount}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
            tx.statusStyle || "bg-emerald-50 text-emerald-700"
          }`}
        >
          {tx.status}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={() => onDelete?.(tx.id)}
          disabled={deleting || !tx.id}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          aria-label={`Delete ${tx.name}`}
          title="Delete transaction"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}
