import type { Objective, PomodoroSession } from "@/types";
import { objectiveCompletionXp, focusSessionXp, DAILY_ACTIVITY_BONUS_XP } from "./xp-rules";

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Live readout of XP earned today, recomputed straight from today's
 * completed objectives and work sessions (same formulas the persisted
 * store awards with) — purely derived, so it can never drift out of sync
 * or need its own bookkeeping.
 */
export function computeTodayXp(
  objectives: Objective[],
  sessions: PomodoroSession[],
  currentStreak: number
): number {
  const objectiveXp = objectives
    .filter((o) => o.status === "done" && isToday(o.completedAt))
    .reduce(
      (sum, o) =>
        sum +
        objectiveCompletionXp({
          priority: o.priority,
          dueDate: o.dueDate,
          completedAt: o.completedAt!,
          streak: currentStreak,
        }),
      0
    );

  const sessionXp = sessions
    .filter((s) => s.completed && s.type === "work" && isToday(s.date))
    .reduce((sum, s) => sum + focusSessionXp(s.durationMinutes), 0);

  const hadActivityToday = objectiveXp > 0 || sessionXp > 0;
  return objectiveXp + sessionXp + (hadActivityToday ? DAILY_ACTIVITY_BONUS_XP : 0);
}
