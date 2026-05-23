import DashboardLayout from "@/components/layout/DashboardLayout";
import AITaxCopilotSection from "@/components/taxation/AITaxCopilotSection";

export default function AITaxCopilotPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <AITaxCopilotSection />
    </DashboardLayout>
  );
}
