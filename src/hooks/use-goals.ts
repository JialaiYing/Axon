"use client";

import * as React from "react";
import { asArray, dedupeById, useLocalStorage } from "@/hooks/use-local-storage";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import {
  focusMinutesOnDate,
  localDateKey,
  makeHistoryEntry,
  mondayWeekKey,
  objectivesCompletedInWeek,
} from "@/lib/goals-utils";
import type { Goal, GoalHistoryEntry, Objective, PomodoroSession } from "@/types";

const GOALS_STORAGE_KEY = "axon:goals";
const HISTORY_STORAGE_KEY = "axon:goals:history";
const META_STORAGE_KEY = "axon:goals:meta";
const GOAL_TYPES = new Set(["daily", "weekly"]);

/** Well-known ids the dashboard Goals pulse and Goals page track live. */
export const DAILY_FOCUS_GOAL_ID = "goal-daily-focus";
export const WEEKLY_OBJECTIVES_GOAL_ID = "goal-weekly-objectives";

const DEFAULT_GOALS: Goal[] = [
  {
    id: DAILY_FOCUS_GOAL_ID,
    title: "Focus time",
    type: "daily",
    category: "study",
    tracking: "auto",
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
    category: "study",
    tracking: "auto",
    target: 5,
    unit: "objectives",
    progress: 0,
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface GoalsMeta {
  lastDailyKey: string | null;
  lastWeeklyKey: string | null;
}

const DEFAULT_META: GoalsMeta = { lastDailyKey: null, lastWeeklyKey: null };

function normalizeGoal(value: Goal): Goal | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const type = GOAL_TYPES.has(value.type) ? value.type : "daily";
  const target = typeof value.target === "number" && Number.isFinite(value.target) ? Math.max(1, Math.round(value.target)) : 1;
  const category = value.category === "personal" ? "personal" : "study";
  const tracking =
    value.tracking === "manual" || category === "personal" ? "manual" : "auto";
  const progress =
    tracking === "manual" && typeof value.progress === "number" && Number.isFinite(value.progress)
      ? Math.max(0, Math.round(value.progress))
      : 0;
  return {
    ...value,
    title: typeof value.title === "string" && value.title.trim() ? value.title : "Goal",
    type,
    category,
    tracking,
    target,
    unit: typeof value.unit === "string" && value.unit.trim() ? value.unit : "",
    progress,
    completed: progress >= target,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
}

function normalizeGoals(value: unknown): Goal[] {
  // Legacy: early builds stored a plain Goal[]. Current builds may still.
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { goals?: unknown }).goals)
      ? (value as { goals: Goal[] }).goals
      : [];

  const raw = dedupeById(asArray<Goal>(list))
    .map(normalizeGoal)
    .filter((goal): goal is Goal => goal !== null);
  const missing = DEFAULT_GOALS.filter((defaultGoal) => !raw.some((goal) => goal.id === defaultGoal.id));
  return [...raw, ...missing];
}

function normalizeHistoryEntry(value: GoalHistoryEntry): GoalHistoryEntry | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  if (!GOAL_TYPES.has(value.type)) return null;
  if (typeof value.goalId !== "string" || typeof value.periodKey !== "string") return null;
  const target =
    typeof value.target === "number" && Number.isFinite(value.target) ? Math.max(1, Math.round(value.target)) : 1;
  const progress =
    typeof value.progress === "number" && Number.isFinite(value.progress)
      ? Math.max(0, Math.round(value.progress))
      : 0;
  return {
    id: value.id,
    goalId: value.goalId,
    type: value.type,
    periodKey: value.periodKey,
    progress: Math.min(progress, target),
    target,
    hit: Boolean(value.hit) || progress >= target,
    recordedAt: typeof value.recordedAt === "string" ? value.recordedAt : new Date().toISOString(),
  };
}

