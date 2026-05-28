import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaxationOverviewSection from "@/components/taxation/TaxationOverviewSection";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";
import { getCategoryProgress } from "@/lib/taxation/category-progress";

export default async function TaxationPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const taxContext = await loadTaxContext(supabase, user.id);
  const categoryProgress = getCategoryProgress(taxContext);

  return (
    <DashboardLayout showRightSidebar={false}>
      <TaxationOverviewSection taxContext={taxContext} categoryProgress={categoryProgress} />
    </DashboardLayout>
  );
}
