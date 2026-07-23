"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { AxonLogo } from "@/components/brand/axon-logo";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, NAV_PRIMARY, NAV_PROGRESS } from "@/constants/navigation";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground md:hidden light:hover:bg-black/[0.04]"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r border-border/50 bg-surface p-4 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left light:border-border/40 light:backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <AxonLogo withWordmark iconClassName="h-7 w-7" />
            <DialogPrimitive.Close className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-card-hover hover:text-foreground">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV_PRIMARY.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent-muted/60 text-foreground light:bg-accent-muted light:text-accent"
                      : "text-muted hover:bg-card-hover hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-accent" : "text-foreground/55")} />
                  {item.label}
                </Link>
              );
            })}

            <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {NAV_PROGRESS.label}
            </p>
            {NAV_PROGRESS.children.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent-muted/60 text-foreground light:bg-accent-muted light:text-accent"
                      : "text-muted hover:bg-card-hover hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      item.href === "/rank"
                        ? "text-warning"
                        : isActive
                          ? "text-accent"
                          : "text-foreground/55"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}

            {NAV_ITEMS.filter((i) => i.href === "/settings").map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent-muted/60 text-foreground light:bg-accent-muted light:text-accent"
                      : "text-muted hover:bg-card-hover hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-accent" : "text-foreground/55")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
