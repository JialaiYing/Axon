"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatClock } from "@/lib/pomodoro-utils";

interface TimerBlobProps {
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
  size?: number;
}

const BORDER_RADII = [
  "62% 38% 55% 45% / 55% 45% 55% 45%",
  "48% 52% 42% 58% / 58% 42% 58% 42%",
  "56% 44% 58% 42% / 46% 58% 42% 54%",
  "62% 38% 55% 45% / 55% 45% 55% 45%",
];

export function TimerBlob({ remainingSeconds, totalSeconds, size = 260 }: TimerBlobProps) {
  const prefersReducedMotion = useReducedMotion();
  const fraction = totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 1;
  const isLow = totalSeconds > 0 && fraction <= 0.1;
  // Never fully vanish — floor the scale so the blob stays visible until 0.
  const scale = 0.28 + fraction * 0.72;
  const blobSize = Math.round(size * (220 / 260));

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Ambient halo behind the blob, echoing the digital ring's glow for a consistent premium feel. */}
      <motion.div
        aria-hidden
        className="absolute rounded-full blur-3xl"
        animate={{
          background: isLow
            ? "radial-gradient(circle, rgba(239,68,68,0.2), transparent 70%)"
            : "radial-gradient(circle, rgba(94,106,210,0.16), transparent 70%)",
        }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ width: size * 0.9, height: size * 0.9 }}
      />

      <motion.div
        aria-hidden
        className="absolute rounded-[inherit] border border-white/15 bg-white/[0.025] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
        animate={
          prefersReducedMotion
            ? { borderRadius: BORDER_RADII[0], rotate: 0 }
            : { borderRadius: BORDER_RADII, rotate: [0, 5, -4, 0] }
        }
        transition={{ duration: 16, repeat: prefersReducedMotion ? 0 : Infinity, ease: "easeInOut" }}
        style={{ width: blobSize, height: blobSize }}
      >
        <motion.div
          className="relative h-full w-full overflow-hidden"
          animate={{
            scale,
            background: isLow
              ? "radial-gradient(circle at 32% 28%, #fca5a5, #ef4444 55%, #b91c1c)"
              : "radial-gradient(circle at 32% 28%, #a5b4fc, #5e6ad2 50%, #7c3aed)",
            boxShadow: isLow
              ? "inset 0 0 40px rgba(0,0,0,0.15), 0 0 70px -10px rgba(239,68,68,0.55)"
              : "inset 0 0 40px rgba(0,0,0,0.12), 0 0 70px -10px rgba(94,106,210,0.45)",
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ borderRadius: "inherit" }}
        >
          {/* Soft light-source glint for an organic, lit-from-above feel. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-[15%] -top-[20%] h-[60%] w-[60%] rounded-full bg-white/35 blur-2xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[12%] right-[10%] h-[22%] w-[22%] rounded-full border border-white/15 bg-white/10 blur-[1px]"
          />
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
        <span
          className="font-mono font-semibold tabular-nums tracking-[-0.04em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
          style={{ fontSize: size >= 400 ? "3.75rem" : "2.25rem" }}
        >
          {formatClock(remainingSeconds)}
        </span>
        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70">
          {isLow ? "Almost up" : "Remaining"}
        </span>
      </div>
    </div>
  );
}
