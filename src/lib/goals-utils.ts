import type { Goal, GoalHistoryEntry, Objective, PomodoroSession } from "@/types";

export type GoalPaceStatus = "done" | "on-track" | "behind";

export const PACE_LABEL: Record<GoalPaceStatus, string> = {
  done: "Done",
  "on-track": "On track",
  behind: "Behind",
};

/** Local calendar date key `YYYY-MM-DD`. */
export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Monday 00:00 local for the week containing `date`. */
export function startOfMonday(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d;
}

/** Week key = Monday's local date key. */
export function mondayWeekKey(date = new Date()): string {
  return localDateKey(startOfMonday(date));
}

/**
 * True when `iso` — a full ISO timestamp or a bare `YYYY-MM-DD` date — falls
 * on `reference`'s local calendar day (default: now). Bare dates are parsed
 * as local midnight rather than UTC midnight, so they can't land on the
 * wrong day for users west of UTC. Single shared definition of "today" for
 * the dashboard, Pomodoro sessions, and the XP engine, so they can never
 * quietly disagree with each other.
 */
export function isToday(iso: string | undefined, reference = new Date()): boolean {
  if (!iso) return false;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = dateOnly ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

/** Fraction of the local day that has elapsed (0–1). */
export function dayElapsedFraction(now = new Date()): number {
  const ms =
    now.getHours() * 3_600_000 +
    now.getMinutes() * 60_000 +
    now.getSeconds() * 1_000 +
    now.getMilliseconds();
  return Math.min(1, Math.max(0, ms / 86_400_000));
}

/** Fraction of the Monday-start calendar week that has elapsed (0–1). */
export function weekElapsedFraction(now = new Date()): number {
  const monday = startOfMonday(now);
  const msIntoWeek = now.getTime() - monday.getTime();
  return Math.min(1, Math.max(0, msIntoWeek / (7 * 86_400_000)));
}

export function goalPaceStatus(goal: Goal, elapsedFraction: number): GoalPaceStatus {
  if (goal.completed || (goal.target > 0 && goal.progress >= goal.target)) return "done";
  const progressFraction = goal.target > 0 ? goal.progress / goal.target : 0;
  return progressFraction + 0.02 >= elapsedFraction ? "on-track" : "behind";
}

export function focusMinutesOnDate(sessions: PomodoroSession[], dateKey: string): number {
  return sessions
    .filter((s) => s.type === "work" && s.durationMinutes > 0 && localDateKey(new Date(s.date)) === dateKey)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

/**
 * Count objectives completed within the Monday-start week identified by
 * `weekKey`. Counts "recycled" objectives too (as long as they carry a
 * `completedAt` in-window) — an objective auto-recycles 7 days after
 * completion, which is exactly one goals-week later, so requiring the
 * current status to still be "done" would let a completed item silently
 * drop out of last week's count the moment it's archived. `completedAt` is
 * only ever set while an objective is (or once was) actually done, so this
 * can't pick up an objective that was later reverted to todo/in-progress.
 */
export function objectivesCompletedInWeek(objectives: Objective[], weekKey: string): number {
  const monday = new Date(`${weekKey}T00:00:00`);
  if (Number.isNaN(monday.getTime())) return 0;
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const start = monday.getTime();
  const end = nextMonday.getTime();

  return objectives.filter((o) => {
    if ((o.status !== "done" && o.status !== "recycled") || !o.completedAt) return false;
    const t = new Date(o.completedAt).getTime();
    return t >= start && t < end;
  }).length;
}

export function createHistoryId(goalId: string, periodKey: string): string {
  return `${goalId}:${periodKey}`;
}

export function makeHistoryEntry(
  goalId: string,
  type: Goal["type"],
  periodKey: string,
  progress: number,
  target: number
): GoalHistoryEntry {
  const capped = Math.min(Math.max(0, progress), Math.max(1, target));
  return {
    id: createHistoryId(goalId, periodKey),
    goalId,
    type,
    periodKey,
    progress: capped,
    target: Math.max(1, target),
    hit: progress >= target,
    recordedAt: new Date().toISOString(),
  };
}

/** Previous local calendar day key. */
export function previousDateKey(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
}

/** Previous Monday week key. */
export function previousWeekKey(weekKey: string): string {
  const d = new Date(`${weekKey}T12:00:00`);
  d.setDate(d.getDate() - 7);
  return mondayWeekKey(d);
}

export function formatPeriodLabel(type: Goal["type"], periodKey: string): string {
  const d = new Date(`${periodKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return periodKey;
  if (type === "daily") {
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  return `Week of ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function streakFromHistory(entries: GoalHistoryEntry[], type: Goal["type"]): {
  current: number;
  best: number;
} {
  const sorted = entries
    .filter((e) => e.type === type)
    .slice()
    .sort((a, b) => b.periodKey.localeCompare(a.periodKey));

  let current = 0;
  for (const entry of sorted) {
    if (!entry.hit) break;
    current += 1;
  }

  let best = 0;
  let run = 0;
  // Chronological for best streak
  for (const entry of sorted.slice().reverse()) {
    if (entry.hit) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  return { current, best: Math.max(best, current) };
}
