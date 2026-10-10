import { safeNextPath } from "../security/next-path.js";

const CALLBACK_PATH = "/auth/callback";
const unsafeUrlCharacters = /[\u0000-\u0020\u007f\\]/;
const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

function parseOrigin(value, allowLocalHttp) {
  if (typeof value !== "string" || unsafeUrlCharacters.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    if (url.protocol !== "https:" && !(allowLocalHttp && url.protocol === "http:" && loopbackHosts.has(url.hostname))) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Email links must use deployment-owned origins, never arbitrary proxy headers. */
export function getAuthOrigin({ headers, requestUrl, env = process.env } = {}) {
  const development = env.NODE_ENV !== "production";
  const configured = env.APP_ORIGIN || env.RENDER_EXTERNAL_URL;
  if (configured) {
    const origin = parseOrigin(configured, development);
    if (!origin) throw new Error("Invalid authentication origin configuration");
    return origin;
  }
  if (development) {
    // Browser Origin preserves the actual dev-server port (e.g. 3002).
    const requestOrigin = headers?.get("origin");
    const candidate = requestOrigin ?? (requestUrl ? new URL(requestUrl).origin : `http://${headers?.get("host") || ""}`);
    const origin = parseOrigin(candidate, true);
    if (origin && loopbackHosts.has(new URL(origin).hostname)) return origin;
  }
  throw new Error("Configure APP_ORIGIN or RENDER_EXTERNAL_URL for authentication");
}

export function signupEmailRedirect(options) {
  return new URL(CALLBACK_PATH, getAuthOrigin(options)).toString();
}

export function confirmationNotice(value) {
  const notices = {
    check_email: { type: "success", message: "Check your email to confirm your account. Open the confirmation link in the same browser where you signed up." },
    confirmation_missing: { type: "error", message: "This confirmation link is incomplete. Open the latest confirmation email, or sign in if you have already confirmed your email." },
    confirmation_expired: { type: "error", message: "This confirmation link has expired or was already used. Try signing in below. If your email is still unconfirmed, return to Create an account to request a new confirmation email." },
    confirmation_failed: { type: "error", message: "We could not finish signing you in from this link. If you opened it in another browser or already confirmed your email, sign in below with your email and password. Otherwise, open the latest confirmation email in the browser where you signed up." },
  };
  return typeof value === "string" && Object.hasOwn(notices, value) ? notices[value] : null;
}

const failurePath = (notice) => `/auth/login?notice=${notice}`;

/** Complete the exchange before checking the authenticated user's own profile. */
export async function confirmationDestination({ searchParams, supabase, isOnboardingComplete }) {
  if (searchParams.has("error") || searchParams.has("error_code")) {
    return failurePath(searchParams.get("error_code") === "otp_expired" ? "confirmation_expired" : "confirmation_failed");
  }
  const code = searchParams.get("code");
  if (!code || code.length > 2048 || unsafeUrlCharacters.test(code) || searchParams.getAll("code").length !== 1) {
    return failurePath("confirmation_missing");
  }
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return failurePath(error.code === "otp_expired" || error.code === "flow_state_expired" ? "confirmation_expired" : "confirmation_failed");
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data?.user?.id) return failurePath("confirmation_failed");
    const completed = await isOnboardingComplete(supabase, data.user.id);
    return completed ? safeNextPath(searchParams.get("next")) : "/onboarding";
  } catch {
    // Never put provider errors, codes, tokens or email addresses into the URL.
    return failurePath("confirmation_failed");
  }
}

/** Support confirmations issued before an explicit callback path was added. */
export function legacyConfirmationRedirect(requestUrl, options = {}) {
  const incoming = new URL(requestUrl);
  if (incoming.pathname !== "/" || !["code", "error", "error_code"].some((key) => incoming.searchParams.has(key))) return null;
  const target = new URL(CALLBACK_PATH, getAuthOrigin({ ...options, requestUrl }));
  for (const key of ["code", "error", "error_code"]) {
    for (const value of incoming.searchParams.getAll(key)) target.searchParams.append(key, value);
  }
  return target.toString();
}
