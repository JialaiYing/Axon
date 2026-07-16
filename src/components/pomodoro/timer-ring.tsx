"use client";

import { motion } from "framer-motion";
import { formatClock } from "@/lib/pomodoro-utils";

interface TimerRingProps {
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
}

const SIZE = 260;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({ remainingSeconds, totalSeconds, label }: TimerRingProps) {
  const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const isLow = totalSeconds > 0 && fraction <= 0.1;
  const dashOffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth={STROKE}
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
          transition={{ duration: 0.6, ease: "linear" }}
          style={{
            filter: isLow
              ? "drop-shadow(0 0 10px rgba(239,68,68,0.55))"
              : "drop-shadow(0 0 10px rgba(59,130,246,0.35))",
          }}
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.span
          animate={isLow ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 1, repeat: isLow ? Infinity : 0 }}
          className="font-mono text-5xl font-semibold tabular-nums text-foreground"
        >
          {formatClock(remainingSeconds)}
        </motion.span>
        {label && (
          <span className="mt-2 max-w-[180px] truncate text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}