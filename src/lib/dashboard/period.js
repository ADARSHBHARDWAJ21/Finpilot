export const DASHBOARD_TIME_ZONE = "Asia/Kolkata";

export function currentMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: DASHBOARD_TIME_ZONE, year: "numeric", month: "2-digit" }).formatToParts(new Date(date));
  return `${parts.find((part) => part.type === "year").value}-${parts.find((part) => part.type === "month").value}`;
}

export function validMonthKey(value) {
  return typeof value === "string" && /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value);
}

export function resolveMonthKey(value, now = new Date()) {
  const current = currentMonthKey(now);
  return validMonthKey(value) && value <= current ? value : current;
}

export function shiftMonth(key, offset) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}

export function monthLabel(key, short = false) {
  return new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", month: short ? "short" : "long", year: "numeric" });
}

export function transactionMonthKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return null;
  const day = value.slice(0, 10);
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day ? null : day.slice(0, 7);
}

export function timeGreeting(date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: DASHBOARD_TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(new Date(date)));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}
