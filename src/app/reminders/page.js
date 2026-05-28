import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RemindersSection from "@/components/reminders/RemindersSection";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";
import { buildReminderData } from "@/lib/planner/realtime-events";

export default async function RemindersPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const taxContext = await loadTaxContext(supabase, user.id);
  const reminderData = buildReminderData(taxContext);

  return (
    <DashboardLayout showRightSidebar={false}>
      <RemindersSection data={reminderData} />
    </DashboardLayout>
  );
}
