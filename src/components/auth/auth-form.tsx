"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

interface AuthFormProps {
  /** Called after a successful password sign-in (not signup confirmation). */
  onSuccess?: () => void;
  initialMode?: "signin" | "signup";
  className?: string;
}

export function AuthForm({ onSuccess, initialMode = "signin", className }: AuthFormProps) {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle, configured } = useAuth();
  const [mode, setMode] = React.useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const result =
      mode === "signin"
        ? await signInWithPassword(email.trim(), password)
        : await signUpWithPassword(email.trim(), password, displayName.trim() || undefined);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === "signup" && "needsEmailConfirmation" in result && result.needsEmailConfirmation) {
      setInfo("Account created. Check your inbox to confirm your email, then sign in.");
      return;
    }
    onSuccess?.();
  };

  return (
    <div className={className}>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="auth-name">Display name</Label>
            <Input
              id="auth-name"
              type="text"
              autoComplete="nickname"
              placeholder="What should we call you?"
              maxLength={60}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!configured || busy}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!configured || busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            id="auth-password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!configured || busy}
          />
          {mode === "signup" && (
            <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
          )}
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        {info && <p className="text-xs text-success">{info}</p>}

        {!configured && (
          <p className="text-xs text-warning">
            Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` — see README.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={!configured || busy}>
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="relative my-4 text-center text-[11px] text-muted-foreground">
        <span className="bg-card px-2 relative z-10">or</span>
        <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!configured || busy}
        onClick={async () => {
          setError(null);
          const result = await signInWithGoogle();
          if (result.error) setError(result.error);
        }}
      >
        Continue with Google
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
              }}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => {
                setMode("signin");
                setError(null);
                setInfo(null);
              }}
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
