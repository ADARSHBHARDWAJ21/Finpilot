import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedUploadOrigin } from "../src/lib/security/request-origin.js";
import { safeNextPath } from "../src/lib/security/next-path.js";

const request = (origin, url = "http://0.0.0.0:10000/api/process-statement", extra = {}) => ({
  url,
  headers: new Headers({ ...extra, ...(origin === undefined ? {} : { origin }) }),
});

test("Render proxy uploads use the public HTTPS URL, not the internal bind address", () => {
  const env = { RENDER_EXTERNAL_URL: "https://finpilot.onrender.com" };
  assert.equal(isAllowedUploadOrigin(request("https://finpilot.onrender.com"), env), true);
  assert.equal(isAllowedUploadOrigin(request("http://0.0.0.0:10000"), env), false);
  assert.equal(isAllowedUploadOrigin(request("https://another.onrender.com"), env), false);
});

test("custom APP_ORIGIN takes precedence and handles a canonical origin with trailing slash", () => {
  const env = { APP_ORIGIN: "https://money.example/", RENDER_EXTERNAL_URL: "https://finpilot.onrender.com" };
  assert.equal(isAllowedUploadOrigin(request("https://money.example"), env), true);
  assert.equal(isAllowedUploadOrigin(request("https://finpilot.onrender.com"), env), false);
});

test("forwarded-host headers cannot authorize a foreign origin", () => {
  const headers = { "x-forwarded-host": "evil.example", "x-forwarded-proto": "https", host: "evil.example" };
  assert.equal(isAllowedUploadOrigin(request("https://evil.example", undefined, headers), { APP_ORIGIN: "https://money.example" }), false);
  assert.equal(isAllowedUploadOrigin(request("https://evil.example", "http://localhost:3002/api/process-statement", headers), {}), false);
});

test("malformed deployment origins fail closed without falling back to Render or request URL", () => {
  for (const APP_ORIGIN of ["not a URL", " ", "https://money.example/path", "https://money.example?x=1", "https://money.example#x", "https://user:password@money.example", "javascript:alert(1)", "https:\\money.example", "https://money.example\n"]) {
    const env = { APP_ORIGIN, RENDER_EXTERNAL_URL: "https://finpilot.onrender.com" };
    assert.equal(isAllowedUploadOrigin(request("https://finpilot.onrender.com"), env), false, APP_ORIGIN);
    assert.equal(isAllowedUploadOrigin(request(undefined), env), false, APP_ORIGIN);
  }
  assert.equal(isAllowedUploadOrigin(request("http://localhost:3002", "http://localhost:3002/api/process-statement"), { RENDER_EXTERNAL_URL: "invalid" }), false);
});

test("local development remains same-origin and rejects explicit null or foreign origins", () => {
  const url = "http://localhost:3002/api/process-statement";
  assert.equal(isAllowedUploadOrigin(request("http://localhost:3002", url), {}), true);
  for (const origin of ["null", "", "https://evil.example", "http://localhost:3003", "https://localhost:3002", "https://money.example, https://evil.example"]) {
    assert.equal(isAllowedUploadOrigin(request(origin, url), {}), false, origin);
  }
});

test("requests without Origin retain access to the route's separate authentication step", () => {
  assert.equal(isAllowedUploadOrigin(request(undefined), { APP_ORIGIN: "https://money.example" }), true);
  assert.equal(isAllowedUploadOrigin(request(undefined, "http://localhost:3002/api/process-statement"), {}), true);
});

test("safe login redirects preserve local paths, query values and fragments", () => {
  for (const path of ["/", "/dashboard", "/transactions?category=Food%20%26%20Dining", "/taxation/ai-copilot?question=What%20is%20my%20tax%3F&year=2025-26", "/reports?next=https%3A%2F%2Fexample.com#documents", "/calendar?month=2026-10", "/goals/house"]) {
    assert.equal(safeNextPath(path), path);
  }
});

test("external, protocol-relative, backslash and control-character redirects are rejected", () => {
  for (const path of [undefined, null, 1, {}, "", "dashboard", " https://evil.example", "https://evil.example", "//evil.example", "///evil.example", "/\\evil.example", "\\\\evil.example", "/a\\..\\evil.example", "/\tevil.example", "/\nevil.example", "/\revil.example", "/\u0000evil.example", "/\u007fevil.example"]) {
    assert.equal(safeNextPath(path), "/dashboard", String(path));
  }
});

test("encoded redirect separators, controls and auth-loop destinations are rejected", () => {
  for (const path of ["/%2f%2fevil.example", "/%252f%252fevil.example", "/%5cevil.example", "/%255cevil.example", "/%0a/evil.example", "/%250d/evil.example", "/%00evil.example", "/%7fevil.example", "/auth", "/auth/login?next=/dashboard", "/%61uth/login", "/a/../auth/signup", "/a/%252e%252e/auth/login", "/foo/..//evil.example", "/broken%encoding"]) {
    assert.equal(safeNextPath(path), "/dashboard", path);
  }
});
