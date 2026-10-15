import "server-only";

import { cookies } from "next/headers";
import { currentMonthKey } from "@/lib/dashboard/period";
import { MONTH_PREFERENCE_COOKIE, resolvePreferredMonth } from "@/lib/dashboard/month-preference";

export async function getSelectedMonth(requestedMonth, userId, now = new Date()) {
  const cookieStore = await cookies();
  return {
    selectedMonth: resolvePreferredMonth(requestedMonth, cookieStore.get(MONTH_PREFERENCE_COOKIE)?.value, userId, now),
    currentMonth: currentMonthKey(now),
  };
}
