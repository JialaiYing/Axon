"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatClock } from "@/lib/pomodoro-utils";

interface TimerRingProps {
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
  size?: number;
}

const STROKE = 7;

export function TimerRing({ remainingSeconds, totalSeconds, size = 260 }: TimerRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const SIZE = size;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const fraction = totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 1;
  const isLow = totalSeconds > 0 && fraction <= 0.1;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <div
        aria-hidden
        className="absolute rounded-full border border-border bg-surface"
        style={{ width: SIZE - 28, height: SIZE - 28 }}
      />

      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
          opacity={0.6}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={isLow ? "var(--color-danger)" : "var(--color-accent)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: "linear" }}
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.span
          animate={isLow && !prefersReducedMotion ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 1, repeat: isLow && !prefersReducedMotion ? Infinity : 0 }}
          className="font-mono font-semibold tabular-nums tracking-[-0.04em] text-foreground"
          style={{ fontSize: size >= 400 ? "4.5rem" : "3rem" }}
        >
          {formatClock(remainingSeconds)}
        </motion.span>
        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {isLow ? "Almost up" : "Remaining"}
        </span>
      </div>
    </div>
  );
}
