import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Topbar from "@/components/layout/Topbar";
import SummaryCards from "@/components/dashboard/SummaryCards";
import TransactionsSection from "@/components/transactions/TransactionsSection";
import { computeFinancialSummary } from "@/lib/dashboard/compute-summary";
import { loadOwnedTransactions } from "@/lib/transactions/records";

export default async function TransactionsPage() {
  await requireUser();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let transactions = [];
  let loadError = "";
  try {
    transactions = await loadOwnedTransactions(supabase, user.id);
  } catch (error) {
    loadError = error.message;
  }

  const summary = computeFinancialSummary(transactions ?? []);

  return (
    <DashboardLayout showRightSidebar={false}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {summary.monthLabel
              ? `Your spending overview for ${summary.monthLabel}`
              : "Import CSV files and review your spending"}
          </p>
        </div>
        <Topbar />
      </div>

      <SummaryCards summary={summary} />

      <TransactionsSection initialTransactions={transactions} loadError={loadError} />
    </DashboardLayout>
  );
}
