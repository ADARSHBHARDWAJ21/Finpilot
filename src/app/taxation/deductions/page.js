import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DeductionOverviewSection from "@/components/taxation/DeductionOverviewSection";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";

export default async function DeductionsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const taxContext = await loadTaxContext(supabase, user.id);

  return (
    <DashboardLayout showRightSidebar={false}>
      <DeductionOverviewSection taxContext={taxContext} />
    </DashboardLayout>
  );
}
