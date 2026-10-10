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
import { resolveMonthKey } from "@/lib/dashboard/period";
import { createClient } from "@/lib/supabase/server-client";
import { loadFinanceProfile } from "@/lib/finance/load";
import { loadTaxWorkspace } from "@/lib/finance/data";
import { buildFinanceReport } from "@/lib/finance/reports";
import { resolveFinancialYear } from "@/lib/finance/model";
import WorkspaceOverview from "@/components/dashboard/WorkspaceOverview";

export default async function DashboardPage({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const now = new Date();
  const selectedMonth = resolveMonthKey(params?.month, now);
  const year = resolveFinancialYear(params?.year);
  const results = await Promise.allSettled([getDashboardOverview(selectedMonth), (async () => {
    const supabase = await createClient();
    const [base, workspace] = await Promise.all([loadFinanceProfile(supabase, user.id), loadTaxWorkspace(supabase, user.id, year)]);
    return buildFinanceReport({ ...base, workspace });
  })()]);
  const overview = results[0].status === "fulfilled" ? results[0].value : null;
  const report = results[1].status === "fulfilled" ? results[1].value : null;
  return (
    <DashboardLayout showRightSidebar={false}>
      <DashboardHeader fullName={overview?.fullName} selectedMonth={selectedMonth} availableMonths={overview?.availableMonths || []} updatedAt={overview?.updatedAt || now.toISOString()} />
      <WorkspaceOverview overview={overview} report={report} year={year} />
      {!overview ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Your financial data could not be loaded. Select Refresh financial overview to try again.</div> : <>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">Your financial overview</h2>
          <p className="text-[11px] text-muted-foreground" role="status">{overview.monthLabel} · {overview.summary.transactionCount} recorded transactions</p>
        </div>
        {!overview.summary.transactionCount && <div className="mt-4 rounded-xl border border-border bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">No transactions recorded for {overview.monthLabel}. Choose another month or import a statement to add past activity.</div>}
        <SummaryCards summary={overview.summary} omitTitles={["Total Income","Total Expenses"]} />
        <div className="mt-5 grid min-w-0 grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7"><NetWorthSection key={selectedMonth} netWorthData={overview.netWorth} /></div>
          <div className="min-w-0 lg:col-span-5"><ExpenseChart expenseData={overview.expenses} /></div>
        </div>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7"><CashFlowChart cashFlowData={overview.cashFlow} /></div>
          <div className="min-w-0 lg:col-span-5"><BudgetTracker categories={overview.budget.categories} monthLabel={overview.monthLabel} available={overview.budgetAvailable} /></div>
        </div>
        <div className="mt-5">
          <MonthlyActivity activity={overview.activity} monthLabel={overview.monthLabel} />
        </div>
      </>}
    </DashboardLayout>
  );
}
