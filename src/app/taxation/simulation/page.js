import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";
import TaxSimulationSection from "@/components/taxation/TaxSimulationSection";

export default async function TaxSimulationPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const taxContext = await loadTaxContext(supabase, user.id);

  return (
    <DashboardLayout showRightSidebar={false}>
      <TaxSimulationSection taxContext={taxContext} />
    </DashboardLayout>
  );
}

