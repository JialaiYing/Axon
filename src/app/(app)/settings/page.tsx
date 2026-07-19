"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Cloud, Focus, Home, Moon, RotateCcw, Shield, Sparkles } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useFocusPreferences } from "@/hooks/use-focus-preferences";
import { useAuth } from "@/components/auth/auth-provider";
import { useSync } from "@/components/sync/sync-provider";
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

export default function SettingsPage() {
  const { resetAll, markAllSeen } = useOnboarding();
  const { preferences: focusPreferences, updatePreferences: updateFocusPreferences } =
    useFocusPreferences();
  const { user, configured } = useAuth();
  const { status, syncNow } = useSync();

  const [permission, setPermission] = React.useState<BrowserNotificationPermission>("default");
  const [prefEnabled, setPrefEnabled] = React.useState(false);
  const [dueSoonEnabled, setDueSoonEnabled] = React.useState(false);
  const [tourReset, setTourReset] = React.useState(false);

  React.useEffect(() => {
    setPermission(getBrowserNotificationPermission());
    setPrefEnabled(getBrowserNotificationPreference());
    setDueSoonEnabled(getDueSoonNotificationPreference());
  }, []);

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

  return (
    <AppPage
      title="Settings"
      description="Preferences and configuration for your Axon workspace."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Moon className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Axon uses a single, fixed dark theme — tuned for long study sessions and low eye
            strain. A light theme isn&apos;t planned; the goal is one calm surface, not a switch
            to configure.
          </p>
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Data &amp; privacy</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Axon is offline-first: everything lives in this browser by default. Sign in (avatar
            menu) to optionally sync your data to Supabase across devices. Without an account,
            nothing leaves your machine.
          </p>
          {configured && (
            <p className="mt-2 text-xs text-muted-foreground">
              {user
                ? `Signed in as ${user.email} · sync ${status}`
                : "Supabase is configured — sign in from the avatar menu to enable sync."}
            </p>
          )}
          {user && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void syncNow()}
            >
              <Cloud className="h-3.5 w-3.5" />
              Sync now
            </Button>
          )}
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Focus className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Focus Mode</h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Full-screen lockdown when a Pomodoro starts — hides nav, confirms before leaving, and
            nudges you if you switch tabs. Browsers can&apos;t hard-block other sites.
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
            <h2 className="text-sm font-semibold text-foreground">Browser notifications</h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Lean by design: Pomodoro completion alerts are the default. Optional due-soon
            reminders fire at most once per day so notifications don&apos;t fight Focus Mode.
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
          {!areBrowserNotificationsSupported() ? (
            <p className="text-xs text-muted-foreground">
              This browser does not support the Notification API.
            </p>
          ) : permission === "denied" ? (
            <p className="text-xs text-warning">
              Notifications are blocked in browser settings. Re-enable them for this site to use
              this feature.
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
            <h2 className="text-sm font-semibold text-foreground">Feature tours</h2>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            A short Kanban + Pomodoro tour runs once for new users. Replay it anytime, or dismiss
            everything at once.
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
              Replay tours
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => markAllSeen()}>
              Dismiss all
            </Button>
          </div>
          {tourReset && (
            <p className="mt-2 text-xs text-muted-foreground">
              Tour reset — reload or visit the app to see the core loop intro again.
            </p>
          )}
        </Panel>

        <Panel variant="interactive" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">Motion</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Animations respect your system&apos;s reduced-motion preference automatically —
            enable it in your OS accessibility settings to switch every transition to a plain
            fade.
          </p>
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
  );
}
