"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Renders children only after mount — avoids SSR/client hydration mismatches. */
export default function ClientOnly({ children, fallback = null }) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  if (!mounted) return fallback;
  return children;
}
