"use client";

import * as React from "react";
import { asArray, dedupeById, useLocalStorage } from "@/hooks/use-local-storage";
import { useObjectives } from "@/hooks/use-objectives";
import {
  localDateKey,
  makeHistoryEntry,
  mondayWeekKey,
  nextDateKey,
  nextWeekKey,
  objectivesCompletedInWeek,
  objectivesCompletedOnDate,
} from "@/lib/goals-utils";
import { recordTombstone } from "@/lib/sync/tombstones";
import type { Goal, GoalHistoryEntry, Objective } from "@/types";

const GOALS_STORAGE_KEY = "axon:goals";
const HISTORY_STORAGE_KEY = "axon:goals:history";
const META_STORAGE_KEY = "axon:goals:meta";
const GOAL_TYPES = new Set(["daily", "weekly"]);

/** Fixed system defaults (M1 goals simplification). */
export const DAILY_OBJECTIVES_TARGET = 3;
export const WEEKLY_OBJECTIVES_TARGET = 15;

/**
 * Well-known id for the daily study goal.
 * String kept as `goal-daily-focus` for localStorage / sync stability after
 * the focus-minutes → objectives migration.
 */
export const DAILY_OBJECTIVES_GOAL_ID = "goal-daily-focus";

export const WEEKLY_OBJECTIVES_GOAL_ID = "goal-weekly-objectives";

const DEFAULT_GOALS: Goal[] = [
  {
    id: DAILY_OBJECTIVES_GOAL_ID,
    title: "Complete 3 objectives",
    type: "daily",
    category: "study",
    tracking: "auto",
    target: DAILY_OBJECTIVES_TARGET,
    unit: "objectives",
    progress: 0,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: WEEKLY_OBJECTIVES_GOAL_ID,
    title: "Complete 15 objectives",
    type: "weekly",
    category: "study",
    tracking: "auto",
    target: WEEKLY_OBJECTIVES_TARGET,
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
  const target =
    typeof value.target === "number" && Number.isFinite(value.target)
      ? Math.max(1, Math.round(value.target))
      : 1;
  const category = value.category === "personal" ? "personal" : "study";
  const tracking =
    value.tracking === "manual" || category === "personal" ? "manual" : "auto";
  const progress =
    tracking === "manual" && typeof value.progress === "number" && Number.isFinite(value.progress)
      ? Math.max(0, Math.round(value.progress))
      : 0;
  const streak =
    category === "personal" && typeof value.streak === "number" && Number.isFinite(value.streak)
      ? Math.max(0, Math.round(value.streak))
      : category === "personal"
        ? 0
        : undefined;
  const periodKey =
    category === "personal" && typeof value.periodKey === "string" && value.periodKey
      ? value.periodKey
      : undefined;
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
    streak,
    periodKey,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : typeof value.createdAt === "string"
          ? value.createdAt
          : new Date().toISOString(),
  };
}

/** Force fixed study goals every read so old focus-minute / custom targets can't stick. */
function applyFixedStudyGoals(goals: Goal[]): Goal[] {
  return goals.map((goal) => {
    if (goal.id === DAILY_OBJECTIVES_GOAL_ID) {
      const needsMigration =
        goal.title !== "Complete 3 objectives" ||
        goal.target !== DAILY_OBJECTIVES_TARGET ||
        goal.unit !== "objectives" ||
        goal.type !== "daily" ||
        goal.category !== "study" ||
        goal.tracking !== "auto";
      return {
        ...goal,
        title: "Complete 3 objectives",
        type: "daily",
        category: "study",
        tracking: "auto",
        target: DAILY_OBJECTIVES_TARGET,
        unit: "objectives",
        progress: 0,
        completed: false,
        updatedAt: needsMigration ? new Date().toISOString() : goal.updatedAt ?? goal.createdAt,
      };
    }
    if (goal.id === WEEKLY_OBJECTIVES_GOAL_ID) {
      const needsMigration =
        goal.title !== "Complete 15 objectives" ||
        goal.target !== WEEKLY_OBJECTIVES_TARGET ||
        goal.unit !== "objectives" ||
        goal.type !== "weekly" ||
        goal.category !== "study" ||
        goal.tracking !== "auto";
      return {
        ...goal,
        title: "Complete 15 objectives",
        type: "weekly",
        category: "study",
        tracking: "auto",
        target: WEEKLY_OBJECTIVES_TARGET,
        unit: "objectives",
        progress: 0,
        completed: false,
        updatedAt: needsMigration ? new Date().toISOString() : goal.updatedAt ?? goal.createdAt,
      };
    }
    return goal;
  });
}

