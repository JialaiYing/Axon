"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AxonLogo } from "@/components/brand/axon-logo";
import { LandingMobileNav } from "@/components/landing/landing-mobile-nav";
import {
  LandingContainer,
  landingFocusRingClassName,
  landingNavCtaClassName,
} from "@/components/landing/landing-primitives";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "How it works", href: "/#how-it-works", sectionId: "how-it-works" },
  { label: "Progress", href: "/#progress", sectionId: "progress" },
  { label: "Principles", href: "/#trust", sectionId: "trust" },
  { label: "FAQ", href: "/#faq", sectionId: "faq" },
];

export function LandingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [activeHref, setActiveHref] = React.useState("");

  React.useEffect(() => {
    if (pathname === "/faq") {
      // Standalone FAQ page — no matching in-page anchor, just keep the
      // header's solid chrome since there's no transparent hero to sit over.
      setScrolled(true);
      return;
    }

    function onScroll() {
      setScrolled(window.scrollY > 8);
      if (pathname !== "/") return;

      const sections = NAV_ITEMS.filter((item) => item.sectionId).map((item) => ({
        href: item.href,
        top: document.getElementById(item.sectionId!)?.getBoundingClientRect().top ?? Infinity,
      }));

      const active = [...sections]
        .reverse()
        .find((s) => s.top <= 140);

      setActiveHref(active?.href ?? "");
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
        "sticky top-0 z-30 border-b transition-[background-color,border-color] duration-300",
        scrolled || pathname === "/faq"
          ? "border-border/80 bg-background/85 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <LandingContainer className="flex h-14 items-center justify-between gap-3">
        <Link
          href="/"
          onClick={scrollToTop}
          aria-label="Axon home"
          className={cn(
            "flex shrink-0 items-center rounded-md transition-opacity hover:opacity-80",
            landingFocusRingClassName
          )}
        >
          <AxonLogo
            withWordmark
            priority
            iconClassName="h-7 w-7"
            wordmarkClassName="text-[15px] font-medium tracking-tight text-foreground"
          />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav
            className="mr-1 hidden items-center gap-0.5 md:mr-2 md:flex md:gap-0.5"
            aria-label="Primary"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    landingFocusRingClassName,
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/login"
            className={cn(
              "hidden rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-block",
              landingFocusRingClassName
            )}
          >
            Sign in
          </Link>
          <Button size="sm" asChild ripple={false} className={landingNavCtaClassName}>
            <Link href="/login?mode=signup">Get started</Link>
          </Button>
          <LandingMobileNav items={NAV_ITEMS} activeHref={activeHref} />
        </div>
      </LandingContainer>
    </header>
  );
}
