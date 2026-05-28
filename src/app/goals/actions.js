"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";

async function getUserOrThrow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function saveGoalsWorkspace(payload) {
  const { supabase, user } = await getUserOrThrow();

  const { data: existing } = await supabase
    .from("onboarding_profiles")
    .select("id, documents, email")
    .eq("user_id", user.id)
    .maybeSingle();

  const nextDocuments = {
    ...(existing?.documents || {}),
    goals_workspace: {
      goals: payload?.goals ?? [],
      calendarEntries: payload?.calendarEntries ?? [],
      updatedAt: new Date().toISOString(),
    },
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("onboarding_profiles")
      .update({ documents: nextDocuments, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("onboarding_profiles").insert({
      user_id: user.id,
      email: user.email ?? "",
      documents: nextDocuments,
      current_step: 1,
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/goals");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return { ok: true };
}

