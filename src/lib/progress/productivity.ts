import { daysSince } from "@/lib/kanban-utils";
import type { Objective, PomodoroSession } from "@/types";

const WINDOW_DAYS = 7;
const STREAK_HEALTH_CAP_DAYS = 14;

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Fraction (0-1) of the last 7 days that had at least some logged focus time. */
function focusConsistency(sessions: PomodoroSession[]): number {
  const activeDays = new Set(
    sessions
      .filter(
        (s) => s.type === "work" && s.durationMinutes > 0 && (daysSince(s.date) ?? Infinity) < WINDOW_DAYS
      )
      .map((s) => dayKey(new Date(s.date)))
  );
  return activeDays.size / WINDOW_DAYS;
}

/**
 * Fraction (0-1) of "should have happened this week" objectives that were
 * actually finished: completed-in-window / (completed-in-window + still-open
 * items that were due or scheduled in the window). No relevant objectives
 * at all is treated as fully productive rather than penalized.
 */
function objectiveThroughput(objectives: Objective[]): number {
  const now = Date.now();
  const completedInWindow = objectives.filter(
    (o) => o.status === "done" && o.completedAt && (daysSince(o.completedAt) ?? Infinity) < WINDOW_DAYS
  ).length;
  const openDueInWindow = objectives.filter((o) => {
    if (o.status !== "todo" && o.status !== "in-progress") return false;
    const overdue = o.dueDate && new Date(o.dueDate).getTime() <= now;
    const scheduledInWindow =
      o.scheduledStart && (daysSince(o.scheduledStart) ?? -1) >= 0 && (daysSince(o.scheduledStart) ?? Infinity) < WINDOW_DAYS;
    return Boolean(overdue || scheduledInWindow);
  }).length;

  const denominator = completedInWindow + openDueInWindow;
  return denominator === 0 ? 1 : completedInWindow / denominator;
}

/** Fraction (0-1) of a 14-day streak-health cap the current streak has reached. */
function streakHealth(currentStreak: number): number {
  return Math.min(currentStreak, STREAK_HEALTH_CAP_DAYS) / STREAK_HEALTH_CAP_DAYS;
}

export interface ProductivityInput {
  objectives: Objective[];
  sessions: PomodoroSession[];
  currentStreak: number;
}

/**
 * A single 0-100 readout of the last 7 days: 44% focus consistency, 33%
 * objective throughput, 22% streak health — the estimate-honesty component
 * from the original 40/30/20/10 split is deferred until estimates are
 * reliably tracked, so its weight is folded proportionally into the other
 * three (40/30/20 renormalized to sum to 1).
 */
export function computeProductivityIndex({ objectives, sessions, currentStreak }: ProductivityInput): number {
  const consistency = focusConsistency(sessions);
  const throughput = objectiveThroughput(objectives);
  const health = streakHealth(currentStreak);

  const score = consistency * (40 / 90) + throughput * (30 / 90) + health * (20 / 90);
  return Math.round(Math.min(1, Math.max(0, score)) * 100);
}
