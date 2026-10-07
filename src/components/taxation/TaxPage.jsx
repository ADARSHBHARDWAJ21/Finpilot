import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaxHub from "./TaxHub";
import { loadFinanceProfile } from "@/lib/finance/load";
import { loadTaxWorkspace, readOwnedRows } from "@/lib/finance/data";
import { resolveFinancialYear, yearDates } from "@/lib/finance/model";
import { buildFinanceReport } from "@/lib/finance/reports";

export default async function TaxPage({ mode, searchParams }) {
  const user = await requireUser();
  const supabase = await createClient();
  const base = await loadFinanceProfile(supabase, user.id);
  const year = resolveFinancialYear((await searchParams)?.year, base.profile.financial_year);
  const [workspace, reminders] = await Promise.all([
    loadTaxWorkspace(supabase, user.id, year),
    mode === "overview" ? readOwnedRows(supabase, "finance_events", user.id) : [],
  ]);
  const range = yearDates(year);
  // Filing reminders may fall after the financial year's March end.
  const events = reminders.filter((e) => !e.completed && ["tax", "compliance", "document"].includes(e.category) && (e.title.includes(year) || e.due_date >= range.start && e.due_date <= range.end)).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const report = buildFinanceReport({ ...base, workspace });
  return <DashboardLayout showRightSidebar={false}><TaxHub key={`${mode}-${year}-${Object.values(workspace.sections).map((s) => s.updated_at).join("-")}`} mode={mode} report={report} workspace={workspace} events={events} /></DashboardLayout>;
}
