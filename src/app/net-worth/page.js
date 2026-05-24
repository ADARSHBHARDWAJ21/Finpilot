import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/ComingSoon";

export default function NetWorthPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <ComingSoon title="Net Worth" />
    </DashboardLayout>
  );
}
