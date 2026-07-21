"use client";

import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimerRunStatus } from "@/types";

interface TimerControlsProps {
  status: TimerRunStatus;
  /** After a full run settles to Ready — Pause/Resume becomes Restart. */
  showRestart?: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRestart?: () => void;
}

/**
 * Per-instance controls for a single timer card / Focus Mode overlay.
 */
export function TimerControls({
  status,
  showRestart = false,
  onPause,
  onResume,
  onStop,
  onRestart,
}: TimerControlsProps) {
  if (status === "finished" && !showRestart) {
    return null;
  }

  if (showRestart) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onRestart}>
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </Button>
        <Button size="sm" variant="outline" onClick={onStop}>
          <Square className="h-3.5 w-3.5" />
          Stop
        </Button>
      </div>
    );
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
