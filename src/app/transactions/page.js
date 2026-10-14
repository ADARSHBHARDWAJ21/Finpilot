import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Topbar from "@/components/layout/Topbar";
import TransactionsSection from "@/components/transactions/TransactionsSection";
import { currentMonthKey, resolveMonthKey } from "@/lib/dashboard/period";
import { transactionMonths } from "@/lib/transactions/period";
import { loadOwnedTransactions } from "@/lib/transactions/records";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function TransactionsPage({ searchParams }) {
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

  const params = await searchParams;
  const now = new Date();
  const selectedMonth = resolveMonthKey(params?.month, now);

  return (
    <DashboardLayout showRightSidebar={false}>
      <PageHeader title="Transactions" subtitle="A clear record of what comes in, what goes out, and where it goes.">
        <Topbar selectedMonth={selectedMonth} currentMonth={currentMonthKey(now)} availableMonths={transactionMonths(transactions)} />
      </PageHeader>

      <TransactionsSection key={selectedMonth} initialTransactions={transactions} selectedMonth={selectedMonth} loadError={loadError} />
    </DashboardLayout>
  );
}
