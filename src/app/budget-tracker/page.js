import { requireUser } from "@/lib/auth";
import { getBudgetDashboardData } from "@/app/budget-tracker/actions";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BudgetTrackerSection from "@/components/budget/BudgetTrackerSection";

export default async function BudgetTrackerPage({ searchParams }) {
  await requireUser();

  const params = await searchParams;
  const monthKey = typeof params?.month === "string" ? params.month : undefined;

  let initialData = null;
  let loadError = null;

  try {
    initialData = await getBudgetDashboardData(monthKey);
  } catch (error) {
    loadError = error.message;
  }

  return (
    <DashboardLayout showRightSidebar={false}>
      <BudgetTrackerSection
        key={monthKey || initialData?.dashboard?.monthKey || "current"}
        initialData={initialData}
        loadError={loadError}
        budgetPlansAvailable={initialData?.budgetPlansAvailable ?? true}
      />
    </DashboardLayout>
  );
}
