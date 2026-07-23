"use client";

import { TimerRing } from "@/components/pomodoro/timer-ring";

interface TimerDisplayProps {
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
  /** Diameter in px — set in Focus Mode; omit on cards so the ring stays fluid. */
  size?: number;
}

export function TimerDisplay({ remainingSeconds, totalSeconds, label, size }: TimerDisplayProps) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-5">
      <TimerRing
        remainingSeconds={remainingSeconds}
        totalSeconds={totalSeconds}
        label={label}
        size={size}
      />
    </div>
  );
}
