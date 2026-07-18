"use client";

import * as React from "react";
import { asArray, dedupeById, useLocalStorage } from "@/hooks/use-local-storage";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { daysSince } from "@/lib/kanban-utils";
import type { Goal } from "@/types";

const STORAGE_KEY = "axon:goals";
const GOAL_TYPES = new Set(["daily", "weekly"]);

/** Well-known ids the dashboard's Goals pulse card knows how to compute live progress for. */
export const DAILY_FOCUS_GOAL_ID = "goal-daily-focus";
export const WEEKLY_OBJECTIVES_GOAL_ID = "goal-weekly-objectives";

const DEFAULT_GOALS: Goal[] = [
  {
    id: DAILY_FOCUS_GOAL_ID,
    title: "Focus time",
    type: "daily",
    target: 90,
    unit: "min",
    progress: 0,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: WEEKLY_OBJECTIVES_GOAL_ID,
    title: "Finish objectives",
    type: "weekly",
    target: 5,
    unit: "objectives",
    progress: 0,
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

function normalizeGoal(value: Goal): Goal | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const type = GOAL_TYPES.has(value.type) ? value.type : "daily";
  const target = typeof value.target === "number" && Number.isFinite(value.target) ? Math.max(1, value.target) : 1;
  return {
    ...value,
    title: typeof value.title === "string" && value.title.trim() ? value.title : "Goal",
    type,
    target,
    unit: typeof value.unit === "string" && value.unit.trim() ? value.unit : "",
    progress: 0,
    completed: false,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
}

function normalizeGoals(value: unknown): Goal[] {
  const raw = dedupeById(asArray<Goal>(value))
    .map(normalizeGoal)
    .filter((goal): goal is Goal => goal !== null);
  // Guarantees the two dashboard-tracked goals always exist, even for
  // users who first hydrated before they were introduced.
  const missing = DEFAULT_GOALS.filter((defaultGoal) => !raw.some((goal) => goal.id === defaultGoal.id));
  return [...raw, ...missing];
}

/**
 * Live-recomputes the two dashboard-tracked goals' progress from real
 * objective/session data on every read, rather than trusting a persisted
 * `progress` value that could drift. Trailing 7-day window, matching the
 * dashboard's "focus this week" chart and the productivity index.
 */
function withLiveProgress(goal: Goal, todayFocusMinutes: number, weeklyCompletedCount: number): Goal {
  if (goal.id === DAILY_FOCUS_GOAL_ID) {
    const progress = Math.min(goal.target, todayFocusMinutes);
    return { ...goal, progress, completed: progress >= goal.target };
  }
  if (goal.id === WEEKLY_OBJECTIVES_GOAL_ID) {
    const progress = Math.min(goal.target, weeklyCompletedCount);
    return { ...goal, progress, completed: progress >= goal.target };
  }
  return goal;
}

export function useGoals() {
  const [rawGoals, , goalsHydrated] = useLocalStorage<Goal[]>(STORAGE_KEY, DEFAULT_GOALS);
  const { objectives, hydrated: objectivesHydrated } = useObjectives();
  const { todayFocusMinutes, hydrated: sessionsHydrated } = usePomodoroSessions();

  const weeklyCompletedCount = React.useMemo(
    () =>
      objectives.filter(
        (o) => o.status === "done" && o.completedAt && (daysSince(o.completedAt) ?? Infinity) < 7
      ).length,
    [objectives]
  );

  const goals = React.useMemo(() => {
    return normalizeGoals(rawGoals).map((goal) => withLiveProgress(goal, todayFocusMinutes, weeklyCompletedCount));
  }, [rawGoals, todayFocusMinutes, weeklyCompletedCount]);

  const dailyGoal = React.useMemo(() => goals.find((g) => g.id === DAILY_FOCUS_GOAL_ID) ?? null, [goals]);
  const weeklyGoal = React.useMemo(() => goals.find((g) => g.id === WEEKLY_OBJECTIVES_GOAL_ID) ?? null, [goals]);

  return {
    goals,
    dailyGoal,
    weeklyGoal,
    hydrated: goalsHydrated && objectivesHydrated && sessionsHydrated,
  };
}
