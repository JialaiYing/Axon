"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react";
import { NAV_ITEMS } from "@/constants/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();

  const items = React.useMemo(
    () => NAV_ITEMS.filter((item) => !item.disabled && item.href !== "/settings"),
    []
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/40 bg-surface/70 shadow-[0_0_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-[width] duration-300 ease-out md:flex",
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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_8px_30px_-10px_rgba(59,130,246,0.35)]">
          <Zap className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
        </div>
        {open && (
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-foreground">
            Axon
          </span>
        )}
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-4 scrollbar-none">
        {items.map((item) => {
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
                  ? "bg-accent-muted text-accent-foreground"
                  : "text-white/60 hover:bg-card/60 hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {open && <span className="truncate whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border/40 p-2.5">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-lg text-sm font-medium text-white/60 transition-colors duration-200 hover:bg-card/60 hover:text-white",
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
