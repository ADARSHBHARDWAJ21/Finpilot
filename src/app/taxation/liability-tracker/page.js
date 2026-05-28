import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaxLiabilityTrackerSection from "@/components/taxation/TaxLiabilityTrackerSection";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";
import { buildLiabilityTrackerData } from "@/lib/taxation/build-liability-tracker-data";

export default async function LiabilityTrackerPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const taxContext = await loadTaxContext(supabase, user.id);
  const liabilityData = buildLiabilityTrackerData(taxContext);

  return (
    <DashboardLayout showRightSidebar={false}>
      <TaxLiabilityTrackerSection data={liabilityData} />
    </DashboardLayout>
  );
}

