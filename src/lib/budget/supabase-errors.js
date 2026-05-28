/** True when PostgREST cannot see the table (not migrated yet). */
export function isMissingBudgetPlansTable(error) {
  if (!error) return false;
  const code = error.code || "";
  const message = String(error.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("could not find the table") ||
    message.includes("budget_plans") && message.includes("schema cache")
  );
}
