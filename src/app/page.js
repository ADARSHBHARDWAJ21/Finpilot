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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
        <NetWorthSection />
        <ExpenseChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
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
