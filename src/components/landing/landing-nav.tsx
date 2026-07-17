"use client";

import * as React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
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
          ? "border-border/60 bg-background/80 shadow-[0_1px_0_rgba(255,255,255,0.04),0_12px_30px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <Zap className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Axon</span>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="#why-axon" className="transition-colors hover:text-foreground">
            Why Axon
          </Link>
          <Link href="#features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
        </nav>

        <Button size="sm" asChild>
          <Link href="/dashboard">Open Dashboard</Link>
        </Button>
      </div>
    </header>
  );
}