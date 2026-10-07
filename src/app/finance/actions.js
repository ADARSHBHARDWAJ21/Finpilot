"use server";

import { z } from "zod";
import { updateTaxSection, saveFilingReminder } from "@/lib/finance/storage";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import {
  eventSchema,
  detailSchemas,
  CHECKLIST_IDS,
} from "@/lib/finance/model";

function refreshWorkspaces() {
  for (const path of [
    "/reminders",
    "/calendar",
    "/reports",
    "/taxation",
    "/dashboard",
    "/taxation/compare-regimes",
    "/taxation/deductions",
    "/taxation/liability-tracker",
    "/taxation/simulation",
    "/taxation/ai-copilot",
    "/settings",
  ])
    revalidatePath(path);
  for (const section of Object.keys(CHECKLIST_IDS))
    revalidatePath(`/taxation/${section}`);
}
async function withUser(operation) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user)
      return { error: "Please sign in again to save changes." };
    const result = await operation(supabase, user.id);
    refreshWorkspaces();
    return result;
  } catch (error) {
    return {
      error:
        error instanceof z.ZodError
          ? error.issues[0]?.message || "Check the entered details."
          : error.message || "Changes could not be saved.",
    };
  }
}

export async function saveFinanceEvent(input) {
  return withUser(async (supabase, userId) => {
    const { id, ...values } = eventSchema.parse(input);
    const payload = { ...values, updated_at: new Date().toISOString() };
    const query = id
      ? supabase
          .from("finance_events")
          .update(payload)
          .eq("user_id", userId)
          .eq("id", id)
      : supabase.from("finance_events").insert({ ...payload, user_id: userId });
    const { data, error } = await query.select("*").maybeSingle();
    if (error || !data)
      throw new Error(
        "The reminder could not be saved. Refresh and try again.",
      );
    return { event: data };
  });
}

export async function syncFilingReminder(year) {
  return withUser((supabase, userId) => saveFilingReminder(supabase, userId, year));
}
export async function completeFinanceEvent(id, completed) {
  return withUser(async (supabase, userId) => {
    z.string().uuid().parse(id);
    z.boolean().parse(completed);
    const { data, error } = await supabase
      .from("finance_events")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error || !data)
      throw new Error("This reminder could not be updated. Refresh the list.");
    return { event: data };
  });
}
export async function deleteFinanceEvent(id) {
  return withUser(async (supabase, userId) => {
    z.string().uuid().parse(id);
    const { error } = await supabase
      .from("finance_events")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);
    if (error)
      throw new Error("The reminder could not be deleted. Please try again.");
    return { ok: true };
  });
}

export async function saveTaxDetails(year, section, details, version = null) {
  return withUser(async (supabase, userId) => {
    if (!detailSchemas[section]) throw new Error("Unknown tax section.");
    return updateTaxSection(
      supabase,
      userId,
      year,
      section,
      "details",
      detailSchemas[section].parse(details),
      version,
    );
  });
}
export async function saveTaxChecklist(
  year,
  section,
  checklist,
  version = null,
) {
  return withUser(async (supabase, userId) => {
    const ids = CHECKLIST_IDS[section];
    if (!ids) throw new Error("Unknown tax section.");
    const schema = z
      .object(Object.fromEntries(ids.map((id) => [id, z.boolean().optional()])))
      .strict();
    return updateTaxSection(
      supabase,
      userId,
      year,
      section,
      "checklist",
      schema.parse(checklist),
      version,
    );
  });
}
