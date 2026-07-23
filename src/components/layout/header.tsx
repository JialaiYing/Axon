"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProfileMenu } from "@/components/auth/profile-menu";
import { useShellChrome } from "@/components/layout/shell-chrome";
import { headerIconButtonClass } from "@/components/layout/header-chrome";
import { cn } from "@/lib/utils";

export function Header() {
  const { immersive, setImmersive, focusLock } = useShellChrome();

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm md:px-6 light:border-border light:bg-background/90">
      <div className="flex items-center gap-2">
        <MobileNav />
      </div>

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
            headerIconButtonClass(immersive),
            focusLock && "pointer-events-none opacity-40"
          )}
        >
          {immersive ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <ThemeToggle />
        <div className="ml-1.5 flex items-center border-l border-border/50 pl-2.5 light:border-border">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
