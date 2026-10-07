import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportsWorkspace from "@/components/finance/ReportsWorkspace";
import { loadFinanceReport } from "@/lib/finance/load";
import { resolveFinancialYear } from "@/lib/finance/model";
export default async function ReportsPage({ searchParams }) {
  const user = await requireUser(),
    supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("onboarding_profiles")
    .select("financial_year")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error)
    throw new Error("Could not load your financial year. Please refresh.");
  const year = resolveFinancialYear(
    (await searchParams).year,
    profile?.financial_year,
  );
  const report = await loadFinanceReport(supabase, user.id, year);
  return (
    <DashboardLayout showRightSidebar={false}>
      <ReportsWorkspace report={report} />
    </DashboardLayout>
  );
}
