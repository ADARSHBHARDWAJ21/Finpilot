import { Trash2, ArrowDownLeft, ArrowUpRight, CreditCard, Smartphone, ArrowRight } from "lucide-react";

export default function TransactionRow({ tx, onDelete, onToggle, onView, selected = false, deleting = false }) {
  return (
    <tr className={`transition-colors group ${selected ? "bg-indigo-50/60" : "hover:bg-slate-50/70"}`}>
      <td className="pl-6 pr-2 py-4"><input type="checkbox" checked={selected} onChange={() => onToggle?.(tx.id)} disabled={deleting || !tx.id} aria-label={`Select ${tx.name} on ${tx.date}, ${tx.amount}`} className="h-4 w-4 rounded accent-indigo-600 disabled:cursor-not-allowed" /></td>
      <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">{tx.date}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl ${tx.income ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"} flex items-center justify-center shrink-0`}
          >
            {tx.income ? <ArrowDownLeft size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}
          </div>
          <div>
            <button type="button" onClick={()=>onView?.(tx.id)} className="text-left text-sm font-medium text-foreground leading-snug hover:text-primary hover:underline">{tx.name}</button>
            {tx.sub && <p className="text-[11px] text-slate-400 mt-0.5">{tx.sub}</p>}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground"
        >
          {tx.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{tx.payment?.toLowerCase().includes("upi") ? <Smartphone size={15} /> : <CreditCard size={15} />}</span>
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
          className={`text-sm font-semibold tabular-nums ${
            tx.income ? "text-primary" : "text-slate-900"
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

export function TransactionCard({tx,onDelete,onToggle,onView,selected,deleting}) {
  return <article className={`rounded-2xl border p-4 ${selected ? "border-primary/30 bg-secondary" : "border-border bg-white"}`}><div className="flex items-start gap-3"><label className="flex min-h-11 min-w-11 items-center justify-center"><input type="checkbox" aria-label={`Select ${tx.name} on ${tx.date}, ${tx.amount}`} checked={selected} onChange={()=>onToggle(tx.id)} disabled={deleting} className="h-4 w-4" /></label><div className="min-w-0 flex-1"><button type="button" className="text-left text-sm font-medium leading-relaxed hover:text-primary" onClick={()=>onView(tx.id)}>{tx.name}</button><p className="mt-1 text-xs text-muted-foreground">{tx.date}</p></div><strong className={`shrink-0 text-sm tabular-nums ${tx.income ? "text-primary" : "text-foreground"}`}>{tx.amount}</strong></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><span className="text-xs text-muted-foreground">{tx.category} · {tx.payment}</span><span className={`rounded-full px-2.5 py-1 text-xs ${tx.statusStyle}`}>{tx.status}</span></div><div className="mt-2 flex justify-between"><button type="button" onClick={()=>onView(tx.id)} className="inline-flex items-center gap-2 text-sm text-primary">View details<ArrowRight size={14} /></button><button type="button" onClick={()=>onDelete(tx.id)} disabled={deleting} aria-label={`Delete ${tx.name}`} className="flex min-w-11 items-center justify-center text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button></div></article>;
}
