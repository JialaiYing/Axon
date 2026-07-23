"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/pomodoro-utils";

interface TimerRingProps {
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
  /**
   * Fixed diameter in px (Focus Mode). When omitted, the ring fills its
   * container up to 240px so cards never clip the timer.
   */
  size?: number;
}

/** Internal SVG coordinate space — stroke math stays stable while CSS scales. */
const COORD = 260;
const STROKE = 5;

export function TimerRing({ remainingSeconds, totalSeconds, size }: TimerRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const fluid = size == null;
  const RADIUS = (COORD - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const fraction = totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 1;
  const isLow = totalSeconds > 0 && fraction <= 0.1;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        fluid && "@container mx-auto aspect-square w-full max-w-[min(100%,240px)]"
      )}
      style={fluid ? undefined : { width: size, height: size }}
    >
      <div
        aria-hidden
        className="absolute inset-[5.4%] rounded-full border border-border/50 bg-transparent light:border-border"
      />

      <svg
        viewBox={`0 0 ${COORD} ${COORD}`}
        className={cn("-rotate-90", fluid ? "h-full w-full" : undefined)}
        width={fluid ? undefined : size}
        height={fluid ? undefined : size}
        aria-hidden
      >
        <circle
          cx={COORD / 2}
          cy={COORD / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
          opacity={0.7}
        />
        <motion.circle
          cx={COORD / 2}
          cy={COORD / 2}
          r={RADIUS}
          fill="none"
          stroke={isLow ? "var(--color-danger)" : "var(--color-foreground)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: "linear" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          animate={isLow && !prefersReducedMotion ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 1, repeat: isLow && !prefersReducedMotion ? Infinity : 0 }}
          className={cn(
            "font-mono font-semibold tabular-nums tracking-[-0.04em] text-foreground",
            fluid && "text-[clamp(1.5rem,22cqi,2.75rem)]"
          )}
          style={
            fluid
              ? undefined
              : { fontSize: size! >= 400 ? "4.5rem" : size! >= 300 ? "3.25rem" : "2.75rem" }
          }
        >
          {formatClock(remainingSeconds)}
        </motion.span>
        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {isLow ? "Almost up" : "Remaining"}
        </span>
      </div>
    </div>
  );
}
