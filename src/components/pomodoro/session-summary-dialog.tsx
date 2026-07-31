"use client";

import type { ReactNode } from "react";
import { Target, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StreakFlame } from "@/components/ui/streak-flame";

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
        <DialogHeader className="mb-3">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Session complete
          </DialogTitle>
          <DialogDescription className="text-[14px] text-muted-foreground">
            You focused on &ldquo;{stats.label}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2.5">
          <SummaryTile
            icon={<Timer className="h-3.5 w-3.5" />}
            label="Focused"
            value={`${stats.focusedMinutes} min`}
          />
          <SummaryTile
            icon={<span className="font-mono text-[12px] font-semibold">XP</span>}
            label="XP earned"
            value={`+${stats.sessionXp}`}
          />
          <SummaryTile
            icon={<Target className="h-3.5 w-3.5" />}
            label="Tasks done today"
            value={String(stats.tasksDoneToday)}
          />
          <SummaryTile
            icon={<StreakFlame days={stats.streakDays} size="sm" />}
            label="Streak"
            value={`${stats.streakDays} day${stats.streakDays === 1 ? "" : "s"}`}
          />
        </div>

        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{streakNudge}</p>

        <div className="mt-4">
          <Button onClick={onContinue} className="w-full shadow-none">
            Continue
          </Button>
        </div>
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
    <div className="rounded-md border border-border/50 px-3 py-2.5 light:border-border">
      <p className="flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
