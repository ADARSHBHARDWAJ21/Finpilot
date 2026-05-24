import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/ComingSoon";

export default function GoalsPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <ComingSoon title="Goals" />
    </DashboardLayout>
  );
}
