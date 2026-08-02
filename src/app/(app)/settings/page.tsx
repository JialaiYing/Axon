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
import { useUserStats } from "@/hooks/use-user-stats";
import { useDevUnlockAll } from "@/hooks/use-dev-unlock-all";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { useSync } from "@/components/sync/sync-provider";
import { isPaletteUnlocked, PALETTES } from "@/lib/palettes/catalog";
import {
  isDevUnlockAllForcedByEnv,
  setDevUnlockAll,
} from "@/lib/dev/unlocks";
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
    <h2 className="text-xl font-semibold tracking-tight text-foreground">{children}</h2>
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
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border border-border/50 px-3 py-2.5 text-[13px] light:border-border",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
    >
      <span className="text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
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
  const { theme, setTheme, paletteId, setPaletteId } = useTheme();
  const { stats } = useUserStats();
  const level = stats.level || 1;
  const unlockAll = useDevUnlockAll();
  const unlockAllForced = isDevUnlockAllForcedByEnv();
  const showDevUnlock = process.env.NODE_ENV === "development" || unlockAllForced;
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
      >
        <div className="space-y-12">
          <section className="space-y-4">
            <SectionHeading>You</SectionHeading>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SettingBlock icon={UserRound} title="Profile">
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
                <div id="appearance" className="scroll-mt-24 space-y-4">
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

                  <div className={cn(theme === "light" && "opacity-60")}>
                    <p className="mb-2 text-[13px] text-muted-foreground">
                      Dark palette · Level {level}
                      {theme === "light" ? " · switch to Dark to preview" : ""}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {PALETTES.map((palette) => {
                        const unlocked = isPaletteUnlocked(palette.id, level);
                        const selected = paletteId === palette.id;
                        return (
                          <button
                            key={palette.id}
                            type="button"
                            disabled={!unlocked || theme === "light"}
                            onClick={() => setPaletteId(palette.id)}
                            className={cn(
                              "rounded-md border p-3 text-left transition-colors",
                              selected
                                ? "border-border/60 bg-wash-strong light:border-border"
                                : "border-border/50 hover:bg-wash light:border-border",
                              (!unlocked || theme === "light") &&
                                "cursor-not-allowed opacity-50 hover:bg-transparent"
                            )}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span
                                className="flex h-7 w-10 shrink-0 overflow-hidden rounded-sm border border-border/50"
                                aria-hidden
                              >
                                <span
                                  className="h-full w-2/3"
                                  style={{ backgroundColor: palette.preview.background }}
                                />
                                <span
                                  className="h-full w-1/3"
                                  style={{ backgroundColor: palette.preview.accent }}
                                />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-[13px] font-medium text-foreground">
                                    {palette.name}
                                  </p>
                                  {unlocked ? (
                                    selected ? (
                                      <span className="shrink-0 text-[11px] font-medium text-foreground">
                                        Active
                                      </span>
                                    ) : (
                                      <span className="shrink-0 text-[11px] text-muted-foreground">
                                        Unlocked
                                      </span>
                                    )
                                  ) : (
                                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                                      Lvl {palette.unlockLevel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-[12px] text-muted-foreground">{palette.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {showDevUnlock && (
                    <ToggleRow
                      label={
                        unlockAllForced
                          ? "Unlock all cosmetics (forced by NEXT_PUBLIC_DEV_UNLOCK_ALL)"
                          : "Unlock all cosmetics (developer)"
                      }
                      checked={unlockAll}
                      disabled={unlockAllForced}
                      onChange={(checked) => {
                        if (unlockAllForced) return;
                        setDevUnlockAll(checked);
                      }}
                    />
                  )}
                </div>
              </SettingBlock>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading>Account &amp; study</SectionHeading>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <SettingBlock icon={Shield} title="Data & privacy">
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Study data syncs to your account via Supabase (RLS). We do not sell personal data.{" "}
                  <Link
                    href="/privacy"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Privacy Policy
                  </Link>
                  {" · "}
                  <Link
                    href="/terms"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
                  >
                    Terms of Use
                  </Link>
                </p>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Device-local only (not synced): calendar view, Pomodoro display mode, feature tips
                  seen.
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
                    Sign out clears synced data from this browser. Delete account permanently removes
                    your cloud account, synced rows, and flashcard images.
                  </p>
                )}
              </SettingBlock>

              <SettingBlock icon={Focus} title="Focus Mode">
                <p className="mb-3 text-[12px] text-muted-foreground">
                  Leaving the tab pauses your session — browsers can&apos;t block other sites.
                </p>
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label htmlFor="focus-work-min" className="text-[11px] text-muted-foreground">
                      Work (min)
                    </Label>
                    <Input
                      id="focus-work-min"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={480}
                      value={focusPreferences.workMinutes}
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        if (Number.isFinite(n)) updateFocusPreferences({ workMinutes: n });
                      }}
                      className="h-8 font-mono text-[13px] tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="focus-short-min" className="text-[11px] text-muted-foreground">
                      Short break
                    </Label>
                    <Input
                      id="focus-short-min"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={480}
                      value={focusPreferences.shortBreakMinutes}
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        if (Number.isFinite(n)) updateFocusPreferences({ shortBreakMinutes: n });
                      }}
                      className="h-8 font-mono text-[13px] tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="focus-long-min" className="text-[11px] text-muted-foreground">
                      Long break
                    </Label>
                    <Input
                      id="focus-long-min"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={480}
                      value={focusPreferences.longBreakMinutes}
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        if (Number.isFinite(n)) updateFocusPreferences({ longBreakMinutes: n });
                      }}
                      className="h-8 font-mono text-[13px] tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="focus-cycles" className="text-[11px] text-muted-foreground">
                      Cycles → long
                    </Label>
                    <Input
                      id="focus-cycles"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={12}
                      value={focusPreferences.cyclesBeforeLongBreak}
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        if (Number.isFinite(n))
                          updateFocusPreferences({ cyclesBeforeLongBreak: n });
                      }}
                      className="h-8 font-mono text-[13px] tabular-nums"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <ToggleRow
                    label="Auto-enter on timer start"
                    checked={focusPreferences.autoEnterFocusMode}
                    onChange={(next) => updateFocusPreferences({ autoEnterFocusMode: next })}
                  />
                </div>
              </SettingBlock>

              <SettingBlock icon={Bell} title="Notifications">
                <div className="mb-3 flex flex-col gap-2">
                  <ToggleRow
                    label="Missed objective / calendar event"
                    checked={missedScheduleEnabled}
                    onChange={(next) => {
                      setMissedScheduleNotificationPreference(next);
                      setMissedScheduleEnabled(next);
                    }}
                  />
                  <ToggleRow
                    label="Due-soon reminder (once daily)"
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
