import { yearSchema, CHECKLIST_IDS, validDate } from "./model.js";

export async function readOwnedRows(supabase, table, userId, year) {
  if (!userId) throw new Error("Please sign in again.");
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    let query = supabase.from(table).select("*").eq("user_id", userId);
    if (year) query = query.eq("financial_year", year);
    const result = await query
      .order(table === "tax_workspace_sections" ? "section" : "id")
      .range(offset, offset + 999);
    if (result.error)
      throw new Error(
        "Saved workspace data could not be loaded. Please refresh and try again.",
      );
    rows.push(...(result.data || []));
    if ((result.data?.length || 0) < 1000) return rows;
  }
}

export async function loadTaxWorkspace(supabase, userId, year) {
  yearSchema.parse(year);
  const [rows, documents] = await Promise.all([
    readOwnedRows(supabase, "tax_workspace_sections", userId, year),
    readOwnedRows(supabase, "tax_documents", userId, year),
  ]);
  return {
    year,
    sections: Object.fromEntries(rows.map((row) => [row.section, row])),
    documents,
  };
}

export function validateProofTarget(year, section, proofKey) {
  yearSchema.parse(year);
  if (!CHECKLIST_IDS[section]?.includes(proofKey))
    throw new Error("Choose a valid document category.");
}

export function goalEvents(profile) {
  const entries = profile?.documents?.goals_workspace?.calendarEntries;
  if (!Array.isArray(entries)) return [];
  return entries.flatMap((entry, index) => {
    let date = entry.dueDate;
    if (!validDate(date) && typeof date === "string") {
      const match = date.match(
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})$/i,
      );
      if (match)
        date = `${match[2]}-${String(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(match[1].toLowerCase()) + 1).padStart(2, "0")}-01`;
    }
    if (!validDate(date)) return [];
    return [
      {
        id: `goal-${entry.goalId}-${index}`,
        title: String(entry.title || "Goal review").slice(0, 160),
        description:
          "From Goals planner. Month-only goal dates are shown on the first day; confirm the actual due date in Goals.",
        due_date: date,
        category: entry.type === "emi" ? "bills" : "investments",
        priority: "medium",
        completed: entry.type === "completed",
        source: "goals",
      },
    ];
  });
}
