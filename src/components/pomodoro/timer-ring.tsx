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
  const gradientId = React.useId();
  const SIZE = size;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const fraction = totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 1;
  const isLow = totalSeconds > 0 && fraction <= 0.1;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      {/* Soft ambient glow behind the whole ring — the "luxury desktop app" depth cue. */}
      <motion.div
        aria-hidden
        className="absolute rounded-full blur-3xl"
        animate={{
          background: isLow
            ? "radial-gradient(circle, rgba(239,68,68,0.22), transparent 70%)"
            : "radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)",
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ width: SIZE * 0.85, height: SIZE * 0.85 }}
      />

      <div
        aria-hidden
        className="absolute rounded-full border border-white/8 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.09),rgba(255,255,255,0.015)_55%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_18px_50px_-28px_rgba(59,130,246,0.7)]"
        style={{ width: SIZE - 28, height: SIZE - 28 }}
      />

      <svg width={SIZE} height={SIZE} className="-rotate-90 drop-shadow-sm">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-secondary)" />
          </linearGradient>
        </defs>
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
          stroke={isLow ? "var(--color-danger)" : `url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: "linear" }}
          style={{
            filter: isLow
              ? "drop-shadow(0 0 12px rgba(239,68,68,0.6))"
              : "drop-shadow(0 0 12px rgba(59,130,246,0.4))",
          }}
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.span
          animate={isLow && !prefersReducedMotion ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 1, repeat: isLow && !prefersReducedMotion ? Infinity : 0 }}
          className="font-mono font-semibold tabular-nums tracking-[-0.04em] text-foreground drop-shadow-[0_2px_16px_rgba(59,130,246,0.2)]"
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
