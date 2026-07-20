"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { SyncProvider } from "@/components/sync/sync-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SyncProvider>{children}</SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
