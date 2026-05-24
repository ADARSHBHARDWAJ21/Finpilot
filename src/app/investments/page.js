import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/ComingSoon";

export default function InvestmentsPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <ComingSoon title="Investments" />
    </DashboardLayout>
  );
}
