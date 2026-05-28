import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { isOnboardingComplete } from "@/lib/onboarding/profile-status";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const user = await getUser();
  if (user) {
    const supabase = await createClient();
    const completed = await isOnboardingComplete(supabase, user.id);
    redirect(completed ? "/dashboard" : "/onboarding");
  }

  return <SignupForm />;
}
