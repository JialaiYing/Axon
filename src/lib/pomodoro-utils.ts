import { remainingMinutes } from "@/lib/kanban-utils";
import { readFocusPreferences } from "@/hooks/use-focus-preferences";
import type { Objective, PomodoroPhase, PomodoroTimerInstance } from "@/types";
import type { StartTimerInput } from "@/hooks/use-pomodoro-timers";
import { elapsedMinutesOf } from "@/hooks/use-pomodoro-timers";

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

/** Matches the upper bound used by adjustTimerBy (8 hours). */
export const MAX_PERSONAL_TIMER_MINUTES = 8 * 60;
export const MIN_PERSONAL_TIMER_MINUTES = 1;

/**
 * Parses a typed/preset duration string into a safe whole-minute value.
 * Returns null for empty/invalid input so the UI can keep the draft
 * without coercing to 0 or NaN.
 */
export function parsePersonalMinutes(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < MIN_PERSONAL_TIMER_MINUTES || parsed > MAX_PERSONAL_TIMER_MINUTES) return null;
  return parsed;
}

/** Clamps a known numeric duration into the personal-timer range. */
export function clampPersonalMinutes(minutes: number, fallback = 25): number {
  if (!Number.isFinite(minutes)) return fallback;
  return Math.min(
    MAX_PERSONAL_TIMER_MINUTES,
    Math.max(MIN_PERSONAL_TIMER_MINUTES, Math.round(minutes))
  );
}

/** Whole minutes a fresh focus session for this objective should run — its remaining
 *  estimate if any time's already logged, otherwise its full estimate, otherwise a
 *  sane default. Falls back gracefully for zero/missing estimates.
 *  Prefer Settings work minutes via `readFocusPreferences().workMinutes`
 *  for new Pomodoro starts; kept for any estimate-display callers. */
export function focusSessionMinutesFor(objective: Objective): number {
  const remaining = remainingMinutes(objective);
  if (remaining && remaining > 0) return remaining;
  return objective.estimatedStudyTime && objective.estimatedStudyTime > 0
    ? objective.estimatedStudyTime
    : 25;
}

export function phaseLabel(phase: PomodoroPhase): string {
  switch (phase) {
    case "short-break":
      return "Short break";
    case "long-break":
      return "Long break";
    default:
      return "Work";
  }
}

/** True when the timer has settled after a full countdown and awaits a phase transition. */
export function isAwaitingPhaseTransition(timer: PomodoroTimerInstance): boolean {
  return Boolean(
    timer.hasCompletedRun &&
      timer.status === "paused" &&
      (timer.pausedRemainingSeconds ?? 0) >= timer.durationSeconds
  );
}

export interface FocusSessionDeps {
  timers: PomodoroTimerInstance[];
  startObjectiveSession: (id: string) => void;
  startTimer: (input: StartTimerInput) => PomodoroTimerInstance;
  resumeTimer: (id: string) => void;
  /** Required for single-timer displace when starting a different session. */
  stopTimer: (id: string) => number;
  removeTimer: (id: string) => void;
  /** Log partial work when an in-progress timer is replaced. */
  onDisplacedWork?: (timer: PomodoroTimerInstance, elapsedMinutes: number) => void;
}

/** An objective-linked timer that's still live (running or paused). */
export function activeTimerForObjective(
  objectiveId: string,
  timers: PomodoroTimerInstance[]
): PomodoroTimerInstance | null {
  return timers.find((t) => t.objectiveId === objectiveId && t.status !== "finished") ?? null;
}

/**
 * Clear any other active timer before starting a new one (single-timer rule).
 * Logs partial work for mid-run work intervals; Ready intervals were already logged.
 */
export function displaceOtherTimers(
  timers: PomodoroTimerInstance[],
  keepObjectiveId: string | undefined,
  deps: Pick<FocusSessionDeps, "stopTimer" | "removeTimer" | "onDisplacedWork">
) {
  for (const t of timers) {
    if (t.status === "finished") continue;
    if (keepObjectiveId && t.objectiveId === keepObjectiveId) continue;

    if (isAwaitingPhaseTransition(t)) {
      // Completion already claimed by the notifications watcher.
      deps.removeTimer(t.id);
      continue;
    }

    const elapsed = elapsedMinutesOf(t);
    deps.stopTimer(t.id);
    if (elapsed > 0 && (t.phase ?? "work") === "work") {
      deps.onDisplacedWork?.(t, elapsed);
    }
  }
}

/**
 * The single entry point for starting/resuming a focus session tied to an
 * objective — used by both the Pomodoro page and the Calendar so neither
 * duplicates the other's timer logic. If a timer for this objective is
 * already running, it's left alone; if paused mid-run, it's resumed; otherwise
 * any other timer is displaced and a fresh Settings-length work interval starts.
 */
export function startFocusSession(
  objective: Objective,
  deps: FocusSessionDeps,
  _durationMinutes?: number
): PomodoroTimerInstance {
  const existing = activeTimerForObjective(objective.id, deps.timers);
  if (existing) {
    if (existing.status === "paused" && !isAwaitingPhaseTransition(existing)) {
      deps.resumeTimer(existing.id);
    }
    return existing;
  }

  displaceOtherTimers(deps.timers, undefined, deps);

  deps.startObjectiveSession(objective.id);
  const prefs = readFocusPreferences();
  return deps.startTimer({
    source: "objective",
    label: objective.title,
    objectiveId: objective.id,
    durationSeconds: Math.round(prefs.workMinutes * 60),
    phase: "work",
    cycleIndex: 0,
  });
}
