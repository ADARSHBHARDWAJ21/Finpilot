import { createClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { cache } from "react";

/** Returns the current user or null (does not redirect). */
// Deduplicate verification within one server render; never share users across requests.
export const getUser = cache(async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Server components: redirect to login if unauthenticated. */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}
