import DashboardLayout from "@/components/layout/DashboardLayout";
import RemindersSection from "@/components/reminders/RemindersSection";

export default function RemindersPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <RemindersSection />
    </DashboardLayout>
  );
}
