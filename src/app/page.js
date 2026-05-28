import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { isOnboardingComplete } from "@/lib/onboarding/profile-status";
import LandingPage from "@/components/marketing/LandingPage";

export default async function HomePage() {
  const user = await getUser();

  if (user) {
    const supabase = await createClient();
    const completed = await isOnboardingComplete(supabase, user.id);
    redirect(completed ? "/dashboard" : "/onboarding");
  }

  return <LandingPage />;
}
