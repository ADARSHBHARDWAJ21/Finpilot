import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DocumentsSection from "@/components/documents/DocumentsSection";

export default async function DocumentsPage() {
  await requireUser();

  return (
    <DashboardLayout showRightSidebar={false}>
      <DocumentsSection />
    </DashboardLayout>
  );
}
