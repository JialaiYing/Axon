"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/constants/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(
    "axon:sidebar-collapsed",
    false
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="relative hidden h-screen shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur-xl md:flex"
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_8px_30px_-10px_rgba(59,130,246,0.35)]">
          <Zap className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Axon
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const content = (
            <span
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent-muted text-accent-foreground"
                  : "text-muted hover:bg-card hover:text-foreground",
                item.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.disabled && (
                <span className="ml-auto rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Soon
                </span>
              )}
            </span>
          );

          if (item.disabled) {
            return (
              <div key={item.href} aria-disabled>
                {content}
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
