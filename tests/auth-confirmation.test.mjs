import test from "node:test";
import assert from "node:assert/strict";
import { confirmationDestination, confirmationNotice, getAuthOrigin, legacyConfirmationRedirect, signupEmailRedirect } from "../src/lib/auth/confirmation.js";

const production = { NODE_ENV: "production", RENDER_EXTERNAL_URL: "https://finpilot-preview.onrender.com" };
const headers = (values = {}) => new Headers(values);

test("signup emails use the trusted public Render callback behind its internal proxy", () => {
  assert.equal(signupEmailRedirect({ env: production, headers: headers({ origin: "https://attacker.example", host: "0.0.0.0:10000", "x-forwarded-host": "attacker.example" }) }), "https://finpilot-preview.onrender.com/auth/callback");
  assert.equal(getAuthOrigin({ env: { ...production, APP_ORIGIN: "https://money.example/" }, requestUrl: "http://localhost:10000/auth/callback" }), "https://money.example");
});

test("production never derives email or callback destinations from request headers", () => {
  for (const values of [{ origin: "https://attacker.example" }, { host: "localhost:3002" }, { "x-forwarded-host": "money.example", "x-forwarded-proto": "https" }]) {
    assert.throws(() => signupEmailRedirect({ env: { NODE_ENV: "production" }, headers: headers(values), requestUrl: "https://money.example/auth/signup" }));
  }
});

test("invalid explicit deployment origins fail closed, including credentials and non-HTTPS URLs", () => {
  for (const APP_ORIGIN of [" ", "not a URL", "https://money.example/path", "https://money.example/?x=1", "https://money.example/#x", "https://user:pass@money.example", "http://money.example", "http://localhost:3002", "https:\\money.example", "https://money.example\n", "javascript:alert(1)"]) {
    assert.throws(() => getAuthOrigin({ env: { ...production, APP_ORIGIN } }), APP_ORIGIN);
  }
});

test("development confirmation links preserve the real loopback port and ignore forwarded host", () => {
  assert.equal(signupEmailRedirect({ env: { NODE_ENV: "development" }, headers: headers({ origin: "http://localhost:3002", "x-forwarded-host": "attacker.example" }) }), "http://localhost:3002/auth/callback");
  assert.equal(signupEmailRedirect({ env: {}, headers: headers({ host: "127.0.0.1:3005" }) }), "http://127.0.0.1:3005/auth/callback");
  assert.equal(getAuthOrigin({ env: {}, requestUrl: "http://[::1]:3002/auth/callback?code=test" }), "http://[::1]:3002");
  for (const value of ["https://attacker.example", "http://localhost.attacker.example:3002", "http://localhost:3002.attacker.example", "null"]) {
    assert.throws(() => signupEmailRedirect({ env: {}, headers: headers({ origin: value, host: "localhost:3002" }) }), value);
  }
});

function confirmation({ code = "one-time-code", query, exchangeError = null, userError = null, user = { id: "verified-user" }, complete = false, throws = false } = {}) {
  const calls = [];
  const supabase = { auth: {
    async exchangeCodeForSession(value) { calls.push(["exchange", value]); if (throws) throw new Error("secret-provider-response"); return { error: exchangeError }; },
    async getUser() { calls.push(["verify"]); return { data: { user }, error: userError }; },
  } };
  return {
    calls,
    run: () => confirmationDestination({
      searchParams: query === undefined ? new URLSearchParams({ code }) : new URLSearchParams(query),
      supabase,
      isOnboardingComplete: async (client, userId) => { assert.equal(client, supabase); calls.push(["profile", userId]); return complete; },
    }),
  };
}

test("successful confirmation verifies the exchanged user before choosing onboarding", async () => {
  const flow = confirmation();
  assert.equal(await flow.run(), "/onboarding");
  assert.deepEqual(flow.calls, [["exchange", "one-time-code"], ["verify"], ["profile", "verified-user"]]);
});

test("completed users land on dashboard or a safe internal destination without carrying the code", async () => {
  assert.equal(await confirmation({ complete: true }).run(), "/dashboard");
  assert.equal(await confirmation({ complete: true, query: "code=test&next=%2Freports%3Fyear%3D2026" }).run(), "/reports?year=2026");
  for (const next of ["https://attacker.example", "//attacker.example", "/auth/callback?code=stolen", "/%2f%2fattacker.example"]) {
    const query = new URLSearchParams({ code: "test", next });
    assert.equal(await confirmation({ complete: true, query }).run(), "/dashboard", next);
  }
});

test("missing, duplicate and malformed confirmation codes never reach the provider", async () => {
  for (const query of ["", "code=", "code=first&code=second", "code=with%0Anewline", `code=${"x".repeat(2049)}`]) {
    const flow = confirmation({ query });
    assert.equal(await flow.run(), "/auth/login?notice=confirmation_missing");
    assert.deepEqual(flow.calls, []);
  }
});

test("expired or rejected email links show a fixed notice without reflecting provider text", async () => {
  for (const [query, notice] of [["error=access_denied&error_code=otp_expired&error_description=secret", "confirmation_expired"], ["code=test&error=secret-provider-response", "confirmation_failed"]]) {
    const flow = confirmation({ query });
    assert.equal(await flow.run(), `/auth/login?notice=${notice}`);
    assert.deepEqual(flow.calls, []);
  }
  for (const errorCode of ["flow_state_expired", "bad_code_verifier", "flow_state_not_found"]) {
    const flow = confirmation({ exchangeError: { code: errorCode, message: "secret-provider-response" } });
    assert.equal(await flow.run(), `/auth/login?notice=${errorCode === "flow_state_expired" ? "confirmation_expired" : "confirmation_failed"}`);
    assert.deepEqual(flow.calls, [["exchange", "one-time-code"]]);
  }
  assert.match(confirmationNotice("confirmation_failed").message, /another browser/);
});

test("failed user verification and network errors do not read profiles or expose secrets", async () => {
  for (const options of [{ user: null }, { userError: { message: "secret-provider-response" } }, { throws: true }]) {
    const flow = confirmation(options);
    assert.equal(await flow.run(), "/auth/login?notice=confirmation_failed");
    assert.equal(flow.calls.some(([call]) => call === "profile"), false);
  }
  assert.equal(confirmationNotice("https://attacker.example"), null);
  assert.equal(confirmationNotice("toString"), null);
});

test("old root email callbacks retain only auth parameters and move to the trusted callback", () => {
  const redirect = legacyConfirmationRedirect("http://0.0.0.0:10000/?code=test&next=https://attacker.example&access_token=secret", { env: production });
  assert.equal(redirect, "https://finpilot-preview.onrender.com/auth/callback?code=test");
  assert.equal(legacyConfirmationRedirect("http://localhost:3002/?error=access_denied&error_code=otp_expired&error_description=secret", { env: {} }), "http://localhost:3002/auth/callback?error=access_denied&error_code=otp_expired");
  assert.equal(legacyConfirmationRedirect("https://money.example/?campaign=welcome", { env: production }), null);
  assert.equal(legacyConfirmationRedirect("https://money.example/reports?code=test", { env: production }), null);
});
