"use client";

import * as React from "react";
import Lenis from "lenis";

let activeLenis: Lenis | null = null;

/**
 * Pause/resume the page's Lenis instance — used by overlays (e.g. the mobile
 * nav drawer) so Radix's scroll lock and Lenis's own rAF-driven scroll don't
 * fight each other and leave the scroll position desynced when the overlay
 * closes. No-ops safely if Lenis never mounted (reduced-motion users).
 */
export function pauseSmoothScroll() {
  activeLenis?.stop();
}

export function resumeSmoothScroll() {
  activeLenis?.start();
}

/**
 * Gentle momentum scrolling for the marketing page only — never section
 * snapping, never scroll-jacking. Skipped entirely for reduced-motion users,
 * where native instant scroll is the correct, calmer behavior.
 */
export function SmoothScroll() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1,
    });
    activeLenis = lenis;

    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
    };
  }, []);

  return null;
}