function studyGoalShapeMatches(goal: Goal | undefined, expected: Goal): boolean {
  if (!goal) return false;
  return (
    goal.title === expected.title &&
    goal.target === expected.target &&
    goal.unit === expected.unit &&
    goal.type === expected.type &&
    goal.category === "study" &&
    goal.tracking === "auto"
  );
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
  return applyFixedStudyGoals([...raw, ...missing]);
}

function normalizeHistoryEntry(value: GoalHistoryEntry): GoalHistoryEntry | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  if (!GOAL_TYPES.has(value.type)) return null;
  if (typeof value.goalId !== "string" || typeof value.periodKey !== "string") return null;
  const target =
    typeof value.target === "number" && Number.isFinite(value.target)
      ? Math.max(1, Math.round(value.target))
      : 1;
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

/**
 * Drop legacy focus-minute daily history and pre-M1 weekly rows with custom targets.
 */
function scrubLegacyFocusHistory(entries: GoalHistoryEntry[]): GoalHistoryEntry[] {
  return entries.filter((entry) => {
    if (entry.goalId === DAILY_OBJECTIVES_GOAL_ID && entry.type === "daily") {
      return entry.target === DAILY_OBJECTIVES_TARGET;
    }
    if (entry.goalId === WEEKLY_OBJECTIVES_GOAL_ID && entry.type === "weekly") {
      return entry.target === WEEKLY_OBJECTIVES_TARGET;
    }
    return true;
  });
}

function parseHistoryEntries(value: unknown): GoalHistoryEntry[] {
  return dedupeById(asArray<GoalHistoryEntry>(value))
    .map(normalizeHistoryEntry)
    .filter((entry): entry is GoalHistoryEntry => entry !== null);
}

function normalizeHistory(value: unknown): GoalHistoryEntry[] {
  return scrubLegacyFocusHistory(parseHistoryEntries(value)).sort((a, b) =>
    b.periodKey.localeCompare(a.periodKey)
  );
}

function normalizeMeta(value: unknown): GoalsMeta {
  if (!value || typeof value !== "object") return { ...DEFAULT_META };
  const v = value as GoalsMeta;
  return {
    lastDailyKey: typeof v.lastDailyKey === "string" ? v.lastDailyKey : null,
    lastWeeklyKey: typeof v.lastWeeklyKey === "string" ? v.lastWeeklyKey : null,
  };
}

function withLiveProgress(
  goal: Goal,
  todayCompletedCount: number,
  weekCompletedCount: number
): Goal {
  if (goal.tracking === "manual" || goal.category === "personal") {
    const progress = Math.min(goal.target, Math.max(0, goal.progress));
    return { ...goal, progress, completed: progress >= goal.target };
  }
  if (goal.id === DAILY_OBJECTIVES_GOAL_ID) {
    const progress = Math.min(goal.target, todayCompletedCount);
    return {
      ...goal,
      category: "study",
      tracking: "auto",
      progress,
      completed: progress >= goal.target,
    };
  }
  if (goal.id === WEEKLY_OBJECTIVES_GOAL_ID) {
    const progress = Math.min(goal.target, weekCompletedCount);
    return {
      ...goal,
      category: "study",
      tracking: "auto",
      progress,
      completed: progress >= goal.target,
    };
  }
  return goal;
}

