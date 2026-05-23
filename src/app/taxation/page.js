import DashboardLayout from "@/components/layout/DashboardLayout";
import TaxationSection from "@/components/taxation/TaxationSection";

export default function TaxationPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <TaxationSection />
    </DashboardLayout>
  );
}
