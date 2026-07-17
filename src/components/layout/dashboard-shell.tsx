"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { TimerNotificationsWatcher } from "@/components/layout/timer-notifications-watcher";
import { DashboardBackground } from "@/components/layout/dashboard-background";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <DashboardBackground />
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div
        className={cn(
          "relative z-10 flex h-full w-full flex-col transition-[padding-left] duration-300 ease-out",
          sidebarOpen && "md:pl-[200px]"
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <TimerNotificationsWatcher />
    </div>
  );
}
