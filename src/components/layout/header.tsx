"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProfileMenu } from "@/components/auth/profile-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-background/25 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
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
