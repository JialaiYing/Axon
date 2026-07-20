"use client";

import * as React from "react";
import Link from "next/link";
import PillNav from "@/components/effects/pill-nav";
import { Button } from "@/components/ui/button";
import BorderGlow from "@/components/effects/border-glow";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Why Axon", href: "#why-axon" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [activeHref, setActiveHref] = React.useState("#why-axon");

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
      const sections = NAV_ITEMS.map((item) => item.href.slice(1));
      let current = NAV_ITEMS[0]!.href;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 120) {
          current = `#${id}`;
        }
      }
      setActiveHref(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b transition-all duration-300",
        scrolled
          ? "border-border/60 bg-background/70 shadow-[0_1px_0_rgba(255,255,255,0.04),0_12px_30px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-center px-6">
        <PillNav
          items={NAV_ITEMS}
          activeHref={activeHref}
          ease="power2.easeOut"
          baseColor="rgba(15, 17, 21, 0.85)"
          pillColor="rgba(19, 22, 32, 0.9)"
          pillTextColor="#9096a8"
          hoveredPillTextColor="#f4f5f7"
          initialLoadAnimation={false}
        />

        {/* z-[100] keeps these clickable above .pill-nav-container (z-99), whose
            full-width box otherwise swallows clicks on this side of the header. */}
        <div className="absolute right-6 z-[100] flex items-center gap-2">
          <BorderGlow
            asButton
            edgeSensitivity={28}
            glowColor="270 80 75"
            backgroundColor="#0f1115"
            borderRadius={8}
            glowRadius={22}
            glowIntensity={0.9}
            coneSpread={25}
            colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
            fillOpacity={0.35}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              asChild
              className="rounded-[7px] border-border/60 bg-transparent shadow-none hover:shadow-none"
            >
              <Link href="/login">Login</Link>
            </Button>
          </BorderGlow>
          <BorderGlow
            asButton
            edgeSensitivity={28}
            glowColor="210 90 75"
            backgroundColor="#1d3a66"
            borderRadius={8}
            glowRadius={22}
            glowIntensity={1}
            coneSpread={25}
            colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
            fillOpacity={0.4}
          >
            <Button
              size="sm"
              asChild
              className="min-w-[8.75rem] rounded-[7px] border-0 shadow-none hover:shadow-none"
            >
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
          </BorderGlow>
        </div>
      </div>
    </header>
  );
}
