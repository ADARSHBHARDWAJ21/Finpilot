import { createClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

/** Returns the current user or null (does not redirect). */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Server components: redirect to login if unauthenticated. */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
