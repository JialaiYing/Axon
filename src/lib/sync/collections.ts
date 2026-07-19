/**
 * Maps localStorage keys to Supabase tables for offline-first sync.
 * UI-only prefs (calendar view, timer display mode, etc.) are intentionally
 * omitted — they stay device-local.
 */

export type CollectionKind = "array" | "singleton";

export interface SyncCollection {
  /** localStorage key */
  key: string;
  /** Supabase table name */
  table: string;
  kind: CollectionKind;
  /** Fallback when local storage is empty */
  fallback: unknown;
}

export const SYNC_COLLECTIONS: SyncCollection[] = [
  { key: "axon:kanban:objectives", table: "objectives", kind: "array", fallback: [] },
  { key: "axon:flashcards:folders", table: "flashcard_folders", kind: "array", fallback: [] },
  { key: "axon:flashcards:sets", table: "flashcard_sets", kind: "array", fallback: [] },
  { key: "axon:pomodoro:sessions", table: "pomodoro_sessions", kind: "array", fallback: [] },
  { key: "axon:pomodoro:timers", table: "pomodoro_timers", kind: "array", fallback: [] },
  { key: "axon:goals", table: "goals", kind: "array", fallback: [] },
  { key: "axon:goals:history", table: "goal_history", kind: "array", fallback: [] },
  { key: "axon:notifications", table: "notifications", kind: "array", fallback: [] },
  {
    key: "axon:progress:v1",
    table: "progress",
    kind: "singleton",
    fallback: {
      xp: 0,
      longestStreak: 0,
      intervalsCompleted: 0,
      awardedObjectiveIds: [],
    },
  },
  {
    key: "axon:goals:meta",
    table: "goals_meta",
    kind: "singleton",
    fallback: { lastDailyKey: null, lastWeeklyKey: null },
  },
];

export const SYNC_KEY_SET = new Set(SYNC_COLLECTIONS.map((c) => c.key));
