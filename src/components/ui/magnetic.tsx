"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { SPRING } from "@/lib/motion";

interface MagneticProps {
  children: React.ReactNode;
  /** How far the element is allowed to travel toward the cursor, in px. */
  strength?: number;
  /** Radius (px) around the element where the pull starts. */
  range?: number;
  className?: string;
}

/**
 * Wraps a single primary action (hero/final CTA) so it gently drifts toward
 * the cursor as it approaches, then springs back on leave. Reserved for the
 * one or two most important buttons on a page — not every clickable thing.
 */
export function Magnetic({ children, strength = 14, range = 90, className }: MagneticProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING.magnetic);
  const springY = useSpring(y, SPRING.magnetic);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.hypot(distanceX, distanceY);

    if (distance < range + rect.width / 2) {
      const pull = Math.min(1, 1 - distance / (range + rect.width));
      x.set(distanceX * pull * (strength / 40));
      y.set(distanceY * pull * (strength / 40));
    } else {
      x.set(0);
      y.set(0);
    }
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={prefersReducedMotion ? undefined : { x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
