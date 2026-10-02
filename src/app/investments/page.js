import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/ComingSoon";

export default async function InvestmentsPage() {
  await requireUser();

  return (
    <DashboardLayout showRightSidebar={false}>
      <ComingSoon
        title="Investments"
        subtitle="Track stocks, mutual funds, EPF, and PPF with automated tax-loss harvesting and capital gains audit."
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
