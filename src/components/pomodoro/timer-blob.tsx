"use client";

import { motion } from "framer-motion";
import { formatClock } from "@/lib/pomodoro-utils";

interface TimerBlobProps {
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
}

const BORDER_RADII = [
  "62% 38% 55% 45% / 55% 45% 55% 45%",
  "45% 55% 40% 60% / 60% 40% 60% 40%",
  "55% 45% 60% 40% / 45% 60% 40% 55%",
  "62% 38% 55% 45% / 55% 45% 55% 45%",
];

export function TimerBlob({ remainingSeconds, totalSeconds, label }: TimerBlobProps) {
  const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const isLow = totalSeconds > 0 && fraction <= 0.1;
  // Never fully vanish — floor the scale so the blob stays visible until 0.
  const scale = 0.28 + fraction * 0.72;

  return (
    <div className="relative flex h-[260px] w-[260px] items-center justify-center">
      <motion.div
        aria-hidden
        className="absolute"
        animate={{ borderRadius: BORDER_RADII, rotate: [0, 8, -6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 220, height: 220 }}
      >
        <motion.div
          className="h-full w-full"
          animate={{
            scale,
            background: isLow
              ? "radial-gradient(circle at 35% 30%, #f87171, #dc2626)"
              : "radial-gradient(circle at 35% 30%, #60a5fa, #3b82f6 55%, #a855f7)",
            boxShadow: isLow
              ? "0 0 60px -8px rgba(239,68,68,0.55)"
              : "0 0 60px -8px rgba(59,130,246,0.45)",
          }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ borderRadius: "inherit" }}
        />
      </motion.div>

      <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
        <span className="font-mono text-4xl font-semibold tabular-nums text-foreground drop-shadow-sm">
          {formatClock(remainingSeconds)}
        </span>
        {label && (
          <span className="mt-2 max-w-[160px] truncate text-xs text-foreground/70">{label}</span>
        )}
      </div>
    </div>
  );
}