function normalizeHistory(value: unknown): GoalHistoryEntry[] {
  return dedupeById(asArray<GoalHistoryEntry>(value))
    .map(normalizeHistoryEntry)
    .filter((entry): entry is GoalHistoryEntry => entry !== null)
    .sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

function normalizeMeta(value: unknown): GoalsMeta {
  if (!value || typeof value !== "object") return { ...DEFAULT_META };
  const v = value as GoalsMeta;
  return {
    lastDailyKey: typeof v.lastDailyKey === "string" ? v.lastDailyKey : null,
    lastWeeklyKey: typeof v.lastWeeklyKey === "string" ? v.lastWeeklyKey : null,
  };
}

function withLiveProgress(goal: Goal, todayFocusMinutes: number, weekCompletedCount: number): Goal {
  if (goal.tracking === "manual" || goal.category === "personal") {
    const progress = Math.min(goal.target, Math.max(0, goal.progress));
    return { ...goal, progress, completed: progress >= goal.target };
  }
  if (goal.id === DAILY_FOCUS_GOAL_ID) {
    const progress = Math.min(goal.target, todayFocusMinutes);
    return { ...goal, category: "study", tracking: "auto", progress, completed: progress >= goal.target };
  }
  if (goal.id === WEEKLY_OBJECTIVES_GOAL_ID) {
    const progress = Math.min(goal.target, weekCompletedCount);
    return { ...goal, category: "study", tracking: "auto", progress, completed: progress >= goal.target };
  }
  return goal;
}

/** Seed recent closed periods from activity so the history grid isn't empty on first visit. */
function seedHistoryFromActivity(
  existing: GoalHistoryEntry[],
  goals: Goal[],
  sessions: PomodoroSession[],
  objectives: Objective[],
  todayKey: string,
  weekKey: string
): GoalHistoryEntry[] {
  const byId = new Map(existing.map((e) => [e.id, e]));
  const daily = goals.find((g) => g.id === DAILY_FOCUS_GOAL_ID);
  const weekly = goals.find((g) => g.id === WEEKLY_OBJECTIVES_GOAL_ID);

  if (daily) {
    for (let i = 1; i <= 14; i++) {
      const d = new Date(`${todayKey}T12:00:00`);
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      const id = `${DAILY_FOCUS_GOAL_ID}:${key}`;
      if (byId.has(id)) continue;
      const progress = focusMinutesOnDate(sessions, key);
      // First-run backfill represents known activity, not account age.
      // Zero-activity periods are recorded only after tracking has begun.
      if (progress === 0) continue;
      byId.set(id, makeHistoryEntry(DAILY_FOCUS_GOAL_ID, "daily", key, progress, daily.target));
    }
  }

  if (weekly) {
    for (let i = 1; i <= 8; i++) {
      const monday = new Date(`${weekKey}T12:00:00`);
      monday.setDate(monday.getDate() - i * 7);
      const key = mondayWeekKey(monday);
      const id = `${WEEKLY_OBJECTIVES_GOAL_ID}:${key}`;
      if (byId.has(id)) continue;
      const progress = objectivesCompletedInWeek(objectives, key);
      if (progress === 0) continue;
      byId.set(id, makeHistoryEntry(WEEKLY_OBJECTIVES_GOAL_ID, "weekly", key, progress, weekly.target));
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

function mergeHistory(existing: GoalHistoryEntry[], incoming: GoalHistoryEntry[]): GoalHistoryEntry[] {
  const byId = new Map(existing.map((e) => [e.id, e]));
  for (const entry of incoming) {
    // Prefer an already-recorded snapshot (captures the target at reset time).
    if (!byId.has(entry.id)) byId.set(entry.id, entry);
  }
  return Array.from(byId.values()).sort((a, b) => b.periodKey.localeCompare(a.periodKey));
}

function closedDailyKeys(lastTrackedKey: string, todayKey: string): string[] {
  const cursor = new Date(`${lastTrackedKey}T12:00:00`);
  if (Number.isNaN(cursor.getTime())) return [];
  const keys: string[] = [];
  while (localDateKey(cursor) < todayKey) {
    keys.push(localDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function closedWeeklyKeys(lastTrackedKey: string, currentWeekKey: string): string[] {
  const cursor = new Date(`${lastTrackedKey}T12:00:00`);
  if (Number.isNaN(cursor.getTime())) return [];
  const keys: string[] = [];
  while (mondayWeekKey(cursor) < currentWeekKey) {
    keys.push(mondayWeekKey(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return keys;
}

export function useGoals() {
  const [rawGoals, setRawGoals, goalsHydrated] = useLocalStorage<Goal[]>(GOALS_STORAGE_KEY, DEFAULT_GOALS);
  const [rawHistory, setRawHistory, historyHydrated] = useLocalStorage<GoalHistoryEntry[]>(
    HISTORY_STORAGE_KEY,
    []
  );
  const [rawMeta, setRawMeta, metaHydrated] = useLocalStorage<GoalsMeta>(META_STORAGE_KEY, DEFAULT_META);

  const { objectives, hydrated: objectivesHydrated } = useObjectives();
  const { sessions, todayFocusMinutes, hydrated: sessionsHydrated } = usePomodoroSessions();

  const goalsBase = React.useMemo(() => normalizeGoals(rawGoals), [rawGoals]);
  const history = React.useMemo(() => normalizeHistory(rawHistory), [rawHistory]);
  const meta = React.useMemo(() => normalizeMeta(rawMeta), [rawMeta]);

  const todayKey = localDateKey();
  const weekKey = mondayWeekKey();

  const weekCompletedCount = React.useMemo(
    () => objectivesCompletedInWeek(objectives, weekKey),
    [objectives, weekKey]
  );

  const goals = React.useMemo(
    () => goalsBase.map((goal) => withLiveProgress(goal, todayFocusMinutes, weekCompletedCount)),
    [goalsBase, todayFocusMinutes, weekCompletedCount]
  );

  const dailyGoal = React.useMemo(() => goals.find((g) => g.id === DAILY_FOCUS_GOAL_ID) ?? null, [goals]);
  const weeklyGoal = React.useMemo(
    () => goals.find((g) => g.id === WEEKLY_OBJECTIVES_GOAL_ID) ?? null,
    [goals]
  );
  const personalGoals = React.useMemo(
    () => goals.filter((g) => g.category === "personal"),
    [goals]
  );

  const hydrated =
    goalsHydrated && historyHydrated && metaHydrated && objectivesHydrated && sessionsHydrated;

  // On period rollover: snapshot the closed day/week, then seed any missing recent history.
  React.useEffect(() => {
    if (!hydrated) return;

    const dailyTarget = goalsBase.find((g) => g.id === DAILY_FOCUS_GOAL_ID)?.target ?? 90;
    const weeklyTarget = goalsBase.find((g) => g.id === WEEKLY_OBJECTIVES_GOAL_ID)?.target ?? 5;

    const snapshots: GoalHistoryEntry[] = [];
    let nextMeta = { ...meta };
    let metaChanged = false;

    if (meta.lastDailyKey !== todayKey) {
      if (meta.lastDailyKey) {
        for (const closedKey of closedDailyKeys(meta.lastDailyKey, todayKey)) {
          snapshots.push(
            makeHistoryEntry(
              DAILY_FOCUS_GOAL_ID,
              "daily",
              closedKey,
              focusMinutesOnDate(sessions, closedKey),
              dailyTarget
            )
          );
        }
      }
      nextMeta.lastDailyKey = todayKey;
      metaChanged = true;
    }

    if (meta.lastWeeklyKey !== weekKey) {
      if (meta.lastWeeklyKey && meta.lastWeeklyKey !== weekKey) {
        for (const closedKey of closedWeeklyKeys(meta.lastWeeklyKey, weekKey)) {
          snapshots.push(
            makeHistoryEntry(
              WEEKLY_OBJECTIVES_GOAL_ID,
              "weekly",
              closedKey,
              objectivesCompletedInWeek(objectives, closedKey),
              weeklyTarget
            )
          );
        }
      }
      nextMeta.lastWeeklyKey = weekKey;
      metaChanged = true;
    }

    const seeded = seedHistoryFromActivity(
      mergeHistory(history, snapshots),
      goalsBase,
      sessions,
      objectives,
      todayKey,
      weekKey
    );

    const historyChanged =
      seeded.length !== history.length || seeded.some((entry, i) => entry.id !== history[i]?.id);

    if (historyChanged) setRawHistory(seeded);
    if (metaChanged) setRawMeta(nextMeta);
  }, [
    hydrated,
    meta,
    history,
    goalsBase,
    sessions,
    objectives,
    todayKey,
    weekKey,
    setRawHistory,
    setRawMeta,
  ]);

  const updateTarget = React.useCallback(
    (goalId: string, target: number) => {
      const nextTarget = Math.max(1, Math.round(target));
      setRawGoals((prev) =>
        normalizeGoals(prev).map((goal) => (goal.id === goalId ? { ...goal, target: nextTarget } : goal))
      );
    },
    [setRawGoals]
  );

  const addPersonalGoal = React.useCallback(
    (input: { title: string; type: "daily" | "weekly"; target: number; unit?: string }) => {
      const title = input.title.trim().slice(0, 120);
      if (!title) return null;
      const goal: Goal = {
        id: createId(),
        title,
        type: input.type,
        category: "personal",
        tracking: "manual",
        target: Math.max(1, Math.round(input.target)),
        unit: (input.unit ?? "").trim().slice(0, 24),
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setRawGoals((prev) => [...normalizeGoals(prev), goal]);
      return goal;
    },
    [setRawGoals]
  );

  const deleteGoal = React.useCallback(
    (goalId: string) => {
      if (goalId === DAILY_FOCUS_GOAL_ID || goalId === WEEKLY_OBJECTIVES_GOAL_ID) return;
      setRawGoals((prev) => normalizeGoals(prev).filter((g) => g.id !== goalId));
    },
    [setRawGoals]
  );

  const setManualProgress = React.useCallback(
    (goalId: string, progress: number) => {
      setRawGoals((prev) =>
        normalizeGoals(prev).map((goal) => {
          if (goal.id !== goalId || goal.tracking !== "manual") return goal;
          const next = Math.min(goal.target, Math.max(0, Math.round(progress)));
          return { ...goal, progress: next, completed: next >= goal.target };
        })
      );
    },
    [setRawGoals]
  );

  return {
    goals,
    dailyGoal,
    weeklyGoal,
    personalGoals,
    history,
    todayKey,
    weekKey,
    updateTarget,
    addPersonalGoal,
    deleteGoal,
    setManualProgress,
    hydrated,
  };
}
