import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";
import SettingsSection from "@/components/settings/SettingsSection";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const taxContext = await loadTaxContext(supabase, user.id);

  return (
    <DashboardLayout showRightSidebar={false}>
      <SettingsSection taxContext={taxContext} />
    </DashboardLayout>
  );
}

