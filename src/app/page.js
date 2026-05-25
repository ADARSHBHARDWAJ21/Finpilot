import DashboardLayout from "@/components/layout/DashboardLayout";
import Topbar from "@/components/layout/Topbar";
import SummaryCards from "@/components/dashboard/SummaryCards";
import NetWorthSection from "@/components/dashboard/NetWorthSection";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import BudgetTracker from "@/components/dashboard/BudgetTracker";
import TaxSummary from "@/components/dashboard/TaxSummary";
import AIInsights from "@/components/dashboard/AIInsights";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Good morning, Aryan 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s your financial overview for May 2025
          </p>
        </div>
        <Topbar />
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5 min-w-0">
        <NetWorthSection />
        <ExpenseChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5 min-w-0">
        <CashFlowChart />
        <BudgetTracker />
        <TaxSummary />
      </div>

      <div className="mt-5">
        <AIInsights />
      </div>
    </DashboardLayout>
  );
}
