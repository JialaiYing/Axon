"use client";

import * as React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { subscribeLocalStorageWrites } from "@/hooks/use-local-storage";
import { SYNC_KEY_SET } from "@/lib/sync/collections";
import { pullAll, pushAll, syncAll, type SyncStatus } from "@/lib/sync/engine";
import {
  clearLocalSyncedData,
  hasLocalSyncedData,
  readLastUserId,
  writeLastUserId,
} from "@/lib/sync/local-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [mergePromptOpen, setMergePromptOpen] = React.useState(false);
  const dirtyRef = React.useRef(false);
  const syncingRef = React.useRef(false);
  const pushTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingMergeRef = React.useRef(false);

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

  const resolveMerge = React.useCallback(
    (choice: "keep" | "cloud") => {
      if (!user) return;
      awaitingMergeRef.current = false;
      setMergePromptOpen(false);
      if (choice === "cloud") {
        clearLocalSyncedData();
      }
      writeLastUserId(user.id);
      void run(choice === "cloud" ? "pull" : "full");
    },
    [user, run]
  );

  // Initial + auth-change sync
  React.useEffect(() => {
    if (!user) {
      setStatus("idle");
      setMergePromptOpen(false);
      awaitingMergeRef.current = false;
      return;
    }

    const lastUserId = readLastUserId();
    const switchedAccounts = Boolean(lastUserId && lastUserId !== user.id);

    if (switchedAccounts) {
      clearLocalSyncedData();
      writeLastUserId(user.id);
      void run("pull");
      return;
    }

    // Guest data on this device, first sign-in: ask before pushing into cloud.
    if (!lastUserId && hasLocalSyncedData()) {
      awaitingMergeRef.current = true;
      setMergePromptOpen(true);
      return;
    }

    writeLastUserId(user.id);
    void run(lastUserId ? "full" : "pull");
  }, [user, run]);

  // Debounced push on local writes to synced keys
  React.useEffect(() => {
    if (!user) return;
    return subscribeLocalStorageWrites((key) => {
      if (!SYNC_KEY_SET.has(key)) return;
      if (awaitingMergeRef.current) return;
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
      if (awaitingMergeRef.current) return;
      setStatus("syncing");
      void run("full");
    };
    const onOffline = () => setStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const interval = setInterval(() => {
      if (awaitingMergeRef.current) return;
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

  return (
    <SyncContext.Provider value={value}>
      {children}
      <Dialog
        open={mergePromptOpen}
        onOpenChange={(open) => {
          // Force an explicit choice — closing without choosing risks a silent push.
          if (!open && awaitingMergeRef.current) return;
          setMergePromptOpen(open);
        }}
      >
        <DialogContent
          className="max-w-md"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Study data on this device</DialogTitle>
            <DialogDescription>
              This browser already has objectives, sessions, or progress from before you signed
              in. Choose what to do before syncing with your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" className="w-full" onClick={() => resolveMerge("keep")}>
              Keep device data and sync it
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => resolveMerge("cloud")}
            >
              Discard device data — use cloud only
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = React.useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
