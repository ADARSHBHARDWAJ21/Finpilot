import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GoalsSection from "@/components/goals/GoalsSection";

export default async function GoalsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("onboarding_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const workspace = profile?.documents?.goals_workspace || {};
  const initialGoals = workspace.goals || [];
  const initialCalendarEntries = workspace.calendarEntries || [];

  return (
    <DashboardLayout showRightSidebar={false}>
      <GoalsSection
        initialGoals={initialGoals}
        initialCalendarEntries={initialCalendarEntries}
        financialProfile={profile || {}}
      />
    </DashboardLayout>
  );
}
