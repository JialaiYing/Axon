"use client";

import { TimerRing } from "@/components/pomodoro/timer-ring";

interface TimerDisplayProps {
  remainingSeconds: number;
  totalSeconds: number;
  label?: string;
  /** Diameter in px — larger in the Focus Mode overlay. */
  size?: number;
}

export function TimerDisplay({ remainingSeconds, totalSeconds, label, size }: TimerDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <TimerRing
        remainingSeconds={remainingSeconds}
        totalSeconds={totalSeconds}
        label={label}
        size={size}
      />
    </div>
  );
}
