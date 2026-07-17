"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, X, Target, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import type { PomodoroTimerInstance, TimerDisplayMode } from "@/types";

interface TimerFullscreenOverlayProps {
  timer: PomodoroTimerInstance | null;
  remainingSeconds: number;
  displayMode: TimerDisplayMode;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onCloseTimer: () => void;
  onExit: () => void;
}

export function TimerFullscreenOverlay({
  timer,
  remainingSeconds,
  displayMode,
  onPause,
  onResume,
  onStop,
  onCloseTimer,
  onExit,
}: TimerFullscreenOverlayProps) {
  React.useEffect(() => {
    if (!timer) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [timer, onExit]);

  return (
    <AnimatePresence>
      {timer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-2xl"
        >
          {timer.status === "finished" && (
            <button
              type="button"
              aria-label="Close finished timer"
              title="Close"
              onClick={() => {
                onCloseTimer();
                onExit();
              }}
              className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface text-muted shadow-sm transition-all duration-200 hover:scale-105 hover:border-danger/40 hover:bg-danger-muted hover:text-danger active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            aria-label="Exit fullscreen"
            title="Exit fullscreen"
            onClick={onExit}
            className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-all duration-200 hover:scale-105 hover:bg-card hover:text-foreground active:scale-95"
          >
            <Minimize2 className="h-4 w-4" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col items-center gap-6 px-6"
          >
            <Badge variant={timer.source === "objective" ? "accent" : "default"} className="gap-1">
              {timer.source === "objective" ? (
                <Target className="h-3 w-3" />
              ) : (
                <Coffee className="h-3 w-3" />
              )}
              {timer.source === "objective" ? "Objective" : "Personal"}
            </Badge>

            <h2 className="max-w-lg truncate px-4 text-center text-2xl font-semibold tracking-tight text-foreground">
              {timer.label}
            </h2>

            <TimerDisplay
              mode={displayMode}
              onModeChange={() => {}}
              hideModeToggle
              remainingSeconds={remainingSeconds}
              totalSeconds={timer.durationSeconds || 1}
              size={420}
            />

            {timer.status !== "finished" ? (
              <TimerControls status={timer.status} onPause={onPause} onResume={onResume} onStop={onStop} />
            ) : (
              <p className="text-sm text-muted-foreground">Session complete — close to dismiss.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
