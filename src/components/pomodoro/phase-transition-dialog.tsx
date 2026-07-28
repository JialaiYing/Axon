"use client";

import { Coffee, Play, SkipForward, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PomodoroPhase } from "@/types";

interface PhaseTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: PomodoroPhase;
  label: string;
  /** Next break is long when work just finished and cycle threshold is met. */
  nextBreakIsLong?: boolean;
  onStartBreak: () => void;
  onSkipBreak: () => void;
  onStartWork: () => void;
  onStopSession: () => void;
}

/**
 * Prompt-gated transition between work and break intervals.
 * Work complete → Start break / Skip break / Stop session.
 * Break complete → Start next work / Stop session.
 */
export function PhaseTransitionDialog({
  open,
  onOpenChange,
  phase,
  label,
  nextBreakIsLong = false,
  onStartBreak,
  onSkipBreak,
  onStartWork,
  onStopSession,
}: PhaseTransitionDialogProps) {
  const isWork = phase === "work";
  const breakLabel = nextBreakIsLong ? "long break" : "short break";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-border/50 text-muted-foreground light:border-border">
            <Coffee className="h-4 w-4" />
          </div>
          <DialogTitle>{isWork ? "Work interval complete" : "Break over"}</DialogTitle>
          <DialogDescription>
            {isWork
              ? `"${label}" finished. Take a ${breakLabel}, skip ahead, or end this session.`
              : `"${label}" break finished. Start the next work interval when you're ready.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" onClick={onStopSession} className="shadow-none sm:mr-auto">
            <Square className="h-3.5 w-3.5" />
            Stop session
          </Button>
          {isWork ? (
            <>
              <Button variant="secondary" onClick={onSkipBreak} className="shadow-none">
                <SkipForward className="h-3.5 w-3.5" />
                Skip break
              </Button>
              <Button onClick={onStartBreak} className="shadow-none">
                <Coffee className="h-3.5 w-3.5" />
                Start {nextBreakIsLong ? "long" : "short"} break
              </Button>
            </>
          ) : (
            <Button onClick={onStartWork} className="shadow-none">
              <Play className="h-3.5 w-3.5" />
              Start next work
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
