import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { currentMonthKey } from "../src/lib/dashboard/period.js";
import { MONTH_PREFERENCE_COOKIE, MONTH_PREFERENCE_MAX_AGE, monthPreferenceForSelection, readMonthPreference, resolvePreferredMonth } from "../src/lib/dashboard/month-preference.js";

// Load the real action with request-bound dependencies, as the statement route tests do.
const actionSource = await readFile(new URL("../src/app/month-actions.js", import.meta.url), "utf8");
const createAction = new Function("cookies", "requireUser", "currentMonthKey", "MONTH_PREFERENCE_COOKIE", "MONTH_PREFERENCE_MAX_AGE", "monthPreferenceForSelection", "Date", "process", actionSource.replace(/^import .*;\r?$/gm, "").replace(/^export /gm, "") + "\nreturn rememberSelectedMonth;");

function monthAction({ userId = "first-account", instant = "2026-10-15T10:00:00Z", nodeEnv = "production" } = {}) {
  const writes = [];
  const values = new Map([[MONTH_PREFERENCE_COOKIE, JSON.stringify({ userId, monthKey: "2026-08" })]]);
  let cookieRequests = 0;
  class RequestDate extends Date {
    constructor(...args) { super(...(args.length ? args : [instant])); }
  }
  const action = createAction(
    async () => {
      cookieRequests++;
      return { set(name, value, options) {
        writes.push({ name, value, options });
        if (options.maxAge === 0) values.delete(name); else values.set(name, value);
      } };
    },
    async () => {
      if (!userId) throw new Error("Unauthorized");
      return { id: userId };
    },
    currentMonthKey, MONTH_PREFERENCE_COOKIE, MONTH_PREFERENCE_MAX_AGE, monthPreferenceForSelection, RequestDate,
    { env: { NODE_ENV: nodeEnv } },
  );
  return { action, writes, cookieRequests: () => cookieRequests, cookieValue: () => values.get(MONTH_PREFERENCE_COOKIE) };
}

const now = new Date("2026-10-15T10:00:00Z");
const saved = monthPreferenceForSelection("first-account", "2026-08", now);

test("an explicit valid URL month takes priority over the saved account preference", () => {
  assert.equal(resolvePreferredMonth("2026-09", saved, "first-account", now), "2026-09");
  assert.equal(resolvePreferredMonth("2026-10", saved, "first-account", now), "2026-10");
  assert.equal(resolvePreferredMonth(undefined, saved, "first-account", now), "2026-08");
});

test("explicit invalid and future URL values fall back to today without restoring an older preference", () => {
  for (const month of ["", null, ["2026-08"], ["2026-08", "2026-09"], "2026-13", "2026-9", "2026-11", "2027-01", "garbage"]) {
    assert.equal(resolvePreferredMonth(month, saved, "first-account", now), "2026-10");
  }
});

test("a new or signed-out account cannot inherit another account's saved month", () => {
  assert.equal(readMonthPreference(saved, "second-account", now), null);
  assert.equal(resolvePreferredMonth(undefined, saved, "second-account", now), "2026-10");
  assert.equal(resolvePreferredMonth(undefined, saved, undefined, now), "2026-10");
  assert.equal(resolvePreferredMonth(undefined, saved, "", now), "2026-10");
});

test("malformed, outdated-shaped, and future cookie values safely fall back to today", () => {
  const cookies = [undefined, "", "2026-08", "{", "null", "[]", "{}", JSON.stringify({ userId: "first-account", monthKey: ["2026-08"] }), JSON.stringify({ userId: "first-account", monthKey: "2026-11" }), JSON.stringify({ userId: "first-account", monthKey: "2026-00" })];
  for (const value of cookies) assert.equal(resolvePreferredMonth(undefined, value, "first-account", now), "2026-10");
});

