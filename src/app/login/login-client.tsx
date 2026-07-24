"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { AxonLogo } from "@/components/brand/axon-logo";
import { safeInternalPath } from "@/lib/security/urls";

/**
 * Auth entry (sign-in / sign-up). Always dark — route is in ALWAYS_DARK_ROUTES
 * and this root also sets data-theme="dark" so dashboard light prefs never leak.
 */
export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeInternalPath(searchParams.get("next"), "/dashboard");
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = React.useState<"signin" | "signup">(initialMode);
  const { user, loading } = useAuth();

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  React.useEffect(() => {
    if (loading) return;
    if (user) router.replace(next);
  }, [user, loading, next, router]);

  return (
    <div
      data-theme="dark"
      className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-foreground"
    >
      <Link
        href="/"
        aria-label="Close and return home"
        title="Close"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-wash hover:text-foreground sm:right-6 sm:top-6"
      >
        <X className="h-4 w-4" />
      </Link>

      <div className="w-full max-w-[360px]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Link href="/" className="transition-opacity hover:opacity-80" aria-label="Axon home">
            <AxonLogo
              withWordmark
              priority
              iconClassName="h-8 w-8"
              wordmarkClassName="text-[15px] font-medium tracking-tight text-foreground"
            />
          </Link>
          {mode === "signin" ? (
            <>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
                Sign in to open your dashboard and sync across devices.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
                Free to start — your workspace syncs on any device.
              </p>
            </>
          )}
        </div>

        <AuthForm
          initialMode={mode}
          onModeChange={setMode}
          onSuccess={() => {
            router.replace(next);
          }}
        />
      </div>
    </div>
  );
}
