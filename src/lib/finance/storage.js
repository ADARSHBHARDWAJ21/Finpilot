import { yearSchema, CHECKLIST_IDS, detailSchemas } from "./model.js";

// Only the authenticated server action supplies userId; preserve the other JSON field.
export async function updateTaxSection(
  supabase,
  userId,
  year,
  section,
  field,
  value,
  expectedVersion,
) {
  if (!userId) throw new Error("Please sign in again.");
  yearSchema.parse(year);
  if (!["details", "checklist"].includes(field)) throw new Error("Unknown workspace field.");
  if (!CHECKLIST_IDS[section]) throw new Error("Unknown tax section.");
  const { data: existing, error: readError } = await supabase
    .from("tax_workspace_sections")
    .select("updated_at")
    .eq("user_id", userId)
    .eq("financial_year", year)
    .eq("section", section)
    .maybeSingle();
  if (readError) throw new Error("Your tax workspace could not be loaded.");
  if ((existing?.updated_at || null) !== expectedVersion)
    throw new Error(
      "This workspace changed in another tab. Refresh before saving again.",
    );
  const timestamp = Math.max(Date.now(), Date.parse(existing?.updated_at || "1970-01-01") + 1);
  const payload = { [field]: value, updated_at: new Date(timestamp).toISOString() };
  const query = existing
    ? supabase
        .from("tax_workspace_sections")
        .update(payload)
        .eq("user_id", userId)
        .eq("financial_year", year)
        .eq("section", section)
        .eq("updated_at", existing.updated_at)
    : supabase
        .from("tax_workspace_sections")
        .insert({ ...payload, user_id: userId, financial_year: year, section });
  const { data, error } = await query.select("*").maybeSingle();
  if (error || !data)
    throw new Error("The workspace could not be saved. Refresh and try again.");
  return { section: data };
}

export async function saveFilingReminder(supabase, userId, year) {
  if (!userId) throw new Error("Please sign in again.");
    yearSchema.parse(year);
    const { data: record, error: readError } = await supabase.from("tax_workspace_sections")
      .select("details").eq("user_id", userId).eq("financial_year", year).eq("section", "compliance-filing").maybeSingle();
    if (readError || !record) throw new Error("Save your filing details first.");
    const filing = detailSchemas["compliance-filing"].parse(record.details);
    if (!filing.filingDueDate) throw new Error("Save a filing deadline first.");
    const title = `ITR filing — FY ${year}`;
    const { data: existing, error: lookupError } = await supabase.from("finance_events")
      .select("id").eq("user_id", userId).eq("title", title).eq("category", "compliance").order("id").limit(1).maybeSingle();
    if (lookupError) throw new Error("Your calendar could not be loaded.");
    const payload = { title, due_date: filing.filingDueDate, category: "compliance", priority: "high", description: `Your saved filing deadline for FY ${year}. Confirm the applicable date on the Income Tax portal.`, updated_at: new Date().toISOString() };
    const query = existing
      ? supabase.from("finance_events").update(payload).eq("user_id", userId).eq("id", existing.id)
      : supabase.from("finance_events").insert({ ...payload, user_id: userId });
    const { data, error } = await query.select("*").maybeSingle();
    if (error || !data) throw new Error("The filing reminder could not be saved. Please try again.");
    return { event: data };
}
