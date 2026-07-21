"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Why Axon", href: "/#why-axon" },
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQ", href: "/faq" },
];

export function LandingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [activeHref, setActiveHref] = React.useState(
    pathname === "/faq" ? "/faq" : "/#why-axon"
  );

  React.useEffect(() => {
    if (pathname === "/faq") {
      setActiveHref("/faq");
      setScrolled(true);
      return;
    }

    function onScroll() {
      setScrolled(window.scrollY > 8);
      const sections = ["why-axon", "features", "how-it-works"];
      let current = "/#why-axon";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 120) {
          current = `/#${id}`;
        }
      }
      setActiveHref(current);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b transition-all duration-300",
        scrolled || pathname === "/faq"
          ? "border-white/10 bg-black/70 shadow-[0_1px_0_rgba(255,255,255,0.04),0_12px_30px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-end gap-1 px-6 sm:gap-2">
        <nav className="mr-1 flex items-center gap-0.5 sm:mr-2 sm:gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-white/55 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button
          type="button"
          size="sm"
          variant="outline"
          asChild
          className="rounded-lg border-white/20 bg-transparent text-xs font-medium text-white shadow-none hover:bg-white/5 hover:text-white hover:shadow-none"
        >
          <Link href="/login">Login</Link>
        </Button>
        <Button
          size="sm"
          asChild
          className="rounded-lg border-0 bg-white text-xs font-medium text-black shadow-none hover:bg-white/90 hover:shadow-none"
        >
          <Link href="/login?mode=signup">Sign up</Link>
        </Button>
      </div>
    </header>
  );
}
