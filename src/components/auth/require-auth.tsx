"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

/**
 * Blocks the app shell until a signed-in session exists.
 * Unauthenticated (or unconfigured) visitors are sent to /login with a return path.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;

    if (!configured || !user) {
      setAllowed(false);
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
      return;
    }

    setAllowed(true);
  }, [configured, user, loading, pathname, router]);

  if (loading || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking account…
      </div>
    );
  }

  return <>{children}</>;
}