/** Seed recent closed periods from objective activity. */
function seedHistoryFromActivity(
  existing: GoalHistoryEntry[],
  goals: Goal[],
  objectives: Objective[],
  todayKey: string,
  weekKey: string
): GoalHistoryEntry[] {
  const byId = new Map(existing.map((e) => [e.id, e]));
  const daily = goals.find((g) => g.id === DAILY_OBJECTIVES_GOAL_ID);
  const weekly = goals.find((g) => g.id === WEEKLY_OBJECTIVES_GOAL_ID);

  if (daily) {
    for (let i = 1; i <= 14; i++) {
      const d = new Date(`${todayKey}T12:00:00`);
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      const id = `${DAILY_OBJECTIVES_GOAL_ID}:${key}`;
      if (byId.has(id)) continue;
      const progress = objectivesCompletedOnDate(objectives, key);
      // First-run backfill represents known activity, not account age.
      if (progress === 0) continue;
      byId.set(
        id,
        makeHistoryEntry(DAILY_OBJECTIVES_GOAL_ID, "daily", key, progress, daily.target)
      );
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
      byId.set(
        id,
        makeHistoryEntry(WEEKLY_OBJECTIVES_GOAL_ID, "weekly", key, progress, weekly.target)
      );
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

/**
 * Rolls a personal goal into the current period.
 * Hit → streak + 1; miss or skipped periods → streak resets.
 * Progress resets for the new period.
 */
function rolloverPersonalGoal(goal: Goal, todayKey: string, weekKey: string): Goal {
  if (goal.category !== "personal" || goal.tracking !== "manual") return goal;

  const currentKey = goal.type === "daily" ? todayKey : weekKey;
  const streak = goal.streak ?? 0;

  // Legacy goals without periodKey: infer from last update, then roll forward.
  if (!goal.periodKey) {
    const stamp = goal.updatedAt ?? goal.createdAt;
    const stampDate = new Date(stamp);
    const inferred = Number.isNaN(stampDate.getTime())
      ? currentKey
      : goal.type === "daily"
        ? localDateKey(stampDate)
        : mondayWeekKey(stampDate);
    return rolloverPersonalGoal({ ...goal, periodKey: inferred }, todayKey, weekKey);
  }

  if (goal.periodKey === currentKey) return goal;

  // Close the period that still holds progress.
  let nextStreak = goal.progress >= goal.target ? streak + 1 : 0;

  // Any skipped periods between then and now are misses.
  let cursor =
    goal.type === "daily" ? nextDateKey(goal.periodKey) : nextWeekKey(goal.periodKey);
  while (cursor < currentKey) {
    nextStreak = 0;
    cursor = goal.type === "daily" ? nextDateKey(cursor) : nextWeekKey(cursor);
  }

  return {
    ...goal,
    progress: 0,
    completed: false,
    streak: nextStreak,
    periodKey: currentKey,
    updatedAt: new Date().toISOString(),
  };
}

export function useGoals() {
  const [rawGoals, setRawGoals, goalsHydrated] = useLocalStorage<Goal[]>(GOALS_STORAGE_KEY, DEFAULT_GOALS);
  const [rawHistory, setRawHistory, historyHydrated] = useLocalStorage<GoalHistoryEntry[]>(
    HISTORY_STORAGE_KEY,
    []
  );
  const [rawMeta, setRawMeta, metaHydrated] = useLocalStorage<GoalsMeta>(META_STORAGE_KEY, DEFAULT_META);
  const [clockMs, setClockMs] = React.useState(() => Date.now());

  const { objectives, hydrated: objectivesHydrated } = useObjectives();

  // Refresh period keys when the tab stays open past midnight / Monday.
  React.useEffect(() => {
    const tick = () => setClockMs(Date.now());
    const interval = setInterval(tick, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const goalsBase = React.useMemo(() => normalizeGoals(rawGoals), [rawGoals]);
  const history = React.useMemo(() => normalizeHistory(rawHistory), [rawHistory]);
  const meta = React.useMemo(() => normalizeMeta(rawMeta), [rawMeta]);

  const todayKey = localDateKey(new Date(clockMs));
  const weekKey = mondayWeekKey(new Date(clockMs));

  const todayCompletedCount = React.useMemo(
    () => objectivesCompletedOnDate(objectives, todayKey),
    [objectives, todayKey]
  );
  const weekCompletedCount = React.useMemo(
    () => objectivesCompletedInWeek(objectives, weekKey),
    [objectives, weekKey]
  );

  // Rollover personal goals in the render path so UI never shows a stale period.
  const goals = React.useMemo(
    () =>
      goalsBase
        .map((goal) => rolloverPersonalGoal(goal, todayKey, weekKey))
        .map((goal) => withLiveProgress(goal, todayCompletedCount, weekCompletedCount)),
    [goalsBase, todayKey, weekKey, todayCompletedCount, weekCompletedCount]
  );

  const dailyGoal = React.useMemo(
    () => goals.find((g) => g.id === DAILY_OBJECTIVES_GOAL_ID) ?? null,
    [goals]
  );
  const weeklyGoal = React.useMemo(
    () => goals.find((g) => g.id === WEEKLY_OBJECTIVES_GOAL_ID) ?? null,
    [goals]
  );
  const personalGoals = React.useMemo(
    () => goals.filter((g) => g.category === "personal"),
    [goals]
  );

  const hydrated = goalsHydrated && historyHydrated && metaHydrated && objectivesHydrated;

  // Persist scrubbed focus-minute history + tombstone dropped ids so sync can't resurrect them.
  React.useEffect(() => {
    if (!historyHydrated) return;
    const parsed = parseHistoryEntries(rawHistory);
    const scrubbed = scrubLegacyFocusHistory(parsed);
    if (scrubbed.length === parsed.length) return;
    const keep = new Set(scrubbed.map((e) => e.id));
    for (const entry of parsed) {
      if (!keep.has(entry.id)) recordTombstone(HISTORY_STORAGE_KEY, entry.id);
    }
    setRawHistory(scrubbed.sort((a, b) => b.periodKey.localeCompare(a.periodKey)));
  }, [historyHydrated, rawHistory, setRawHistory]);

  // Persist fixed study-goal shape so sync / other devices don't keep focus-minute titles.
  React.useEffect(() => {
    if (!goalsHydrated) return;
    const daily = DEFAULT_GOALS.find((g) => g.id === DAILY_OBJECTIVES_GOAL_ID)!;
    const weekly = DEFAULT_GOALS.find((g) => g.id === WEEKLY_OBJECTIVES_GOAL_ID)!;
    const rawNormalized = normalizeGoals(rawGoals);
    const dailyOk = studyGoalShapeMatches(
      rawNormalized.find((g) => g.id === DAILY_OBJECTIVES_GOAL_ID),
      daily
    );
    const weeklyOk = studyGoalShapeMatches(
      rawNormalized.find((g) => g.id === WEEKLY_OBJECTIVES_GOAL_ID),
      weekly
    );
    if (dailyOk && weeklyOk) return;
    setRawGoals(rawNormalized);
  }, [goalsHydrated, rawGoals, setRawGoals]);

  // Auto-reset personal goals at daily/weekly boundaries; maintain real hit streaks.
  React.useEffect(() => {
    if (!goalsHydrated) return;
    const current = normalizeGoals(rawGoals);
    const needsRollover = current.some((goal) => {
      if (goal.category !== "personal") return false;
      const period = goal.type === "daily" ? todayKey : weekKey;
      return !goal.periodKey || goal.periodKey !== period;
    });
    if (!needsRollover) return;
    setRawGoals(current.map((goal) => rolloverPersonalGoal(goal, todayKey, weekKey)));
  }, [goalsHydrated, rawGoals, todayKey, weekKey, setRawGoals]);

  // On period rollover: snapshot closed day/week, scrub legacy focus history, seed gaps.
  React.useEffect(() => {
    if (!hydrated) return;

    const snapshots: GoalHistoryEntry[] = [];
    let nextMeta = { ...meta };
    let metaChanged = false;

    if (meta.lastDailyKey !== todayKey) {
      if (meta.lastDailyKey) {
        for (const closedKey of closedDailyKeys(meta.lastDailyKey, todayKey)) {
          snapshots.push(
            makeHistoryEntry(
              DAILY_OBJECTIVES_GOAL_ID,
              "daily",
              closedKey,
              objectivesCompletedOnDate(objectives, closedKey),
              DAILY_OBJECTIVES_TARGET
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
              WEEKLY_OBJECTIVES_TARGET
            )
          );
        }
      }
      nextMeta.lastWeeklyKey = weekKey;
      metaChanged = true;
    }

    const seeded = seedHistoryFromActivity(
      scrubLegacyFocusHistory(mergeHistory(history, snapshots)),
      goalsBase,
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
    objectives,
    todayKey,
    weekKey,
    setRawHistory,
    setRawMeta,
  ]);

  const addPersonalGoal = React.useCallback(
    (input: { title: string; type: "daily" | "weekly"; target: number }) => {
      const title = input.title.trim().slice(0, 120);
      if (!title) return null;
      const now = new Date().toISOString();
      const currentKey = input.type === "daily" ? localDateKey() : mondayWeekKey();
      const goal: Goal = {
        id: createId(),
        title,
        type: input.type,
        category: "personal",
        tracking: "manual",
        target: Math.max(1, Math.round(input.target)),
        unit: "",
        progress: 0,
        completed: false,
        streak: 0,
        periodKey: currentKey,
        createdAt: now,
        updatedAt: now,
      };
      setRawGoals((prev) => [...normalizeGoals(prev), goal]);
      return goal;
    },
    [setRawGoals]
  );

  const deleteGoal = React.useCallback(
    (goalId: string) => {
      if (goalId === DAILY_OBJECTIVES_GOAL_ID || goalId === WEEKLY_OBJECTIVES_GOAL_ID) return;
      recordTombstone(GOALS_STORAGE_KEY, goalId);
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
          return {
            ...goal,
            progress: next,
            completed: next >= goal.target,
            updatedAt: new Date().toISOString(),
          };
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
    addPersonalGoal,
    deleteGoal,
    setManualProgress,
    hydrated,
  };
}
