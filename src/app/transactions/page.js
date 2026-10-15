import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Topbar from "@/components/layout/Topbar";
import TransactionsSection from "@/components/transactions/TransactionsSection";
import { getSelectedMonth } from "@/lib/dashboard/month-selection";
import { transactionMonths } from "@/lib/transactions/period";
import { loadOwnedTransactions } from "@/lib/transactions/records";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TransactionsPage({ searchParams }) {
  const user = await requireUser();

  const supabase = await createClient();

  let transactions = [];
  let loadError = "";
  try {
    transactions = await loadOwnedTransactions(supabase, user.id);
  } catch (error) {
    loadError = error.message;
  }

  const params = await searchParams;
  const { selectedMonth, currentMonth } = await getSelectedMonth(params?.month, user.id);

  return (
    <DashboardLayout showRightSidebar={false}>
      <PageHeader title="Transactions" subtitle="A clear record of what comes in, what goes out, and where it goes.">
        <Topbar selectedMonth={selectedMonth} currentMonth={currentMonth} availableMonths={transactionMonths(transactions)} />
      </PageHeader>

      <TransactionsSection key={selectedMonth} initialTransactions={transactions} selectedMonth={selectedMonth} loadError={loadError} />
    </DashboardLayout>
  );
}
