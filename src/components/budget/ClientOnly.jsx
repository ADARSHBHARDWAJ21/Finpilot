"use client";

import { useEffect, useState } from "react";

/** Renders children only after mount — avoids SSR/client hydration mismatches. */
export default function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  return children;
}
