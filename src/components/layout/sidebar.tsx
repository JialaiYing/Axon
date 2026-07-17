"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import LineSidebar from "@/components/effects/line-sidebar";
import { NAV_ITEMS } from "@/constants/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const enabledItems = React.useMemo(
    () => NAV_ITEMS.filter((item) => !item.disabled),
    []
  );
  const labels = enabledItems.map((item) => item.label);
  const activeIndex = enabledItems.findIndex((item) => item.href === pathname);

  return (
    <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
      {/* Hover zone: thin strip when closed, full panel width when open */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-[width] duration-300 ease-out",
          open ? "w-[200px]" : "w-4"
        )}
        onMouseEnter={() => onOpenChange(true)}
        onMouseLeave={() => onOpenChange(false)}
      >
        {!open && (
          <span className="absolute left-0 top-1/2 h-16 w-1 -translate-y-1/2 rounded-r-full bg-border-strong/70" />
        )}

        <aside
          className={cn(
            "flex h-full w-[200px] flex-col border-r border-border/40 bg-surface/70 shadow-[0_0_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Link href="/dashboard" className="flex h-12 items-center gap-2 px-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_8px_30px_-10px_rgba(59,130,246,0.35)]">
              <Zap className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground">
              Axon
            </span>
          </Link>

          <div className="flex-1 overflow-y-auto px-1.5 pb-6 scrollbar-none">
            <LineSidebar
              items={labels}
              defaultActive={activeIndex >= 0 ? activeIndex : null}
              accentColor="#3b82f6"
              textColor="#ffffff"
              markerColor="#6c6c6c"
              showIndex
              showMarker
              scaleTick
              proximityRadius={80}
              maxShift={14}
              falloff="smooth"
              markerLength={24}
              markerGap={0}
              tickScale={0.5}
              itemGap={14}
              fontSize={0.85}
              smoothing={100}
              onItemClick={(index) => {
                const item = enabledItems[index];
                if (item) router.push(item.href);
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
