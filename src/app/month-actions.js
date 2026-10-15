"use server";

import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { currentMonthKey } from "@/lib/dashboard/period";
import { MONTH_PREFERENCE_COOKIE, MONTH_PREFERENCE_MAX_AGE, monthPreferenceForSelection } from "@/lib/dashboard/month-preference";

export async function rememberSelectedMonth(monthKey, followCurrent = false) {
  const user = await requireUser();
  const now = new Date();
  const selectedMonth = followCurrent === true ? currentMonthKey(now) : monthKey;
  const value = monthPreferenceForSelection(user.id, selectedMonth, now);
  const cookieStore = await cookies();

  // Server Action cookie mutations also invalidate prefetched client page data.
  cookieStore.set(MONTH_PREFERENCE_COOKIE, value || "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: value === null ? 0 : MONTH_PREFERENCE_MAX_AGE,
  });
  return selectedMonth;
}
