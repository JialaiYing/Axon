"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Cloud,
  Focus,
  Home,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getMissedScheduleNotificationPreference,
  setMissedScheduleNotificationPreference,
} from "@/lib/notifications/preferences";
import { cn } from "@/lib/utils";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-semibold text-foreground">{children}</h2>
  );
}

function SettingBlock({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border/50 p-4 light:border-border light:bg-card",
        className
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border/50 px-3 py-2.5 text-[13px] light:border-border">
      <span className="text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-accent"
      />
    </label>
  );
}

export default function SettingsPage() {
  const { resetAll, markAllSeen } = useOnboarding();
  const { preferences: focusPreferences, updatePreferences: updateFocusPreferences } =
    useFocusPreferences();
  const { displayName, setDisplayName } = useDisplayName();
  const { theme, setTheme } = useTheme();
  const { backgroundId, setBackgroundId, catalog, level } = useDashboardBackground();
  const { user, session, configured, signOut } = useAuth();
  const { status, syncNow } = useSync();
  const router = useRouter();

  const [permission, setPermission] = React.useState<BrowserNotificationPermission>("default");
  const [prefEnabled, setPrefEnabled] = React.useState(false);
  const [dueSoonEnabled, setDueSoonEnabled] = React.useState(false);
  const [missedScheduleEnabled, setMissedScheduleEnabled] = React.useState(true);
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
    setMissedScheduleEnabled(getMissedScheduleNotificationPreference());
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
        <div className="space-y-8">
          <section className="space-y-3">
            <SectionHeading>You</SectionHeading>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SettingBlock icon={UserRound} title="Profile">
                <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                  Your display name powers dashboard greetings ({`“Good morning, …”`}). Stored
                  locally and synced to your profile when signed in.
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
                      className="shadow-none"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="shadow-none"
                      onClick={async () => {
                        const result = await setDisplayName(nameDraft);
                        setNameMsg(result.error ?? "Saved.");
                      }}
                    >
                      Save
                    </Button>
                  </div>
                  {nameMsg && (
                    <p className="text-[12px] text-muted-foreground">{nameMsg}</p>
                  )}
                </div>
              </SettingBlock>

              <SettingBlock icon={Palette} title="Appearance">
                <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                  Switch between dark and light. Dashboard backgrounds also adapt their palette.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={theme === "dark" ? "default" : "outline"}
                    className="shadow-none"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    Dark
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={theme === "light" ? "default" : "outline"}
                    className="shadow-none"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    Light
                  </Button>
                </div>
              </SettingBlock>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading>Atmosphere</SectionHeading>
            <SettingBlock icon={Sparkles} title="Dashboard backgrounds">
              <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
                Default is a solid canvas. Unlock React Bits ambient backgrounds as you level up —
                each keeps its normal look in dark and light mode. You&apos;re level {level}.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                        "rounded-md border p-3 text-left transition-colors",
                        selected
                          ? "border-border/60 bg-foreground/[0.08] light:border-border light:bg-black/[0.06]"
                          : "border-border/50 hover:bg-foreground/[0.03] light:border-border light:hover:bg-black/[0.03]",
                        !unlocked && "cursor-not-allowed opacity-50 hover:bg-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-medium text-foreground">{bg.name}</p>
                        {unlocked ? (
                          selected ? (
                            <span className="text-[11px] font-medium text-foreground">Active</span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Unlocked</span>
                          )
                        ) : (
                          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                            Lvl {bg.unlockLevel}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">{bg.description}</p>
                    </button>
                  );
                })}
              </div>
            </SettingBlock>
          </section>

          <section className="space-y-3">
            <SectionHeading>Account &amp; study</SectionHeading>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SettingBlock icon={Shield} title="Data & privacy">
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  An Axon account is required to use the dashboard. Study data syncs to your account
                  via Supabase — Row Level Security ensures other users cannot read your rows. We do
                  not sell personal data. Review our{" "}
                  <Link
                    href="/privacy"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/terms"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Terms of Use
                  </Link>
                  .
                </p>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  A few things stay device-local by design and won&apos;t follow your account across
                  devices: calendar view mode, Pomodoro display mode, and which feature tips
                  you&apos;ve seen.
                </p>
                {configured && user && (
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    {`Signed in as ${user.email} · sync ${status}`}
                  </p>
                )}
                {user && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shadow-none"
                      onClick={() => void syncNow()}
                    >
                      <Cloud className="h-3.5 w-3.5" />
                      Sync now
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void signOut().then(() => router.replace("/login"))}
                    >
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
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    Sign out clears synced study data from this browser and returns you to login.
                    Delete account permanently removes your cloud account and data.
                  </p>
                )}
              </SettingBlock>

              <SettingBlock icon={Focus} title="Focus Mode">
                <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                  In-app Focus Mode when a Pomodoro starts. Leaving the tab pauses your session and
                  can send a desktop nudge — browsers still can&apos;t hard-block other sites.
                </p>
                <div className="flex flex-col gap-2">
                  <ToggleRow
                    label="Auto-enter on timer start"
                    checked={focusPreferences.autoEnterFocusMode}
                    onChange={(next) => updateFocusPreferences({ autoEnterFocusMode: next })}
                  />
                  <ToggleRow
                    label="Show stay-focused reminder"
                    checked={focusPreferences.showBlocklistReminder}
                    onChange={(next) => updateFocusPreferences({ showBlocklistReminder: next })}
                  />
                </div>
              </SettingBlock>

              <SettingBlock icon={Bell} title="Notifications">
                <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                  Lean by design: Pomodoro completion and missed-block alerts are on by default.
                  Optional due-soon reminders fire at most once per day.
                </p>
                <div className="mb-3 flex flex-col gap-2">
                  <ToggleRow
                    label="Missed objective / calendar event (when a block or due date passes unfinished)"
                    checked={missedScheduleEnabled}
                    onChange={(next) => {
                      setMissedScheduleNotificationPreference(next);
                      setMissedScheduleEnabled(next);
                    }}
                  />
                  <ToggleRow
                    label="Due-soon / overdue reminder (once daily)"
                    checked={dueSoonEnabled}
                    onChange={(next) => {
                      setDueSoonNotificationPreference(next);
                      setDueSoonEnabled(next);
                    }}
                  />
                </div>
                {!notificationsSupported ? (
                  <p className="text-[12px] text-muted-foreground">
                    This browser does not support the Notification API.
                  </p>
                ) : permission === "denied" ? (
                  <p className="text-[12px] text-warning">
                    Notifications are blocked in browser settings.
                  </p>
                ) : prefEnabled && permission === "granted" ? (
                  <div className="flex flex-wrap gap-2">
                    <p className="w-full text-[12px] text-success">Desktop alerts are on.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shadow-none"
                      onClick={disableNotifications}
                    >
                      Turn off
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="shadow-none"
                    onClick={() => void enableNotifications()}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Enable desktop alerts
                  </Button>
                )}
              </SettingBlock>

              <SettingBlock icon={Sparkles} title="Feature tips">
                <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                  Every page shows a short one-time tip the first time you visit it, right alongside
                  its content — no separate walkthrough to sit through. Replay brings every tip
                  back, so each one reappears as you naturally revisit that page.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shadow-none"
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
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    Tips reset — visit any page to see its tip again.
                  </p>
                )}
              </SettingBlock>

              <SettingBlock icon={Home} title="Homepage" className="lg:col-span-2">
                <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                  Leave the app and return to the Axon landing page.
                </p>
                <Button asChild variant="outline" size="sm" className="shadow-none">
                  <Link href="/">
                    <Home className="h-3.5 w-3.5" />
                    Back to homepage
                  </Link>
                </Button>
              </SettingBlock>
            </div>
          </section>
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
              className="shadow-none"
              disabled={deleteBusy}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="shadow-none"
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
