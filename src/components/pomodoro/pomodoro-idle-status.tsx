"use client";

import { Timer } from "lucide-react";

/** Idle status shown above the start menu when no timer is active. */
export function PomodoroIdleStatus() {
  return (
    <div className="flex min-h-[200px] flex-1 flex-col items-center justify-end gap-3 pb-10 text-center sm:min-h-[240px]">
      <Timer className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">
        No timers running yet
      </p>
    </div>
  );
}
