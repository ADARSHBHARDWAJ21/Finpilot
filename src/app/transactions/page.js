import DashboardLayout from "@/components/layout/DashboardLayout";
import Topbar from "@/components/layout/Topbar";
import SummaryCards from "@/components/dashboard/SummaryCards";
import TransactionsSection from "@/components/transactions/TransactionsSection";

export default function TransactionsPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning, Aryan 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s your financial overview for May 2025
          </p>
        </div>
        <Topbar />
      </div>

      <SummaryCards />

      <TransactionsSection />
    </DashboardLayout>
  );
}
