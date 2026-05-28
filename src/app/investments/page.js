import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/ComingSoon";

export default async function InvestmentsPage() {
  await requireUser();

  return (
    <DashboardLayout showRightSidebar={false}>
      <ComingSoon title="Investments" />
    </DashboardLayout>
  );
}
