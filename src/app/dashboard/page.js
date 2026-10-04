import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SummaryCards from "@/components/dashboard/SummaryCards";
import NetWorthSection from "@/components/dashboard/NetWorthSection";
import ExpenseChart from "@/components/dashboard/ExpenseChart";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import BudgetTracker from "@/components/dashboard/BudgetTracker";
import MonthlyActivity from "@/components/dashboard/MonthlyActivity";
import { getDashboardOverview } from "./actions";
import { resolveMonthKey, monthLabel } from "@/lib/dashboard/period";

export default async function DashboardPage({ searchParams }) {
  await requireUser();
  const params = await searchParams;
  const now = new Date();
  const selectedMonth = resolveMonthKey(params?.month, now);
  let overview;
  try { overview = await getDashboardOverview(selectedMonth); } catch { /* Keep the month picker and a retry available. */ }
  return (
    <DashboardLayout rightSidebarProps={{ recentTransactions: overview?.recentTransactions || [], monthLabel: monthLabel(selectedMonth) }}>
      <DashboardHeader fullName={overview?.fullName} selectedMonth={selectedMonth} availableMonths={overview?.availableMonths || []} updatedAt={overview?.updatedAt || now.toISOString()} />
      {!overview ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Your financial data could not be loaded. Select Refresh financial overview to try again.</div> : <>
        <p className="text-xs text-slate-500" role="status">Showing {overview.monthLabel} · {overview.summary.transactionCount} recorded transactions. Balance includes records through this month.</p>
        {!overview.summary.transactionCount && <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">No transactions recorded for {overview.monthLabel}. Choose another month or import a statement to add past activity.</div>}
        <SummaryCards summary={overview.summary} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5 min-w-0">
          <NetWorthSection key={selectedMonth} netWorthData={overview.netWorth} />
          <ExpenseChart expenseData={overview.expenses} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5 min-w-0">
          <CashFlowChart cashFlowData={overview.cashFlow} />
          <BudgetTracker categories={overview.budget.categories} monthLabel={overview.monthLabel} available={overview.budgetAvailable} />
          <MonthlyActivity activity={overview.activity} monthLabel={overview.monthLabel} />
        </div>
      </>}
    </DashboardLayout>
  );
}
