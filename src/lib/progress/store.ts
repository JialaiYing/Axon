import { asArray, readLocalStorage, writeLocalStorage } from "@/hooks/use-local-storage";
import { POMODORO_SESSIONS_STORAGE_KEY } from "@/hooks/use-pomodoro-sessions";
import { localDateKey } from "@/lib/goals-utils";
import type { Objective, PomodoroSession } from "@/types";
import { computeCurrentStreak } from "./streak";
import { DAILY_ACTIVITY_BONUS_XP, focusSessionXp, objectiveCompletionXp } from "./xp-rules";
import { publishXpAward } from "./xp-events";

export const PROGRESS_STORAGE_KEY = "axon:progress:v1";

/**
 * Internal bookkeeping for lifetime XP. Kept separate from the public
 * `UserStats` shape (types/index.ts) so award logic can track things like
 * "which objectives already paid out" without leaking storage details into
 * the type every consumer imports.
 */
export interface ProgressState {
  xp: number;
  longestStreak: number;
  intervalsCompleted: number;
  /** Ids of objectives already credited, so recycling/restoring one (which
   *  re-sets its "done" status) can never double-pay XP. */
  awardedObjectiveIds: string[];
  /** yyyy-mm-dd of the last day the daily activity bonus was paid. */
  lastBonusDate?: string;
}

export const DEFAULT_PROGRESS_STATE: ProgressState = {
  xp: 0,
  longestStreak: 0,
  intervalsCompleted: 0,
  awardedObjectiveIds: [],
  lastBonusDate: undefined,
};

export function normalizeProgressState(value: unknown): ProgressState {
  if (!value || typeof value !== "object") return { ...DEFAULT_PROGRESS_STATE };
  const v = value as Partial<ProgressState>;
  return {
    xp: typeof v.xp === "number" && Number.isFinite(v.xp) ? Math.max(0, v.xp) : 0,
    longestStreak: typeof v.longestStreak === "number" && Number.isFinite(v.longestStreak) ? Math.max(0, v.longestStreak) : 0,
    intervalsCompleted:
      typeof v.intervalsCompleted === "number" && Number.isFinite(v.intervalsCompleted)
        ? Math.max(0, v.intervalsCompleted)
        : 0,
    awardedObjectiveIds: asArray<string>(v.awardedObjectiveIds).filter((id) => typeof id === "string"),
    lastBonusDate: typeof v.lastBonusDate === "string" ? v.lastBonusDate : undefined,
  };
}

function readSessions(): PomodoroSession[] {
  return asArray<PomodoroSession>(readLocalStorage(POMODORO_SESSIONS_STORAGE_KEY, []));
}

/**
 * Pays the once-per-day activity bonus if it hasn't already gone out today.
 * Uses the local calendar day (matching every other "is this today?" check
 * in the app — dashboard, goals, streak) rather than UTC, so the bonus
 * can't desync from what the dashboard's "+XP today" badge displays for
 * users outside UTC.
 */
function withDailyBonus(state: ProgressState): ProgressState {
  const key = localDateKey();
  if (state.lastBonusDate === key) return state;
  return { ...state, xp: state.xp + DAILY_ACTIVITY_BONUS_XP, lastBonusDate: key };
}

function write(updater: (prev: ProgressState) => ProgressState): ProgressState {
  return writeLocalStorage<ProgressState>(
    PROGRESS_STORAGE_KEY,
    (prev) => updater(normalizeProgressState(prev)),
    DEFAULT_PROGRESS_STATE
  );
}

/**
 * Credits XP for a newly completed objective. Idempotent — safe to call
 * from every code path that can transition an objective into "done"
 * (Kanban drag, the edit dialog, the Pomodoro finish flow, recycle-bin
 * restore) since it no-ops once that objective's id has already been paid.
 */
export function awardObjectiveCompletionXp(objective: Objective): number {
  let gained = 0;
  write((state) => {
    if (state.awardedObjectiveIds.includes(objective.id)) return state;
    const before = state.xp;
    const streak = computeCurrentStreak(readSessions());
    const xp = objectiveCompletionXp({
      priority: objective.priority,
      dueDate: objective.dueDate,
      completedAt: objective.completedAt ?? new Date().toISOString(),
      streak,
    });
    const next = withDailyBonus({
      ...state,
      xp: state.xp + xp,
      awardedObjectiveIds: [...state.awardedObjectiveIds, objective.id],
    });
    gained = next.xp - before;
    return next;
  });
  if (gained > 0) publishXpAward(gained);
  return gained;
}

/** Credits XP for a completed focus session and updates the persisted longest streak. */
export function awardFocusSessionXp(durationMinutes: number): number {
  if (durationMinutes <= 0) return 0;
  let gained = 0;
  write((state) => {
    const before = state.xp;
    const streak = computeCurrentStreak(readSessions());
    const xp = focusSessionXp(durationMinutes);
    const next = withDailyBonus({
      ...state,
      xp: state.xp + xp,
      intervalsCompleted: state.intervalsCompleted + 1,
      longestStreak: Math.max(state.longestStreak, streak),
    });
    gained = next.xp - before;
    return next;
  });
  if (gained > 0) publishXpAward(gained);
  return gained;
}
