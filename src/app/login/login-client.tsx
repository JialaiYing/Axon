"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Zap } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { Panel } from "@/components/ui/panel";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";

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
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Zap className="h-4.5 w-4.5 text-accent-foreground" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight">Axon</span>
        </Link>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign in to sync across devices — or keep studying offline without an account.
        </p>
      </div>

      <Panel variant="standard" className="w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Pick a display name for personalized greetings on your dashboard."
            : "Use your email or Google account to continue."}
        </p>
        <AuthForm
          initialMode={mode}
          onSuccess={() => {
            router.replace(next.startsWith("/") ? next : "/dashboard");
          }}
        />
      </Panel>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prefer local-only?{" "}
        <Link href="/dashboard" className="text-accent hover:underline">
          Open the dashboard without signing in
        </Link>
      </p>
    </div>
  );
}
