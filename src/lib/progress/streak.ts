import type { PomodoroSession } from "@/types";

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Consecutive days (ending today or yesterday) with at least some focused
 * work time logged. Shared by the dashboard and the XP engine so "streak"
 * only ever means one thing across the app. Counts a stopped-early session
 * just like a fully-finished one — the same real minutes already count
 * toward "Focus today"/goals, so a day with only partial sessions
 * shouldn't silently look inactive here.
 */
export function computeCurrentStreak(sessions: PomodoroSession[]): number {
  const activeDays = new Set(
    sessions
      .filter((s) => s.type === "work" && s.durationMinutes > 0)
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
