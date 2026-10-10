function configuredOrigin(value) {
  if (typeof value !== "string" || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Compare browser origins to a deployment-owned URL, never forwarded host input. */
export function isAllowedUploadOrigin(request, env = process.env) {
  const configured = env.APP_ORIGIN || env.RENDER_EXTERNAL_URL;
  let expected;
  if (configured) {
    // An invalid explicit APP_ORIGIN must not fall back to another host.
    expected = configuredOrigin(configured);
  } else {
    try {
      expected = configuredOrigin(new URL(request.url).origin);
    } catch {
      return false;
    }
  }
  if (!expected) return false;
  const origin = request.headers.get("origin");
  // CLI/API clients may omit Origin; the route still requires a valid user.
  if (origin === null) return true;
  if (!origin || origin === "null") return false;
  return configuredOrigin(origin) === expected;
}