test("choosing today clears the preference and allows the following month to become current", () => {
  assert.equal(monthPreferenceForSelection("first-account", "2026-10", now), null);
  assert.equal(resolvePreferredMonth(undefined, undefined, "first-account", "2026-10-31T18:29:59Z"), "2026-10");
  assert.equal(resolvePreferredMonth(undefined, undefined, "first-account", "2026-10-31T18:30:00Z"), "2026-11");
  assert.equal(resolvePreferredMonth(undefined, saved, "first-account", "2026-10-31T18:30:00Z"), "2026-08");
});

test("India's year rollover determines valid selections and current month resets", () => {
  const before = "2026-12-31T18:29:59Z";
  const after = "2026-12-31T18:30:00Z";
  assert.throws(() => monthPreferenceForSelection("first-account", "2027-01", before), /valid month/);
  assert.equal(monthPreferenceForSelection("first-account", "2027-01", after), null);
  const december = monthPreferenceForSelection("first-account", "2026-12", after);
  assert.equal(resolvePreferredMonth(undefined, december, "first-account", after), "2026-12");
});

test("invalid mutations are rejected before a cookie update can be produced", () => {
  for (const month of [undefined, null, ["2026-08"], "", "2026-00", "2026-11", "3000-01"]) {
    assert.throws(() => monthPreferenceForSelection("first-account", month, now), /valid month/);
  }
  assert.throws(() => monthPreferenceForSelection(undefined, "2026-08", now), /Unauthorized/);
  assert.throws(() => monthPreferenceForSelection("", "2026-08", now), /Unauthorized/);
});

test("the authenticated action persists an account-scoped past month with protected cookie options", async () => {
  for (const nodeEnv of ["production", "development"]) {
    const request = monthAction({ userId: "signed-in-account", nodeEnv });
    assert.equal(await request.action("2026-09"), "2026-09");
    assert.equal(request.writes.length, 1);
    const { name, value, options } = request.writes[0];
    assert.equal(name, MONTH_PREFERENCE_COOKIE);
    assert.deepEqual(JSON.parse(value), { userId: "signed-in-account", monthKey: "2026-09" });
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, "lax");
    assert.equal(options.path, "/");
    assert.equal(options.secure, nodeEnv === "production");
    assert.equal(options.maxAge, MONTH_PREFERENCE_MAX_AGE);
    assert.equal(resolvePreferredMonth(undefined, request.cookieValue(), "signed-in-account", now), "2026-09");
    assert.equal(resolvePreferredMonth(undefined, request.cookieValue(), "another-account", now), "2026-10");
  }
});

test("the action rejects unauthenticated, invalid and future selections before accessing mutable cookies", async () => {
  const signedOut = monthAction({ userId: null });
  await assert.rejects(signedOut.action("2026-09"), /Unauthorized/);
  assert.equal(signedOut.cookieRequests(), 0);
  assert.equal(signedOut.writes.length, 0);

  const request = monthAction();
  const previousValue = request.cookieValue();
  for (const month of [undefined, null, ["2026-09"], "2026-13", "2026-11", "2027-01"]) {
    await assert.rejects(request.action(month), /valid month/);
  }
  assert.equal(request.cookieRequests(), 0);
  assert.equal(request.writes.length, 0);
  assert.equal(request.cookieValue(), previousValue);
});

test("the current-month action clears past preferences using the server's India clock after rollover", async () => {
  for (const [instant, staleClientMonth, expectedMonth] of [
    ["2026-10-31T18:29:59Z", "2026-10", "2026-10"],
    ["2026-10-31T18:30:00Z", "2026-10", "2026-11"],
    ["2026-12-31T18:30:00Z", "2026-12", "2027-01"],
  ]) {
    const request = monthAction({ instant });
    assert.equal(await request.action(staleClientMonth, true), expectedMonth);
    assert.equal(request.writes.length, 1);
    assert.equal(request.writes[0].name, MONTH_PREFERENCE_COOKIE);
    assert.equal(request.writes[0].value, "");
    assert.equal(request.writes[0].options.maxAge, 0);
    assert.equal(request.cookieValue(), undefined);
    assert.equal(resolvePreferredMonth(undefined, request.cookieValue(), "first-account", instant), expectedMonth);
  }
});
