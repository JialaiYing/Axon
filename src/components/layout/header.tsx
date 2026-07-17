"use client";

import { Search } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="group hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:border-border-strong md:flex md:w-72">
          <Search className="h-3.5 w-3.5 transition-colors duration-200 group-hover:text-foreground" />
          <span className="text-xs">Search Axon...</span>
          <kbd className="ml-auto rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* Theme toggle lives here, next to the profile avatar — dashboard-only. */}
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <ThemeToggle />
          <div
            aria-label="User profile"
            className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-accent to-secondary"
          />
        </div>
      </div>
    </header>
  );
}
