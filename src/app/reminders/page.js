import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RemindersSection from "@/components/reminders/RemindersSection";

export default async function RemindersPage() {
  await requireUser();

  return (
    <DashboardLayout showRightSidebar={false}>
      <RemindersSection />
    </DashboardLayout>
  );
}
