import { isToday } from "@/lib/goals-utils";
import type { Objective, PomodoroSession } from "@/types";
import { objectiveCompletionXp, focusSessionXp, DAILY_ACTIVITY_BONUS_XP } from "./xp-rules";

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

  // Only fully-completed sessions actually pay XP (see awardFocusSessionXp),
  // so this stays `completed`-only even though streak/consistency now count
  // partial sessions too — otherwise this live readout would show XP that
  // was never actually credited to the persisted total.
  const sessionXp = sessions
    .filter((s) => s.completed && s.type === "work" && isToday(s.date))
    .reduce((sum, s) => sum + focusSessionXp(s.durationMinutes), 0);

  const hadActivityToday = objectiveXp > 0 || sessionXp > 0;
  return objectiveXp + sessionXp + (hadActivityToday ? DAILY_ACTIVITY_BONUS_XP : 0);
}
