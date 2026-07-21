"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProfileMenu } from "@/components/auth/profile-menu";
import { useShellChrome } from "@/components/layout/shell-chrome";
import { cn } from "@/lib/utils";

export function Header() {
  const { immersive, setImmersive, focusLock } = useShellChrome();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/50 bg-card/40 px-4 backdrop-blur-md md:px-6 light:bg-background/70">
      <div className="flex items-center gap-3">
        <MobileNav />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            type="button"
            aria-label={immersive ? "Exit fullscreen" : "Fullscreen page"}
            title={immersive ? "Exit fullscreen (Esc)" : "Fullscreen page"}
            aria-pressed={immersive}
            disabled={focusLock}
            onClick={() => setImmersive(!immersive)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-muted transition-all duration-200",
              "hover:bg-card hover:text-foreground active:scale-90",
              immersive && "bg-card text-foreground",
              focusLock && "pointer-events-none opacity-40"
            )}
          >
            {immersive ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 border-l border-border/40 pl-3">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
