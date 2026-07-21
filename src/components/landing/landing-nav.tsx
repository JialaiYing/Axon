"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AxonLogo } from "@/components/brand/axon-logo";
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

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled || pathname === "/faq"
          ? "border-white/10 bg-black/70 shadow-[var(--shadow-elevation-2)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
        <Link
          href="/"
          onClick={scrollToTop}
          aria-label="Axon home"
          className="flex shrink-0 items-center rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <AxonLogo
            withWordmark
            priority
            iconClassName="h-8 w-8"
            wordmarkClassName="text-base text-white"
          />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="mr-1 flex items-center gap-0.5 sm:mr-2 sm:gap-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
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
      </div>
    </header>
  );
}
