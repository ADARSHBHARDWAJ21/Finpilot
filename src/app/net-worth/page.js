import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ComingSoon from "@/components/ComingSoon";

export default async function NetWorthPage() {
  await requireUser();

  return (
    <DashboardLayout showRightSidebar={false}>
      <ComingSoon
        title="Net Worth Radar"
        subtitle="A future view of assets, liabilities and progress towards your longer-term plans."
        features={[
          "Live multi-bank account aggregation via Account Aggregator (RBI licensed)",
          "Real estate & physical asset valuation estimates",
          "Automated debt pay-off avalanche vs snowball simulation",
          "FIRE (Financial Independence, Retire Early) timeline calculator",
        ]}
      />
    </DashboardLayout>
  );
}
