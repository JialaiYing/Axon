"use client";

import { Target, Coffee, Maximize2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import MagicCard from "@/components/effects/magic-card";
import { formatClock } from "@/lib/pomodoro-utils";
import { cn } from "@/lib/utils";
import type { PomodoroTimerInstance, TimerDisplayMode } from "@/types";

interface TimerCardProps {
  timer: PomodoroTimerInstance;
  remainingSeconds: number;
  displayMode: TimerDisplayMode;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClose: () => void;
  onFullscreen: () => void;
}

export function TimerCard({
  timer,
  remainingSeconds,
  displayMode,
  onPause,
  onResume,
  onStop,
  onClose,
  onFullscreen,
}: TimerCardProps) {
  const isFinished = timer.status === "finished";

  return (
    <MagicCard
      className="rounded-xl"
      enableStars
      enableBorderGlow
      clickEffect
      particleCount={10}
      glowColor="91, 141, 239"
    >
      <Card className="glass relative flex flex-col items-center gap-4 border-0 bg-transparent p-6 shadow-none">
        {isFinished && (
          <button
            type="button"
            aria-label="Close finished timer"
            title="Close"
            onClick={onClose}
            className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border-strong bg-surface text-muted shadow-sm transition-all duration-200 hover:scale-105 hover:border-danger/40 hover:bg-danger-muted hover:text-danger active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <div className={cn("flex w-full items-center justify-between gap-2", isFinished && "pl-8")}>
          <Badge variant={timer.source === "objective" ? "accent" : "default"} className="gap-1">
            {timer.source === "objective" ? (
              <Target className="h-3 w-3" />
            ) : (
              <Coffee className="h-3 w-3" />
            )}
            {timer.source === "objective" ? "Objective" : "Personal"}
          </Badge>

          <div className="flex items-center gap-1.5">
            {isFinished && (
              <span className="rounded-full bg-success-muted px-2 py-0.5 text-[10px] font-medium text-success">
                Finished
              </span>
            )}
            {timer.status === "paused" && (
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Paused
              </span>
            )}
            <button
              type="button"
              aria-label="Open fullscreen"
              title="Fullscreen"
              onClick={onFullscreen}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-all duration-200 hover:bg-surface hover:text-foreground active:scale-90"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <p
          className="w-full truncate px-1 text-center text-sm font-semibold tracking-tight text-foreground"
          title={timer.label}
        >
          {timer.label}
        </p>

        <TimerDisplay
          mode={displayMode}
          onModeChange={() => {}}
          hideModeToggle
          remainingSeconds={remainingSeconds}
          totalSeconds={timer.durationSeconds || 1}
        />

        {!isFinished ? (
          <TimerControls status={timer.status} onPause={onPause} onResume={onResume} onStop={onStop} />
        ) : (
          <p className="text-xs text-muted-foreground">{formatClock(0)} left</p>
        )}
      </Card>
    </MagicCard>
  );
}
