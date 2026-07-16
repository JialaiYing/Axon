"use client";

import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimerRunStatus } from "@/types";

interface TimerControlsProps {
  status: TimerRunStatus;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

/**
 * Per-instance controls for a single timer card in the multi-timer grid.
 * Starting happens from the "new timer" config panel (an instance doesn't
 * exist yet at that point), so this only ever handles running/paused/finished.
 */
export function TimerControls({ status, onPause, onResume, onStop }: TimerControlsProps) {
  if (status === "finished") {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {status === "running" ? (
        <Button size="sm" variant="secondary" onClick={onPause}>
          <Pause className="h-3.5 w-3.5" />
          Pause
        </Button>
      ) : (
        <Button size="sm" onClick={onResume}>
          <Play className="h-3.5 w-3.5" />
          Resume
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={onStop}>
        <Square className="h-3.5 w-3.5" />
        Stop
      </Button>
    </div>
  );
}