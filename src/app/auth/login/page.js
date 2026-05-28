import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { isOnboardingComplete } from "@/lib/onboarding/profile-status";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }) {
  const user = await getUser();
  if (user) {
    const supabase = await createClient();
    const completed = await isOnboardingComplete(supabase, user.id);
    redirect(completed ? "/dashboard" : "/onboarding");
  }

  const params = await searchParams;
  const message = params?.message;
  const next = params?.next || "/dashboard";

  return (
    <LoginForm message={message} nextPath={next} />
  );
}
