"use server";

import { createClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/security/next-path";
import { headers } from "next/headers";
import { signupEmailRedirect } from "@/lib/auth/confirmation";

export async function signUp(email, password) {
  let emailRedirectTo;
  try {
    emailRedirectTo = signupEmailRedirect({ headers: await headers() });
  } catch {
    return { error: "Email confirmation is not configured for this app address. Please try again after the site settings are updated." };
  }
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data?.session ? "/onboarding" : "/auth/login?notice=check_email");
}

export async function signIn(email, password, nextPath = "/dashboard") {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
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

  redirect(safeNextPath(nextPath));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
