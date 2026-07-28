"use client";

import { Target, Coffee, Maximize2 } from "lucide-react";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import { cn } from "@/lib/utils";
import { phaseLabel } from "@/lib/pomodoro-utils";
import type { PomodoroTimerInstance } from "@/types";

interface TimerCardProps {
  timer: PomodoroTimerInstance;
  remainingSeconds: number;
  cyclesBeforeLongBreak?: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart: () => void;
  onFullscreen: () => void;
  /** Compact secondary list under the hero timer. */
  compact?: boolean;
}

export function TimerCard({
  timer,
  remainingSeconds,
  cyclesBeforeLongBreak = 4,
  onPause,
  onResume,
  onStop,
  onRestart,
  onFullscreen,
  compact = false,
}: TimerCardProps) {
  const isFinished = timer.status === "finished";
  const atFullDuration =
    timer.status === "paused" && (timer.pausedRemainingSeconds ?? 0) >= timer.durationSeconds;
  const showRestart = isFinished || (Boolean(timer.hasCompletedRun) && atFullDuration);
  const showPausedBadge = timer.status === "paused" && !atFullDuration;
  const phase = timer.phase ?? "work";
  const cycleDisplay =
    phase === "work"
      ? `${Math.min(timer.cycleIndex + 1, cyclesBeforeLongBreak)}/${cyclesBeforeLongBreak}`
      : `${timer.cycleIndex}/${cyclesBeforeLongBreak}`;

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col items-center gap-3 overflow-hidden rounded-md border border-border/50 bg-card shadow-none light:border-border",
        compact ? "flex-row gap-3 p-3 sm:flex-col sm:items-center" : "p-4"
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
              "bg-wash text-muted-foreground"
            )}
          >
            {phase === "work" ? (
              timer.source === "objective" ? (
                <Target className="h-3 w-3" />
              ) : (
                <Coffee className="h-3 w-3" />
              )
            ) : (
              <Coffee className="h-3 w-3" />
            )}
            {phaseLabel(phase)}
          </span>
          <span className="rounded-md bg-wash px-2 py-0.5 font-mono text-[10px] font-medium tabular-nums text-muted-foreground">
            {cycleDisplay}
          </span>
        </div>

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

      {!compact && (
        <TimerDisplay
          remainingSeconds={isFinished ? timer.durationSeconds : remainingSeconds}
          totalSeconds={timer.durationSeconds || 1}
        />
      )}

      {compact && (
        <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
          {formatCompact(isFinished ? timer.durationSeconds : remainingSeconds)}
        </p>
      )}

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

function formatCompact(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
