import { currentMonthKey, validMonthKey } from "./period.js";

export const MONTH_PREFERENCE_COOKIE = "finpilot-month";
export const MONTH_PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365;

function selectableMonth(value, currentMonth) {
  return validMonthKey(value) && value <= currentMonth;
}

/** Only the account that saved a preference may read it. */
export function readMonthPreference(cookieValue, userId, now = new Date()) {
  if (typeof cookieValue !== "string" || !userId) return null;

  try {
    const preference = JSON.parse(cookieValue);
    const currentMonth = currentMonthKey(now);
    return preference?.userId === userId &&
      selectableMonth(preference.monthKey, currentMonth) &&
      preference.monthKey < currentMonth
      ? preference.monthKey
      : null;
  } catch {
    return null;
  }
}

/** An explicit URL value always wins, including invalid values falling back to today. */
export function resolvePreferredMonth(requestedMonth, cookieValue, userId, now = new Date()) {
  const currentMonth = currentMonthKey(now);
  if (requestedMonth !== undefined) {
    return selectableMonth(requestedMonth, currentMonth) ? requestedMonth : currentMonth;
  }
  return readMonthPreference(cookieValue, userId, now) || currentMonth;
}

/** A null update clears the preference so the current view follows calendar rollover. */
export function monthPreferenceForSelection(userId, selectedMonth, now = new Date()) {
  if (typeof userId !== "string" || !userId) throw new Error("Unauthorized");
  const currentMonth = currentMonthKey(now);
  if (!selectableMonth(selectedMonth, currentMonth)) throw new Error("Choose a valid month up to the current month.");
  return selectedMonth === currentMonth ? null : JSON.stringify({ userId, monthKey: selectedMonth });
}
