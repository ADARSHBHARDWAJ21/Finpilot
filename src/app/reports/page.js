import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportsSection from "@/components/reports/ReportsSection";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";
import { buildReportsData } from "@/lib/reports/build-reports-data";

export default async function ReportsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [taxContext, { data: transactions }] = await Promise.all([
    loadTaxContext(supabase, user.id),
    supabase
      .from("transactions")
      .select("transaction_date, amount, type, category")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: true }),
  ]);
  const reportsData = buildReportsData(taxContext, transactions ?? []);

  return (
    <DashboardLayout showRightSidebar={false}>
      <ReportsSection data={reportsData} />
    </DashboardLayout>
  );
}
