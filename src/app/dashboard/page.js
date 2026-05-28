import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Topbar from "@/components/layout/Topbar";
import SummaryCards from "@/components/dashboard/SummaryCards";
import NetWorthSection from "@/components/dashboard/NetWorthSection";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import BudgetTracker from "@/components/dashboard/BudgetTracker";
import TaxSummary from "@/components/dashboard/TaxSummary";
import AIInsights from "@/components/dashboard/AIInsights";
import { getBudgetDashboardData } from "@/app/budget-tracker/actions";
import { getFinancialSummary, getOnboardingProfile, getDashboardChartsData } from "@/app/dashboard/actions";

export default async function DashboardPage() {
  await requireUser();

  let budgetCategories = [];
  let budgetMonthLabel = "";
  let summary = null;
  let onboardingProfile = null;
  let chartsData = null;

  try {
    onboardingProfile = await getOnboardingProfile();
  } catch {
    onboardingProfile = null;
  }

  try {
    const budgetData = await getBudgetDashboardData();
    budgetCategories = budgetData.dashboard?.categories ?? [];
    budgetMonthLabel = budgetData.dashboard?.monthLabel ?? "";
  } catch {
    /* show empty widget */
  }

  try {
    summary = await getFinancialSummary();
  } catch {
    summary = null;
  }

  try {
    chartsData = await getDashboardChartsData();
  } catch {
    chartsData = null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Good morning{onboardingProfile?.full_name ? `, ${onboardingProfile.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {summary?.monthLabel
              ? `Here's your financial overview for ${summary.monthLabel}`
              : "Here's your financial overview"}
          </p>
        </div>
        <Topbar />
      </div>

      <SummaryCards summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5 min-w-0">
        <NetWorthSection netWorthData={chartsData?.netWorth} />
        <ExpenseChart expenseData={chartsData?.expenses} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5 min-w-0">
        <CashFlowChart />
        <BudgetTracker categories={budgetCategories} monthLabel={budgetMonthLabel} />
        <TaxSummary taxSummary={onboardingProfile?.ai_summary} />
      </div>

      <div className="mt-5">
        <AIInsights insights={onboardingProfile?.ai_summary?.insights ?? []} />
      </div>
    </DashboardLayout>
  );
}
