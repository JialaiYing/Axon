"use client";

import { Flame } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { getStreakFlameVisual } from "@/lib/progress/streak-flame";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SIZE_PX = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
} as const;

export type StreakFlameSize = keyof typeof SIZE_PX;

export interface StreakFlameProps {
  /** Current streak length in days (or weeks when used for weekly streaks). */
  days: number;
  size?: StreakFlameSize;
  className?: string;
  /** When false, skips entrance/scale motion (useful inside tight static chrome). */
  animated?: boolean;
}

/**
 * Duolingo-style streak flame: grows and heats up as the streak continues.
 * Color, scale, glow, and optional flicker all come from `getStreakFlameVisual`.
 */
export function StreakFlame({
  days,
  size = "md",
  className,
  animated = true,
}: StreakFlameProps) {
  const prefersReducedMotion = useReducedMotion();
  const visual = getStreakFlameVisual(days);
  const basePx = SIZE_PX[size];
  const reduce = Boolean(prefersReducedMotion) || !animated;

  const fillOpacity =
    visual.tier === "ember"
      ? 0.25
      : visual.tier === "flame"
        ? 0.4
        : visual.tier === "blaze"
          ? 0.55
          : visual.tier === "inferno"
            ? 0.7
            : visual.tier === "legend"
              ? 0.85
              : 0;

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: basePx * 1.55, height: basePx * 1.55 }}
      title={days > 0 ? `${days}-day streak · ${visual.label}` : visual.label}
      aria-hidden
    >
      {visual.glow && (
        <span
          className={cn(
            "pointer-events-none absolute inset-[18%] rounded-full blur-[5px]",
            visual.tier === "legend" || visual.tier === "inferno"
              ? "bg-danger/45"
              : "bg-warning/40",
            !reduce && visual.pulse && "animate-streak-glow"
          )}
        />
      )}
      <motion.span
        className="relative inline-flex"
        initial={false}
        animate={
          reduce
            ? { scale: visual.scale }
            : {
                scale: visual.pulse
                  ? [visual.scale, visual.scale * 1.06, visual.scale]
                  : visual.scale,
              }
        }
        transition={
          reduce
            ? { duration: 0 }
            : visual.pulse
              ? {
                  duration: 1.8,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror",
                }
              : SPRING.enter
        }
      >
        <Flame
          className={cn(visual.colorClass, "transition-colors duration-300")}
          style={{ width: basePx, height: basePx }}
          strokeWidth={visual.tier === "legend" ? 2.35 : visual.tier === "dormant" ? 1.75 : 2}
          fill={fillOpacity > 0 ? "currentColor" : "none"}
          fillOpacity={fillOpacity}
        />
      </motion.span>
    </span>
  );
}
