"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { TimerNotificationsWatcher } from "@/components/layout/timer-notifications-watcher";
import { DueSoonWatcher } from "@/components/layout/due-soon-watcher";
import { MissedScheduleWatcher } from "@/components/layout/missed-schedule-watcher";
import { BackgroundUnlockWatcher } from "@/components/layout/background-unlock-watcher";
import { StorageFailureBanner } from "@/components/layout/storage-failure-banner";
import { DashboardBackground } from "@/components/layout/dashboard-background";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import { XpBurstOverlay } from "@/components/layout/xp-burst-overlay";
import { ShellChromeProvider } from "@/components/layout/shell-chrome";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [immersive, setImmersive] = React.useState(false);
  const [focusLock, setFocusLock] = React.useState(false);

  const hideSidebar = immersive || focusLock;

  // Esc exits immersive chrome, but never fights Pomodoro Focus Mode (which
  // owns Escape while its overlay is up).
  React.useEffect(() => {
    if (!immersive || focusLock) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setImmersive(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [immersive, focusLock]);

  return (
    <ShellChromeProvider
      immersive={immersive}
      setImmersive={setImmersive}
      focusLock={focusLock}
      setFocusLock={setFocusLock}
    >
      <div className="relative h-screen w-full overflow-hidden text-foreground">
        <DashboardBackground />
        <GrainOverlay />
        {!hideSidebar && <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />}
        <div
          className={cn(
            "relative z-10 flex h-full w-full flex-col transition-[padding-left] duration-300 ease-out",
            !hideSidebar && (sidebarOpen ? "md:pl-[200px]" : "md:pl-16")
          )}
        >
          <Header />
          <main
            className={cn(
              "flex-1 overflow-y-auto",
              immersive ? "px-4 py-5 md:px-10 md:py-8" : "px-4 py-6 md:px-8 md:py-8"
            )}
          >
            <div className="mx-auto w-full max-w-[1400px]">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
        <TimerNotificationsWatcher />
        <DueSoonWatcher />
        <MissedScheduleWatcher />
        <BackgroundUnlockWatcher />
        <StorageFailureBanner />
        <XpBurstOverlay />
      </div>
    </ShellChromeProvider>
  );
}
