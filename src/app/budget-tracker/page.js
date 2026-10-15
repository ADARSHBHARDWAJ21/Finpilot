import { requireUser } from "@/lib/auth";
import { getBudgetDashboardData } from "@/app/budget-tracker/actions";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BudgetTrackerSection from "@/components/budget/BudgetTrackerSection";
import { getSelectedMonth } from "@/lib/dashboard/month-selection";

export default async function BudgetTrackerPage({ searchParams }) {
  const user = await requireUser();

  const params = await searchParams;
  const { selectedMonth, currentMonth } = await getSelectedMonth(params?.month, user.id);

  let initialData = null;
  let loadError = null;

  try {
    initialData = await getBudgetDashboardData(selectedMonth);
  } catch (error) {
    loadError = error.message;
  }

  return (
    <DashboardLayout showRightSidebar={false}>
      <BudgetTrackerSection
        key={selectedMonth}
        selectedMonth={selectedMonth}
        currentMonth={currentMonth}
        initialData={initialData}
        loadError={loadError}
        budgetPlansAvailable={initialData?.budgetPlansAvailable ?? true}
      />
    </DashboardLayout>
  );
}
