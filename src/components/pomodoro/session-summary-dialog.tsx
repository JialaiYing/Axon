"use client";

import type { ReactNode } from "react";
import { Flame, Sparkles, Target, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface SessionSummaryStats {
  focusedMinutes: number;
  sessionXp: number;
  streakDays: number;
  tasksDoneToday: number;
  label: string;
}

interface SessionSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: SessionSummaryStats | null;
  onContinue: () => void;
}

/**
 * End-of-session recap shown after a Pomodoro completes. Surfaces streak and
 * XP from existing progress data so students get a retention nudge without a
 * new store.
 */
export function SessionSummaryDialog({
  open,
  onOpenChange,
  stats,
  onContinue,
}: SessionSummaryDialogProps) {
  if (!stats) return null;

  const streakNudge =
    stats.streakDays > 0
      ? `${stats.streakDays}-day streak — keep it going tomorrow.`
      : "Start a streak by focusing again tomorrow.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-accent-muted">
            <Sparkles className="h-4.5 w-4.5 text-accent" />
          </div>
          <DialogTitle>Session complete</DialogTitle>
          <DialogDescription>
            You focused on &ldquo;{stats.label}&rdquo;. Here&apos;s what you earned.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2.5">
          <SummaryTile
            icon={<Timer className="h-3.5 w-3.5" />}
            label="Focused"
            value={`${stats.focusedMinutes} min`}
          />
          <SummaryTile
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="XP earned"
            value={`+${stats.sessionXp}`}
          />
          <SummaryTile
            icon={<Target className="h-3.5 w-3.5" />}
            label="Tasks done today"
            value={String(stats.tasksDoneToday)}
          />
          <SummaryTile
            icon={<Flame className="h-3.5 w-3.5 text-warning" />}
            label="Streak"
            value={`${stats.streakDays} day${stats.streakDays === 1 ? "" : "s"}`}
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{streakNudge}</p>

        <DialogFooter>
          <Button onClick={onContinue} className="w-full sm:w-auto">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
