"use client";

import * as React from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { AxonLogo } from "@/components/brand/axon-logo";
import { landingFocusRingClassName } from "@/components/landing/landing-primitives";
import { pauseSmoothScroll, resumeSmoothScroll } from "@/components/landing/smooth-scroll";
import { cn } from "@/lib/utils";

interface LandingNavItem {
  label: string;
  href: string;
}

/**
 * Mobile disclosure for the marketing nav — mirrors the dashboard's
 * `layout/mobile-nav.tsx` pattern (Radix Dialog as a slide-in panel) so the
 * two "open navigation" moments in the app feel like the same product.
 * Below `md` this is the only way to reach in-page anchors and Sign in.
 */
export function LandingMobileNav({
  items,
  activeHref,
}: {
  items: LandingNavItem[];
  activeHref: string;
}) {
  const [open, setOpen] = React.useState(false);

  // Keep Lenis's virtual scroll position in sync with Radix's scroll lock
  // while the drawer is open, so scrolling doesn't jump when it closes.
  React.useEffect(() => {
    if (open) {
      pauseSmoothScroll();
      return () => resumeSmoothScroll();
    }
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-wash hover:text-foreground md:hidden",
            landingFocusRingClassName
          )}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 md:hidden"
        />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-40 flex h-full w-72 max-w-[80vw] flex-col border-l border-border bg-surface p-5 shadow-[var(--shadow-overlay-strong)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right md:hidden"
        >
          <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Links to sections of the Axon homepage, plus sign in.
          </DialogPrimitive.Description>

          <div className="mb-8 flex items-center justify-between">
            <AxonLogo
              withWordmark
              iconClassName="h-7 w-7"
              wordmarkClassName="text-[15px] font-medium tracking-tight text-foreground"
            />
            <DialogPrimitive.Close
              aria-label="Close menu"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-wash hover:text-foreground",
                landingFocusRingClassName
              )}
            >
              <X className="h-4 w-4" aria-hidden />
            </DialogPrimitive.Close>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Primary">
            {items.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <DialogPrimitive.Close key={item.href} asChild>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors",
                      landingFocusRingClassName,
                      isActive
                        ? "bg-wash text-foreground"
                        : "text-muted-foreground hover:bg-wash/70 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                </DialogPrimitive.Close>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border pt-5">
            <DialogPrimitive.Close asChild>
              <Link
                href="/login"
                className={cn(
                  "block rounded-md px-3 py-2.5 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-wash hover:text-foreground",
                  landingFocusRingClassName
                )}
              >
                Sign in
              </Link>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
