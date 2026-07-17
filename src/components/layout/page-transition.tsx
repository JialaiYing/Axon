"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Keep the key so route-local state resets on navigation, but avoid
  // animation-gated visibility. A failed/aborted animation should never leave
  // an otherwise healthy section blank.
  return <div key={pathname}>{children}</div>;
}
