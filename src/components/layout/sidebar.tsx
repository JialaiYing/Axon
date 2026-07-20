"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react";
import { NAV_PRIMARY, NAV_PROGRESS } from "@/constants/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const progressActive = NAV_PROGRESS.children.some((c) => c.href === pathname);
  const [progressOpen, setProgressOpen] = React.useState(progressActive);

  React.useEffect(() => {
    if (progressActive) setProgressOpen(true);
  }, [progressActive]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/40 bg-surface/90 shadow-[0_0_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md transition-[width] duration-300 ease-out md:flex light:bg-surface light:shadow-none light:backdrop-blur-none",
        open ? "w-[200px]" : "w-16"
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b border-border/40",
          open ? "px-4" : "justify-center px-0"
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_8px_30px_-10px_rgba(59,130,246,0.35)] light:shadow-[0_1px_2px_rgba(23,24,28,0.18)]">
          <Zap className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
        </div>
        {open && (
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-foreground">
            Axon
          </span>
        )}
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-4 scrollbar-none">
        {NAV_PRIMARY.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={open ? undefined : item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-200",
                open ? "px-3" : "justify-center px-0",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-foreground/60 hover:bg-card/60 hover:text-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {open && <span className="truncate whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        {/* Progress group — Analytics + Goals */}
        <div className="mt-1">
          {open ? (
            <>
              <button
                type="button"
                onClick={() => setProgressOpen((v) => !v)}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200",
                  progressActive
                    ? "bg-accent-muted/50 text-accent"
                    : "text-foreground/60 hover:bg-card/60 hover:text-foreground"
                )}
                aria-expanded={progressOpen}
              >
                <NAV_PROGRESS.icon className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">{NAV_PROGRESS.label}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform",
                    progressOpen && "rotate-180"
                  )}
                />
              </button>
              {progressOpen && (
                <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border/40 pl-2">
                  {NAV_PROGRESS.children.map((child) => {
                    const isActive = pathname === child.href;
                    const Icon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-accent-muted text-accent"
                            : "text-foreground/55 hover:bg-card/60 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Link
              href={NAV_PROGRESS.href}
              title="Progress"
              aria-current={progressActive ? "page" : undefined}
              className={cn(
                "flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200",
                progressActive
                  ? "bg-accent-muted text-accent"
                  : "text-foreground/60 hover:bg-card/60 hover:text-foreground"
              )}
            >
              <NAV_PROGRESS.icon className="h-[18px] w-[18px] shrink-0" />
            </Link>
          )}
        </div>
      </nav>

      <div className="shrink-0 border-t border-border/40 p-2.5">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-lg text-sm font-medium text-foreground/60 transition-colors duration-200 hover:bg-card/60 hover:text-foreground",
            open ? "px-3" : "justify-center px-0"
          )}
        >
          {open ? (
            <>
              <PanelLeftClose className="h-[18px] w-[18px] shrink-0" />
              <span className="whitespace-nowrap">Collapse</span>
            </>
          ) : (
            <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
