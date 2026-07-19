"use client";

import * as React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { subscribeLocalStorageWrites, writeLocalStorage } from "@/hooks/use-local-storage";
import { SYNC_COLLECTIONS, SYNC_KEY_SET } from "@/lib/sync/collections";
import { pullAll, pushAll, syncAll, type SyncStatus } from "@/lib/sync/engine";

/** Remembers which account last synced on this device, to detect account switches. */
const LAST_USER_KEY = "axon:sync:lastUserId";

function readLastUserId(): string | null {
  try {
    return window.localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

function writeLastUserId(id: string) {
  try {
    window.localStorage.setItem(LAST_USER_KEY, id);
  } catch {
    // ignore
  }
}

/**
 * Resets every synced collection to its empty fallback. Used when a
 * *different* account signs in on this browser, so the previous account's
 * local data is never pushed into the new account's cloud. (Push skips empty
 * collections, so the follow-up full sync becomes pull-only and repopulates
 * local storage with the new account's own data.)
 */
function clearSyncedCollections() {
  for (const collection of SYNC_COLLECTIONS) {
    writeLocalStorage(collection.key, () => collection.fallback, collection.fallback);
  }
}

interface SyncContextValue {
  status: SyncStatus;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
}

const SyncContext = React.createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, configured } = useAuth();
  const [status, setStatus] = React.useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);
  const dirtyRef = React.useRef(false);
  const syncingRef = React.useRef(false);
  const pushTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = React.useCallback(
    async (mode: "full" | "push" | "pull") => {
      if (!configured || !user) {
        setStatus("idle");
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setStatus("offline");
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setStatus("idle");
        return;
      }
      if (syncingRef.current) {
        dirtyRef.current = true;
        return;
      }

      syncingRef.current = true;
      setStatus("syncing");
      try {
        if (mode === "full") await syncAll(supabase, user.id);
        else if (mode === "push") await pushAll(supabase, user.id);
        else await pullAll(supabase, user.id);
        setLastSyncedAt(new Date().toISOString());
        setStatus("synced");
      } catch (error) {
        // Supabase errors are plain objects that log as "{}" — surface the fields.
        const detail =
          error && typeof error === "object"
            ? JSON.stringify(error, ["message", "details", "hint", "code", "status"])
            : String(error);
        console.error(`Axon sync failed: ${detail}`, error);
        setStatus("error");
      } finally {
        syncingRef.current = false;
        if (dirtyRef.current) {
          dirtyRef.current = false;
          void run("push");
        }
      }
    },
    [configured, user]
  );

  const syncNow = React.useCallback(async () => {
    await run("full");
  }, [run]);

  // Initial + auth-change full sync
  React.useEffect(() => {
    if (!user) {
      setStatus("idle");
      return;
    }
    // Account switch on this browser: wipe the previous account's local data
    // before syncing, otherwise it would be pushed into the new account.
    // The first sync after a switch must be pull-only — pushing the freshly
    // cleared singletons (e.g. XP) would overwrite the new account's cloud data.
    const lastUserId = readLastUserId();
    const switchedAccounts = Boolean(lastUserId && lastUserId !== user.id);
    if (switchedAccounts) {
      clearSyncedCollections();
    }
    writeLastUserId(user.id);
    void run(switchedAccounts ? "pull" : "full");
  }, [user, run]);

  // Debounced push on local writes to synced keys
  React.useEffect(() => {
    if (!user) return;
    return subscribeLocalStorageWrites((key) => {
      if (!SYNC_KEY_SET.has(key)) return;
      dirtyRef.current = true;
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(() => {
        dirtyRef.current = false;
        void run("push");
      }, 1200);
    });
  }, [user, run]);

  // Periodic pull + online/offline status
  React.useEffect(() => {
    if (!user) return;

    const onOnline = () => {
      setStatus("syncing");
      void run("full");
    };
    const onOffline = () => setStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void run("pull");
    }, 60_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [user, run]);

  const value = React.useMemo(
    () => ({ status, lastSyncedAt, syncNow }),
    [status, lastSyncedAt, syncNow]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = React.useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
