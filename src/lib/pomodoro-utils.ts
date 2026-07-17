import { remainingMinutes } from "@/lib/kanban-utils";
import type { Objective, PomodoroTimerInstance } from "@/types";
import type { StartTimerInput } from "@/hooks/use-pomodoro-timers";

export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const PERSONAL_TIMER_PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "15 min", minutes: 15 },
  { label: "5 min", minutes: 5 },
];

/** Whole minutes a fresh focus session for this objective should run — its remaining
 *  estimate if any time's already logged, otherwise its full estimate, otherwise a
 *  sane default. Falls back gracefully for zero/missing estimates. */
export function focusSessionMinutesFor(objective: Objective): number {
  const remaining = remainingMinutes(objective);
  if (remaining && remaining > 0) return remaining;
  return objective.estimatedStudyTime && objective.estimatedStudyTime > 0
    ? objective.estimatedStudyTime
    : 25;
}

export interface FocusSessionDeps {
  timers: PomodoroTimerInstance[];
  startObjectiveSession: (id: string) => void;
  startTimer: (input: StartTimerInput) => PomodoroTimerInstance;
  resumeTimer: (id: string) => void;
}

/** An objective-linked timer that's still live (running or paused). */
export function activeTimerForObjective(
  objectiveId: string,
  timers: PomodoroTimerInstance[]
): PomodoroTimerInstance | null {
  return timers.find((t) => t.objectiveId === objectiveId && t.status !== "finished") ?? null;
}

/**
 * The single entry point for starting/resuming a focus session tied to an
 * objective — used by both the Pomodoro page and the Calendar so neither
 * duplicates the other's timer logic. If a timer for this objective is
 * already running, it's left alone; if paused, it's resumed; otherwise a
 * fresh one is started using `durationMinutes` (falling back to the
 * estimate-aware default).
 */
export function startFocusSession(
  objective: Objective,
  deps: FocusSessionDeps,
  durationMinutes?: number
): PomodoroTimerInstance {
  const existing = activeTimerForObjective(objective.id, deps.timers);
  if (existing) {
    if (existing.status === "paused") deps.resumeTimer(existing.id);
    return existing;
  }
  deps.startObjectiveSession(objective.id);
  const minutes = durationMinutes && durationMinutes > 0 ? durationMinutes : focusSessionMinutesFor(objective);
  return deps.startTimer({
    source: "objective",
    label: objective.title,
    objectiveId: objective.id,
    durationSeconds: Math.round(minutes * 60),
  });
}
