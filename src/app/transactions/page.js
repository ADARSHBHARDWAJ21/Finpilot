import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Topbar from "@/components/layout/Topbar";
import SummaryCards from "@/components/dashboard/SummaryCards";
import TransactionsSection from "@/components/transactions/TransactionsSection";
import { computeFinancialSummary } from "@/lib/dashboard/compute-summary";
import { loadOwnedTransactions } from "@/lib/transactions/records";
import { PageHeader } from "@/components/layout/PageHeader";

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
      <PageHeader title="Transactions" subtitle="A clear record of what comes in, what goes out, and where it goes.">
        <Topbar />
      </PageHeader>

      <SummaryCards summary={summary} />

      <TransactionsSection initialTransactions={transactions} loadError={loadError} />
    </DashboardLayout>
  );
}
