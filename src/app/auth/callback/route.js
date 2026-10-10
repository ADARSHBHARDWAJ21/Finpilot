import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { isOnboardingComplete } from "@/lib/onboarding/profile-status";
import { confirmationDestination, getAuthOrigin } from "@/lib/auth/confirmation";

export const dynamic = "force-dynamic";

export async function GET(request) {
  let origin;
  try {
    origin = getAuthOrigin({ headers: request.headers, requestUrl: request.url });
  } catch {
    return new Response("Email confirmation is temporarily unavailable. Please return to the app and sign in.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
    });
  }
  const supabase = await createClient();
  const destination = await confirmationDestination({
    searchParams: new URL(request.url).searchParams,
    supabase,
    isOnboardingComplete,
  });
  // createClient writes the exchanged session cookies via Next's cookie store.
  const response = NextResponse.redirect(new URL(destination, origin), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
