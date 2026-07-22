"use client";

import { Target, Coffee, Maximize2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import MagicCard from "@/components/effects/magic-card";
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
    <MagicCard
      className="rounded-xl"
      enableStars={false}
      enableBorderGlow
      clickEffect={false}
      glowColor="94, 106, 210"
    >
      <Card className="glass relative flex flex-col items-center gap-4 border-0 bg-transparent p-6 shadow-none">
        <div className="flex w-full items-center justify-between gap-2">
          <Badge variant={timer.source === "objective" ? "accent" : "default"} className="gap-1">
            {timer.source === "objective" ? (
              <Target className="h-3 w-3" />
            ) : (
              <Coffee className="h-3 w-3" />
            )}
            {timer.source === "objective" ? "Objective" : "Personal"}
          </Badge>

          <div className="flex items-center gap-1.5">
            {timer.hasCompletedRun && atFullDuration && (
              <span className="rounded-pill bg-success-muted px-2 py-0.5 text-[10px] font-medium text-success">
                Ready
              </span>
            )}
            {showPausedBadge && (
              <span className="rounded-pill bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Paused
              </span>
            )}
            {!isFinished && !showRestart && (
              <button
                type="button"
                aria-label="Open focus mode"
                title="Focus mode"
                onClick={onFullscreen}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-all duration-200 hover:bg-surface hover:text-foreground active:scale-90"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <p
          className="w-full truncate px-1 text-center text-sm font-semibold tracking-tight text-foreground"
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
      </Card>
    </MagicCard>
  );
}
