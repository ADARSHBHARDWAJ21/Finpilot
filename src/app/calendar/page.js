import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CalendarSection from "@/components/calendar/CalendarSection";

export default async function CalendarPage() {
  await requireUser();

  return (
    <DashboardLayout showRightSidebar={false}>
      <CalendarSection />
    </DashboardLayout>
  );
}
