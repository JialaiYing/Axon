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
  lg: 22,
} as const;

export type StreakFlameSize = keyof typeof SIZE_PX;

export interface StreakFlameProps {
  /** Current streak length in days (or weeks when `unit="week"`). */
  days: number;
  /**
   * Streak cadence. Weekly streaks map to day-equivalent heat so a 2-week
   * streak doesn't render as a 2-day spark.
   */
  unit?: "day" | "week";
  size?: StreakFlameSize;
  className?: string;
  /** When false, skips entrance/scale motion (useful inside tight static chrome). */
  animated?: boolean;
}

/**
 * Solid filled streak flame — always colored in, grows and heats up with the streak.
 * Forces Lucide `fill="currentColor"` so the icon is never a hollow outline.
 */
export function StreakFlame({
  days,
  unit = "day",
  size = "md",
  className,
  animated = true,
}: StreakFlameProps) {
  const prefersReducedMotion = useReducedMotion();
  const heatDays = unit === "week" ? days * 7 : days;
  const visual = getStreakFlameVisual(heatDays);
  const basePx = SIZE_PX[size];
  const reduce = Boolean(prefersReducedMotion) || !animated;

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: basePx * 1.85, height: basePx * 1.85 }}
      title={
        days > 0
          ? `${days}-${unit === "week" ? "week" : "day"} streak · ${visual.label}`
          : visual.label
      }
      aria-hidden
    >
      {visual.glow && (
        <span
          className={cn(
            "pointer-events-none absolute inset-[10%] rounded-full blur-[7px]",
            visual.tier === "legend" || visual.tier === "inferno"
              ? "bg-danger/55"
              : "bg-warning/50",
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
                  ? [visual.scale, visual.scale * 1.1, visual.scale]
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
          strokeWidth={visual.tier === "legend" ? 2.25 : 1.75}
          fill="currentColor"
        />
      </motion.span>
    </span>
  );
}
