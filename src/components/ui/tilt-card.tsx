"use client";

import * as React from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Max rotation in degrees. */
  maxTilt?: number;
  /** Disable on touch/coarse pointers automatically; set false to force-enable. */
  glow?: boolean;
}

/**
 * Wraps any card content with a gentle cursor-following 3D tilt, a soft
 * radial glow that tracks the pointer, and a subtle lift on hover.
 * Falls back to a static card with no motion for touch/coarse pointers.
 */
export function TiltCard({ children, className, maxTilt = 8, glow = true }: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isCoarsePointer, setIsCoarsePointer] = React.useState(false);

  React.useEffect(() => {
    setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 25 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 25 });
  const glowXPercent = useTransform(mouseX, (v) => `${v * 100}%`);
  const glowYPercent = useTransform(mouseY, (v) => `${v * 100}%`);
  const glowBackground = useMotionTemplate`radial-gradient(220px circle at ${glowXPercent} ${glowYPercent}, rgba(59,130,246,0.16), transparent 65%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || isCoarsePointer) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    mouseX.set(px);
    mouseY.set(py);
    rotateY.set((px - 0.5) * maxTilt * 2);
    rotateX.set(-(py - 0.5) * maxTilt * 2);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={isCoarsePointer ? undefined : { y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        rotateX: isCoarsePointer ? 0 : rotateX,
        rotateY: isCoarsePointer ? 0 : rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
      }}
      className={cn("group relative", className)}
    >
      {glow && !isCoarsePointer && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glowBackground }}
        />
      )}
      {children}
    </motion.div>
  );
}