import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { isOnboardingComplete } from "@/lib/onboarding/profile-status";
import LoginForm from "./LoginForm";
import { confirmationNotice } from "@/lib/auth/confirmation";

export default async function LoginPage({ searchParams }) {
  const user = await getUser();
  if (user) {
    const supabase = await createClient();
    const completed = await isOnboardingComplete(supabase, user.id);
    redirect(completed ? "/dashboard" : "/onboarding");
  }

  const params = await searchParams;
  const message = params?.message;
  const notice = confirmationNotice(params?.notice);
  const next = params?.next || "/dashboard";

  return (
    <LoginForm message={notice?.message || message} messageType={notice?.type} nextPath={next} />
  );
}
