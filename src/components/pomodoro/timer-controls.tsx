"use client";

import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimerStatus } from "@/hooks/use-pomodoro-timer";

interface TimerControlsProps {
  status: TimerStatus;
  canStart: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function TimerControls({
  status,
  canStart,
  onStart,
  onPause,
  onResume,
  onStop,
}: TimerControlsProps) {
  if (status === "idle" || status === "finished") {
    return (
      <Button size="lg" onClick={onStart} disabled={!canStart}>
        <Play className="h-4 w-4" />
        Start focus session
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {status === "running" ? (
        <Button size="lg" variant="secondary" onClick={onPause}>
          <Pause className="h-4 w-4" />
          Pause
        </Button>
      ) : (
        <Button size="lg" onClick={onResume}>
          <Play className="h-4 w-4" />
          Resume
        </Button>
      )}
      <Button size="lg" variant="outline" onClick={onStop}>
        <Square className="h-3.5 w-3.5" />
        Stop
      </Button>
    </div>
  );
}

export function RestartButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick}>
      <RotateCcw className="h-3.5 w-3.5" />
      Reset
    </Button>
  );
}