"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Settings } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ProfileMenu } from "@/components/auth/profile-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-background/25 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        {/* Reserved for a future AI-powered command palette — intentionally not wired. */}
        <div className="group hidden items-center gap-2 rounded-lg border border-border/50 bg-surface/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:border-border-strong hover:bg-surface/55 md:flex md:w-72">
          <Search className="h-3.5 w-3.5 transition-colors duration-200 group-hover:text-foreground" />
          <span className="text-xs">Search Axon...</span>
          <kbd className="ml-auto rounded-md border border-border/50 bg-card/40 px-1.5 py-0.5 text-[10px] font-medium text-muted">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-muted transition-all duration-200",
              "hover:bg-card hover:text-foreground active:scale-90",
              pathname === "/settings" && "bg-card text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 border-l border-border/40 pl-3">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
