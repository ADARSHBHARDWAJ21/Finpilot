import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportsSection from "@/components/reports/ReportsSection";

export default function ReportsPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <ReportsSection />
    </DashboardLayout>
  );
}
