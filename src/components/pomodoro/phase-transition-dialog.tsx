"use client";

import { Coffee, Play, SkipForward, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const breakKind = nextBreakIsLong ? "long" : "short";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isWork ? "Work interval complete" : "Break over"}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            {isWork
              ? "Take a break, skip ahead, or end this session."
              : "Start the next work interval when you’re ready."}
          </DialogDescription>
        </DialogHeader>

        <p
          className="truncate rounded-md border border-border/50 bg-wash/40 px-3 py-2.5 text-[14px] font-medium text-foreground light:border-border"
          title={label}
        >
          {label}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {isWork ? (
            <>
              <Button onClick={onStartBreak} className="w-full shadow-none">
                <Coffee className="h-3.5 w-3.5" />
                Start {breakKind} break
              </Button>
              <Button variant="secondary" onClick={onSkipBreak} className="w-full shadow-none">
                <SkipForward className="h-3.5 w-3.5" />
                Skip break
              </Button>
            </>
          ) : (
            <Button onClick={onStartWork} className="w-full shadow-none">
              <Play className="h-3.5 w-3.5" />
              Start next work
            </Button>
          )}
          <Button variant="outline" onClick={onStopSession} className="w-full shadow-none">
            <Square className="h-3.5 w-3.5" />
            Stop session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
