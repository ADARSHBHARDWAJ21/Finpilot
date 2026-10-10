import DashboardLayout from "@/components/layout/DashboardLayout";
import { Suspense } from "react";

export default function WorkspaceLoading() {
  const placeholder = <div role="status" aria-label="Loading your workspace" className="space-y-6"><span className="sr-only">Loading your workspace…</span><div className="space-y-3"><div className="fp-skeleton h-3 w-36"/><div className="fp-skeleton h-9 w-56"/><div className="fp-skeleton h-4 w-3/4 max-w-lg"/></div><div className="grid gap-5 md:grid-cols-2"><div className="fp-skeleton h-64"/><div className="fp-skeleton h-64"/></div><div className="fp-skeleton h-80"/></div>;
  return <Suspense fallback={<div className="min-h-dvh bg-background p-6 sm:p-9">{placeholder}</div>}><DashboardLayout showRightSidebar={false}>{placeholder}</DashboardLayout></Suspense>;
}
