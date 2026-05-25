import DashboardLayout from "@/components/layout/DashboardLayout";
import Topbar from "@/components/layout/Topbar";
import SummaryCards from "@/components/dashboard/SummaryCards";
import TransactionsSection from "@/components/transactions/TransactionsSection";

export default function TransactionsPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 min-w-0">
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
