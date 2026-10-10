const LOCAL_BASE = "https://finpilot.invalid";
const FALLBACK = "/dashboard";
const unsafeCharacters = /[\u0000-\u001f\u007f\\]/;

/** Only permit local post-login destinations, including their query and hash. */
export function safeNextPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || unsafeCharacters.test(value)) return FALLBACK;
  try {
    const target = new URL(value, LOCAL_BASE);
    if (target.origin !== LOCAL_BASE) return FALLBACK;
    let pathname = target.pathname;
    // Check encoded path separators/control characters as well as literal ones.
    // A bounded decode avoids accepting deeply wrapped ambiguous destinations.
    for (let depth = 0; depth < 5; depth++) {
      if (!pathname.startsWith("/") || pathname.startsWith("//") || unsafeCharacters.test(pathname)) return FALLBACK;
      const normalized = new URL(pathname, LOCAL_BASE);
      if (normalized.origin !== LOCAL_BASE || normalized.pathname.startsWith("//") || normalized.pathname === "/auth" || normalized.pathname.startsWith("/auth/")) return FALLBACK;
      const decoded = decodeURIComponent(pathname);
      if (decoded === pathname) return value;
      pathname = decoded;
    }
  } catch {
    // Invalid encodings and malformed URLs are not navigation destinations.
  }
  return FALLBACK;
}
