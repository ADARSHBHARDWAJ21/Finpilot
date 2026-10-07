import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PlannerSection from "@/components/finance/PlannerSection";
import { readOwnedRows, goalEvents } from "@/lib/finance/data";
import { indiaToday } from "@/lib/finance/model";
export default async function PlannerPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [events, profile] = await Promise.all([
    readOwnedRows(supabase, "finance_events", user.id),
    supabase
      .from("onboarding_profiles")
      .select("documents")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (profile.error)
    throw new Error("Could not load goal reminders. Please refresh.");
  return (
    <DashboardLayout showRightSidebar={false}>
      <PlannerSection
        mode="calendar"
        initialEvents={[...events, ...goalEvents(profile.data)]}
        today={indiaToday()}
      />
    </DashboardLayout>
  );
}
