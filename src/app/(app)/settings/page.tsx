"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Cloud,
  Focus,
  Home,
  Lock,
  Moon,
  Palette,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useFocusPreferences } from "@/hooks/use-focus-preferences";
import { useDisplayName } from "@/hooks/use-display-name";
import { useDashboardBackground } from "@/hooks/use-dashboard-background";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { useSync } from "@/components/sync/sync-provider";
import { isBackgroundUnlocked } from "@/lib/backgrounds/catalog";
import { clearLocalSyncedData } from "@/lib/sync/local-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  areBrowserNotificationsSupported,
  getBrowserNotificationPermission,
  getBrowserNotificationPreference,
  requestBrowserNotificationPermission,
  setBrowserNotificationPreference,
  type BrowserNotificationPermission,
} from "@/lib/notifications/browser";
import {
  getDueSoonNotificationPreference,
  setDueSoonNotificationPreference,
} from "@/lib/notifications/preferences";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { resetAll, markAllSeen } = useOnboarding();
  const { preferences: focusPreferences, updatePreferences: updateFocusPreferences } =
    useFocusPreferences();
  const { displayName, setDisplayName } = useDisplayName();
  const { theme, setTheme } = useTheme();
  const { backgroundId, setBackgroundId, catalog, level } = useDashboardBackground();
  const { user, session, configured, signOut } = useAuth();
  const { status, syncNow } = useSync();

  const [permission, setPermission] = React.useState<BrowserNotificationPermission>("default");
  const [prefEnabled, setPrefEnabled] = React.useState(false);
  const [dueSoonEnabled, setDueSoonEnabled] = React.useState(false);
  const [tourReset, setTourReset] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [nameDraft, setNameDraft] = React.useState(displayName);
  const [nameMsg, setNameMsg] = React.useState<string | null>(null);
  // Starts false (matches the server, which has no `window`/`Notification`)
  // and flips in the effect below — calling areBrowserNotificationsSupported()
  // directly during render would read `true` on the client's very first
  // paint (unlike the other state here, which only updates post-mount),
  // causing a hydration mismatch against the server-rendered "unsupported" copy.
  const [notificationsSupported, setNotificationsSupported] = React.useState(false);

  React.useEffect(() => {
    setNotificationsSupported(areBrowserNotificationsSupported());
    setPermission(getBrowserNotificationPermission());
    setPrefEnabled(getBrowserNotificationPreference());
    setDueSoonEnabled(getDueSoonNotificationPreference());
  }, []);

  React.useEffect(() => {
    setNameDraft(displayName);
  }, [displayName]);

  const enableNotifications = async () => {
    const result = await requestBrowserNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      setBrowserNotificationPreference(true);
      setPrefEnabled(true);
    }
  };

  const disableNotifications = () => {
    setBrowserNotificationPreference(false);
    setPrefEnabled(false);
  };

  const deleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setDeleteError("Auth is not configured in this environment.");
        setDeleteBusy(false);
        return;
      }

      // Always refresh — a stale access_token is the most common delete failure.
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      const token =
        refreshed.session?.access_token ??
        (await supabase.auth.getSession()).data.session?.access_token ??
        session?.access_token;

      if (refreshError && !token) {
        setDeleteError("Session expired. Sign in again, then retry.");
        setDeleteBusy(false);
        return;
      }
      if (!token) {
        setDeleteError("Sign in again, then retry.");
        setDeleteBusy(false);
        return;
      }

      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      let payload: { error?: string } = {};
      try {
        payload = (await res.json()) as { error?: string };
      } catch {
        setDeleteError(
          res.status === 404
            ? "Delete API is missing on this deploy. Push latest code and redeploy."
            : `Delete failed (HTTP ${res.status}).`
        );
        setDeleteBusy(false);
        return;
      }

      if (!res.ok) {
        setDeleteError(payload.error || `Could not delete account (HTTP ${res.status}).`);
        setDeleteBusy(false);
        return;
      }

      clearLocalSyncedData();
      setDeleteOpen(false);
      try {
        await signOut();
      } catch {
        /* session may already be invalid after delete */
      }
      window.location.assign("/");
    } catch {
      setDeleteError("Network error. Try again.");
      setDeleteBusy(false);
    }
  };

  return (
    <>
    <AppPage
      title="Settings"
      description="Appearance, profile, privacy, and study preferences."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Your display name powers dashboard greetings ({`“Good morning, …”`}). Stored locally
            and synced to your profile when signed in.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={nameDraft}
                maxLength={60}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Your name"
              />
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const result = await setDisplayName(nameDraft);
                  setNameMsg(result.error ?? "Saved.");
                }}
              >
                Save
              </Button>
            </div>
            {nameMsg && <p className="text-xs text-muted-foreground">{nameMsg}</p>}
          </div>
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Switch between dark and light. Dashboard backgrounds also adapt their palette.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-3.5 w-3.5" />
              Dark
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              <Sun className="h-3.5 w-3.5" />
              Light
            </Button>
          </div>
        </Panel>

        <Panel variant="interactive" className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Dashboard backgrounds</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Default is a solid canvas. Unlock React Bits ambient backgrounds as you level up —
            each keeps its normal look in dark and light mode. You&apos;re level {level}.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((bg) => {
              const unlocked = isBackgroundUnlocked(bg.id, level);
              const selected = backgroundId === bg.id;
              return (
                <button
                  key={bg.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => setBackgroundId(bg.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    selected
                      ? "border-accent bg-accent-muted/30"
                      : "border-border bg-surface/40 hover:border-border-strong",
                    !unlocked && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{bg.name}</p>
                    {unlocked ? (
                      selected ? (
                        <Badge variant="accent">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Unlocked</Badge>
                      )
                    ) : (
                      <Badge variant="default">Lvl {bg.unlockLevel}</Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{bg.description}</p>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Data &amp; privacy</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Axon is local-first: study data lives in this browser by default. When you sign in,
            encrypted sessions with Supabase sync your data to your account only — Row Level
            Security ensures other users cannot read your rows. We do not sell personal data.
            Review our{" "}
            <Link href="/privacy" className="text-accent underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-accent underline">
              Terms of Use
            </Link>
            .
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            A few things stay device-local by design and won&apos;t follow your account across
            devices: calendar view mode, Pomodoro display mode, and which feature tips you&apos;ve
            seen.
          </p>
          {configured && (
            <p className="mt-2 text-xs text-muted-foreground">
              {user
                ? `Signed in as ${user.email} · sync ${status}`
                : "Supabase is configured — sign in from the avatar menu or /login to enable sync."}
            </p>
          )}
          {user && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void syncNow()}>
                <Cloud className="h-3.5 w-3.5" />
                Sync now
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
                Sign out
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:text-danger"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete account
              </Button>
            </div>
          )}
          {user && (
            <p className="mt-2 text-xs text-muted-foreground">
              Sign out clears synced study data from this browser. Delete account permanently
              removes your cloud account and data.
            </p>
          )}
          {!user && (
            <Button asChild size="sm" className="mt-3">
              <Link href="/login">
                <Lock className="h-3.5 w-3.5" />
                Sign in
              </Link>
            </Button>
          )}
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Focus className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Focus Mode</h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Full-screen lockdown when a Pomodoro starts. Browsers cannot hard-block other sites.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2.5 text-sm">
              <span className="text-foreground">Auto-enter on timer start</span>
              <input
                type="checkbox"
                checked={focusPreferences.autoEnterFocusMode}
                onChange={(e) =>
                  updateFocusPreferences({ autoEnterFocusMode: e.target.checked })
                }
                className="h-4 w-4 accent-accent"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2.5 text-sm">
              <span className="text-foreground">Show stay-focused reminder</span>
              <input
                type="checkbox"
                checked={focusPreferences.showBlocklistReminder}
                onChange={(e) =>
                  updateFocusPreferences({ showBlocklistReminder: e.target.checked })
                }
                className="h-4 w-4 accent-accent"
              />
            </label>
          </div>
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Lean by design: Pomodoro completion alerts are default. Optional due-soon reminders
            fire at most once per day.
          </p>
          <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2.5 text-sm">
            <span className="text-foreground">Due-soon / overdue reminder (once daily)</span>
            <input
              type="checkbox"
              checked={dueSoonEnabled}
              onChange={(e) => {
                const next = e.target.checked;
                setDueSoonNotificationPreference(next);
                setDueSoonEnabled(next);
              }}
              className="h-4 w-4 accent-accent"
            />
          </label>
          {!notificationsSupported ? (
            <p className="text-xs text-muted-foreground">
              This browser does not support the Notification API.
            </p>
          ) : permission === "denied" ? (
            <p className="text-xs text-warning">
              Notifications are blocked in browser settings.
            </p>
          ) : prefEnabled && permission === "granted" ? (
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-xs text-success">Desktop alerts are on.</p>
              <Button type="button" variant="outline" size="sm" onClick={disableNotifications}>
                Turn off
              </Button>
            </div>
          ) : (
            <Button type="button" size="sm" onClick={() => void enableNotifications()}>
              <Bell className="h-3.5 w-3.5" />
              Enable desktop alerts
            </Button>
          )}
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Feature tips</h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Every page shows a short one-time tip the first time you visit it, right alongside
            its content — no separate walkthrough to sit through. Replay brings every tip back,
            so each one reappears as you naturally revisit that page.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetAll();
                setTourReset(true);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Replay tips
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => markAllSeen()}>
              Dismiss all
            </Button>
          </div>
          {tourReset && (
            <p className="mt-2 text-xs text-muted-foreground">
              Tips reset — visit any page to see its tip again.
            </p>
          )}
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Home className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Homepage</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Leave the app and return to the Axon landing page.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <Home className="h-3.5 w-3.5" />
              Back to homepage
            </Link>
          </Button>
        </Panel>
      </div>
    </AppPage>

    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently deletes your Axon account, cloud-synced study rows, and flashcard
            images stored for your account. This browser&apos;s local copy is cleared too. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={deleteBusy}
            onClick={() => setDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteBusy}
            onClick={() => void deleteAccount()}
          >
            {deleteBusy ? "Deleting…" : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
