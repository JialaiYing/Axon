import type { PomodoroSession } from "@/types";

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Consecutive days (ending today or yesterday) with at least one completed
 * work session. Shared by the dashboard and the XP engine so "streak" only
 * ever means one thing across the app.
 */
export function computeCurrentStreak(sessions: PomodoroSession[]): number {
  const activeDays = new Set(
    sessions
      .filter((s) => s.completed && s.type === "work")
      .map((s) => dayKey(new Date(s.date)))
  );
  let streak = 0;
  const cursor = new Date();
  // A streak survives if today has no activity yet but yesterday does.
  if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
