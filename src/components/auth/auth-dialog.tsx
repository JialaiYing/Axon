"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle, configured } = useAuth();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setInfo(null);
      setPassword("");
      setBusy(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const result =
      mode === "signin"
        ? await signInWithPassword(email.trim(), password)
        : await signUpWithPassword(email.trim(), password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === "signup") {
      setInfo("Account created. If email confirmation is enabled, check your inbox.");
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "signin" ? "Sign in to Axon" : "Create your account"}</DialogTitle>
          <DialogDescription>
            {configured
              ? "Sign in to sync your study data across devices. The app still works offline without an account."
              : "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local — see docs/supabase-setup.md."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!configured || busy}
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
          {info && <p className="text-xs text-success">{info}</p>}

          <Button type="submit" className="w-full" disabled={!configured || busy}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="relative py-1 text-center text-[11px] text-muted-foreground">
          <span className="bg-card px-2">or</span>
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

        <p className="text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                type="button"
                className="text-accent hover:underline"
                onClick={() => setMode("signup")}
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
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
