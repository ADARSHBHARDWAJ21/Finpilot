import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/ComingSoon";

export default async function InvestmentsPage() {
  await requireUser();

  return (
    <DashboardLayout showRightSidebar={false}>
      <ComingSoon
        title="Investments"
        subtitle="A future space for portfolio records, performance and supporting tax documents."
        features={[
          "Direct CAS (CAMS & KFintech) automatic mutual fund sync",
          "Zerodha, Groww, & Upstox portfolio integration",
          "Quarterly Advance Tax calculation on capital gains",
          "Tax-loss harvesting alerts before March 31 deadline",
        ]}
      />
    </DashboardLayout>
  );
}
