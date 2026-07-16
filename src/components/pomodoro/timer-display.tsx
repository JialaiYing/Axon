"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gauge, Blend } from "lucide-react";
import { TimerRing } from "@/components/pomodoro/timer-ring";
import { TimerBlob } from "@/components/pomodoro/timer-blob";
import { cn } from "@/lib/utils";
import type { TimerDisplayMode } from "@/types";

interface TimerDisplayProps {
  mode: TimerDisplayMode;
  onModeChange: (mode: TimerDisplayMode) => void;
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
}

export function TimerDisplay({
  mode,
  onModeChange,
  remainingSeconds,
  totalSeconds,
  label,
}: TimerDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {mode === "digital" ? (
            <TimerRing remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} label={label} />
          ) : (
            <TimerBlob remainingSeconds={remainingSeconds} totalSeconds={totalSeconds} label={label} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => onModeChange("digital")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
            mode === "digital"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          )}
        >
          <Gauge className="h-3.5 w-3.5" />
          Digital
        </button>
        <button
          type="button"
          onClick={() => onModeChange("blob")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
            mode === "blob"
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          )}
        >
          <Blend className="h-3.5 w-3.5" />
          Blob
        </button>
      </div>
    </div>
  );
}