"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  configured: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

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
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUpWithPassword = React.useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? { error: error.message } : {};
  }, []);

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
