"use client";

/**
 * Linear-inspired sidebar pass (2026-07-23).
 * Say "revert" to restore the previous denser/accented sidebar.
 * Previous implementation lived in this file before this rewrite —
 * restore from git history or ask the agent to revert.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { AxonLogo } from "@/components/brand/axon-logo";
import { NAV_PRIMARY, NAV_PROGRESS } from "@/constants/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function navItemClass(active: boolean, expanded: boolean) {
  return cn(
    "flex items-center rounded-md text-[13px] font-medium transition-colors duration-150",
    expanded ? "h-8 gap-2.5 px-2" : "h-8 w-8 justify-center px-0",
    active
      ? "bg-wash-strong text-foreground"
      : "text-muted-foreground hover:bg-wash hover:text-foreground"
  );
}

function navIconClass(active: boolean) {
  return cn(
    "h-4 w-4 shrink-0",
    active ? "text-foreground" : "text-muted-foreground"
  );
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/40 bg-background transition-[width] duration-200 ease-out md:flex light:border-border light:bg-surface",
        open ? "w-[200px]" : "w-14"
      )}
    >
      <Link
        href="/dashboard"
        aria-label="Axon dashboard"
        className={cn(
          "flex h-12 shrink-0 items-center",
          open ? "px-3" : "justify-center px-0"
        )}
      >
        <AxonLogo
          withWordmark={open}
          iconClassName="h-6 w-6"
          wordmarkClassName="text-[13px] font-medium text-foreground"
        />
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3 pt-1 scrollbar-none">
        {NAV_PRIMARY.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={open ? undefined : item.label}
              aria-current={isActive ? "page" : undefined}
              data-xp-target={item.href === "/dashboard" ? "dashboard" : undefined}
              className={cn(
                navItemClass(isActive, open),
                item.href === "/dashboard" &&
                  "data-[xp-pulse=true]:bg-wash-strong data-[xp-pulse=true]:scale-[1.02]"
              )}
            >
              <Icon className={navIconClass(isActive)} />
              {open && <span className="truncate whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        {/* Flat Progress section — Linear-style label + peers, no accordion */}
        {open ? (
          <div className="mt-4">
            <p className="mb-1 px-2 text-[11px] font-medium text-muted-foreground/80">
              {NAV_PROGRESS.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {NAV_PROGRESS.children.map((child) => {
                const isActive = pathname === child.href;
                const Icon = child.icon;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    aria-current={isActive ? "page" : undefined}
                    className={navItemClass(isActive, true)}
                  >
                    <Icon className={navIconClass(isActive)} />
                    <span className="truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-0.5">
            {NAV_PROGRESS.children.map((child) => {
              const isActive = pathname === child.href;
              const Icon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  title={child.label}
                  aria-current={isActive ? "page" : undefined}
                  className={navItemClass(isActive, false)}
                >
                  <Icon className={navIconClass(isActive)} />
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="shrink-0 px-2 pb-2 pt-1">
        <Link
          href="/settings"
          title={open ? undefined : "Settings"}
          aria-label="Settings"
          aria-current={pathname === "/settings" ? "page" : undefined}
          className={cn(navItemClass(pathname === "/settings", open), open ? "w-full" : undefined)}
        >
          <Settings className={navIconClass(pathname === "/settings")} />
          {open && <span className="whitespace-nowrap">Settings</span>}
        </Link>
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={open}
          className={cn(navItemClass(false, open), "mt-0.5", open && "w-full")}
        >
          {open ? (
            <PanelLeftClose className={navIconClass(false)} />
          ) : (
            <PanelLeftOpen className={navIconClass(false)} />
          )}
        </button>
      </div>
    </aside>
  );
}
