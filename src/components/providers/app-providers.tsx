"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { SyncProvider } from "@/components/sync/sync-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SyncProvider>{children}</SyncProvider>
    </AuthProvider>
  );
}
