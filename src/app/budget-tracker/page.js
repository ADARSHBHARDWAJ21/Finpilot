import DashboardLayout from "@/components/layout/DashboardLayout";
import BudgetTrackerSection from "@/components/budget/BudgetTrackerSection";

export default function BudgetTrackerPage() {
  return (
    <DashboardLayout showRightSidebar={false}>
      <BudgetTrackerSection />
    </DashboardLayout>
  );
}
