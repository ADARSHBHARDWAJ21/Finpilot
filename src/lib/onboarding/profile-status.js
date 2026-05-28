export async function isOnboardingComplete(supabase, userId) {
  const { data, error } = await supabase
    .from("onboarding_profiles")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || String(error.message).includes("onboarding_profiles")) {
      return false;
    }
    return false;
  }

  return Boolean(data?.onboarding_completed);
}
