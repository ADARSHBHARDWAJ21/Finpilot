"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";

export default function Topbar() {
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const router = useRouter();
  return <>
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <button type="button" onClick={() => startRefresh(() => router.refresh())} disabled={refreshing} aria-label="Refresh transactions" title="Refresh transactions" className="fp-button size-11 px-0"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
      <button type="button" onClick={() => setAddOpen(true)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:flex-none"><Plus size={17} />Add transaction</button>
    </div>
    <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} defaultType="expense" />
  </>;
}
