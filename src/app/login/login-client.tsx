"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { AxonLogo } from "@/components/brand/axon-logo";
import { Panel } from "@/components/ui/panel";
import { safeInternalPath } from "@/lib/security/urls";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link
        href="/"
        aria-label="Close and return home"
        title="Close"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground sm:right-6 sm:top-6"
      >
        <X className="h-4.5 w-4.5" />
      </Link>

      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Link href="/" className="transition-opacity hover:opacity-80" aria-label="Axon home">
          <AxonLogo
            withWordmark
            priority
            iconClassName="h-9 w-9"
            wordmarkClassName="text-lg text-foreground"
          />
        </Link>
        {mode === "signin" ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Sign in to open your dashboard and sync your study workspace across devices.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Create your Axon account
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              A free account is required to use Axon — then your workspace syncs on any device.
            </p>
          </>
        )}
      </div>

      <Panel variant="standard" className="w-full max-w-md p-6 sm:p-8">
        <AuthForm
          initialMode={mode}
          onModeChange={setMode}
          onSuccess={() => {
            router.replace(next);
          }}
        />
      </Panel>
    </div>
  );
}
