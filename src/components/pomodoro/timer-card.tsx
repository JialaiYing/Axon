"use client";

import { Target, Coffee, Maximize2 } from "lucide-react";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import { cn } from "@/lib/utils";
import type { PomodoroTimerInstance } from "@/types";

interface TimerCardProps {
  timer: PomodoroTimerInstance;
  remainingSeconds: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  onFullscreen: () => void;
}

export function TimerCard({
  timer,
  remainingSeconds,
  onPause,
  onResume,
  onStop,
  onRestart,
  onFullscreen,
}: TimerCardProps) {
  const isFinished = timer.status === "finished";
  const atFullDuration =
    timer.status === "paused" && (timer.pausedRemainingSeconds ?? 0) >= timer.durationSeconds;
  const showRestart = isFinished || (Boolean(timer.hasCompletedRun) && atFullDuration);
  const showPausedBadge = timer.status === "paused" && !atFullDuration;

  return (
    <div className="relative flex min-w-0 flex-col items-center gap-3 overflow-hidden rounded-md border border-border/50 bg-card p-4 shadow-none light:border-border">
      <div className="flex w-full items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
            "bg-wash text-muted-foreground"
          )}
        >
          {timer.source === "objective" ? (
            <Target className="h-3 w-3" />
          ) : (
            <Coffee className="h-3 w-3" />
          )}
          {timer.source === "objective" ? "Objective" : "Personal"}
        </span>

        <div className="flex items-center gap-1.5">
          {timer.hasCompletedRun && atFullDuration && (
            <span className="rounded-md bg-success-muted px-2 py-0.5 text-[10px] font-medium text-success">
              Ready
            </span>
          )}
          {showPausedBadge && (
            <span className="rounded-md bg-wash px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Paused
            </span>
          )}
          {!isFinished && !showRestart && (
            <button
              type="button"
              aria-label="Open focus mode"
              title="Focus mode"
              onClick={onFullscreen}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-wash hover:text-foreground active:scale-90"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p
        className="w-full truncate px-1 text-center text-[13px] font-medium tracking-tight text-foreground"
        title={timer.label}
      >
        {timer.label}
      </p>

      <TimerDisplay
        remainingSeconds={isFinished ? timer.durationSeconds : remainingSeconds}
        totalSeconds={timer.durationSeconds || 1}
      />

      <TimerControls
        status={timer.status}
        showRestart={showRestart}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
        onRestart={onRestart}
      />
    </div>
  );
}
