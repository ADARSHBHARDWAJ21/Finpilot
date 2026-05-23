import DashboardLayout from "@/components/layout/DashboardLayout";
import DocumentsSection from "@/components/documents/DocumentsSection";

export default function DocumentsPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <DocumentsSection />
    </DashboardLayout>
  );
}
