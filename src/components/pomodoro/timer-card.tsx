"use client";

import { Target, Coffee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import { formatClock } from "@/lib/pomodoro-utils";
import type { PomodoroTimerInstance, TimerDisplayMode } from "@/types";

interface TimerCardProps {
  timer: PomodoroTimerInstance;
  remainingSeconds: number;
  displayMode: TimerDisplayMode;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function TimerCard({
  timer,
  remainingSeconds,
  displayMode,
  onPause,
  onResume,
  onStop,
}: TimerCardProps) {
  return (
    <Card className="glass flex flex-col items-center gap-4 p-6">
      <div className="flex w-full items-center justify-between gap-2">
        <Badge variant={timer.source === "objective" ? "accent" : "default"} className="gap-1">
          {timer.source === "objective" ? (
            <Target className="h-3 w-3" />
          ) : (
            <Coffee className="h-3 w-3" />
          )}
          {timer.source === "objective" ? "Objective" : "Personal"}
        </Badge>
        {timer.status === "finished" && (
          <span className="rounded-full bg-success-muted px-2 py-0.5 text-[10px] font-medium text-success">
            Finished
          </span>
        )}
        {timer.status === "paused" && (
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Paused
          </span>
        )}
      </div>

      <TimerDisplay
        mode={displayMode}
        onModeChange={() => {}}
        hideModeToggle
        remainingSeconds={remainingSeconds}
        totalSeconds={timer.durationSeconds || 1}
        label={timer.label}
      />

      {timer.status !== "finished" ? (
        <TimerControls status={timer.status} onPause={onPause} onResume={onResume} onStop={onStop} />
      ) : (
        <p className="text-xs text-muted-foreground">{formatClock(0)} left</p>
      )}
    </Card>
  );
}