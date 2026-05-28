import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AITaxCopilotSection from "@/components/taxation/AITaxCopilotSection";

export default async function AITaxCopilotPage() {
  await requireUser();

  return (
    <DashboardLayout showRightSidebar={false}>
      <AITaxCopilotSection />
    </DashboardLayout>
  );
}
