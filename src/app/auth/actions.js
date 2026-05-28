"use server";

import { createClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export async function signUp(email, password) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/auth/login?message=Check your email to confirm your account");
}

export async function signIn(email, password, nextPath = "/dashboard") {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("onboarding_profiles")
    .select("onboarding_completed")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const safeNext =
    typeof nextPath === "string" && nextPath.startsWith("/") && !nextPath.startsWith("/auth")
      ? nextPath
      : "/dashboard";

  redirect(safeNext);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
