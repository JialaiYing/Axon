"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  configured: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error?: string }>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

async function applySessionFromApi(session: Session | null) {
  if (!session) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(configured);

  React.useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  const signInWithPassword = React.useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await res.json()) as { error?: string; session?: Session };
      if (!res.ok) return { error: payload.error || "Sign in failed." };
      await applySessionFromApi(payload.session ?? null);
      return {};
    } catch {
      return { error: "Network error. Try again." };
    }
  }, []);

  const signUpWithPassword = React.useCallback(
    async (email: string, password: string, displayName?: string) => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName }),
        });
        const payload = (await res.json()) as {
          error?: string;
          session?: Session;
          needsEmailConfirmation?: boolean;
        };
        if (!res.ok) return { error: payload.error || "Sign up failed." };
        await applySessionFromApi(payload.session ?? null);
        if (displayName) {
          try {
            // Must match the JSON contract used by useLocalStorage/readStorage —
            // a raw string here would fail JSON.parse on next read.
            window.localStorage.setItem("axon:profile:displayName", JSON.stringify(displayName));
          } catch {
            /* ignore */
          }
        }
        return { needsEmailConfirmation: Boolean(payload.needsEmailConfirmation) };
      } catch {
        return { error: "Network error. Try again." };
      }
    },
    []
  );

  const signInWithGoogle = React.useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = React.useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const updateDisplayName = React.useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 60) return { error: "Enter a name under 60 characters." };
    // Local persistence is handled by useDisplayName's useLocalStorage setter
    // (which JSON-encodes the value) before this runs — writing the raw
    // string here would clobber it with a non-JSON value and break the next
    // JSON.parse read. This only needs to sync the name to Supabase.
    const supabase = getSupabaseBrowserClient();
    if (supabase && user) {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email, display_name: trimmed });
      if (error) return { error: error.message };
      await supabase.auth.updateUser({ data: { display_name: trimmed } });
    }
    return {};
  }, [user]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      configured,
      user,
      session,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      updateDisplayName,
    }),
    [
      configured,
      user,
      session,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      updateDisplayName,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
