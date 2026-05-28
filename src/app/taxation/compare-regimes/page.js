import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CompareRegimesSection from "@/components/taxation/CompareRegimesSection";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";
import { buildRegimeCompareData } from "@/lib/taxation/build-regime-compare-data";

export default async function CompareRegimesPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const taxContext = await loadTaxContext(supabase, user.id);
  const compareData = buildRegimeCompareData(taxContext);

  return (
    <DashboardLayout showRightSidebar={false}>
      <CompareRegimesSection initialData={compareData} taxContext={taxContext} />
    </DashboardLayout>
  );
}
