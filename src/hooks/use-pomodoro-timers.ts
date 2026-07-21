"use client";

import * as React from "react";
import { useLocalStorage, writeLocalStorage, asArray, dedupeById } from "@/hooks/use-local-storage";
import { recordTombstone } from "@/lib/sync/tombstones";
import type { PomodoroTimerInstance, TimerSource } from "@/types";

export const POMODORO_TIMERS_STORAGE_KEY = "axon:pomodoro:timers";

const TIMER_STATUSES = new Set(["running", "paused", "finished"]);
const TIMER_SOURCES = new Set(["objective", "personal"]);

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeTimer(value: PomodoroTimerInstance): PomodoroTimerInstance | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const source = TIMER_SOURCES.has(value.source) ? value.source : "personal";
  const status = TIMER_STATUSES.has(value.status) ? value.status : "finished";
  const durationSeconds = Math.max(1, Math.round(finiteNumber(value.durationSeconds, 25 * 60)));
  const endAt =
    status === "running" && typeof value.endAt === "number" && Number.isFinite(value.endAt)
      ? value.endAt
      : null;
  const pausedRemainingSeconds =
    status === "paused"
      ? Math.max(0, Math.round(finiteNumber(value.pausedRemainingSeconds, durationSeconds)))
      : null;

  return {
    ...value,
    source,
    status,
    label: typeof value.label === "string" && value.label.trim() ? value.label : "Focus session",
    objectiveId: typeof value.objectiveId === "string" ? value.objectiveId : undefined,
    durationSeconds,
    endAt,
    pausedRemainingSeconds,
    hasCompletedRun: Boolean(value.hasCompletedRun),
    loggedCompletion: Boolean(value.loggedCompletion),
    notified: Boolean(value.notified),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
  };
}

function normalizeTimers(value: unknown): PomodoroTimerInstance[] {
  return dedupeById(asArray<PomodoroTimerInstance>(value))
    .map(normalizeTimer)
    .filter((timer): timer is PomodoroTimerInstance => timer !== null);
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `timer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function write(updater: (prev: PomodoroTimerInstance[]) => PomodoroTimerInstance[]) {
  return writeLocalStorage(
    POMODORO_TIMERS_STORAGE_KEY,
    (prev) => normalizeTimers(updater(normalizeTimers(prev))),
    [] as PomodoroTimerInstance[]
  );
}

/**
 * Atomically claims a completed run for XP/session logging. Returns the timer
 * snapshot only for the writer that flips `loggedCompletion` false → true,
 * so concurrent tabs/mounts can't double-award.
 */
export function claimTimerCompletion(id: string): PomodoroTimerInstance | null {
  let claimed: PomodoroTimerInstance | null = null;
  write((prev) =>
    prev.map((t) => {
      if (t.id !== id || !t.hasCompletedRun || t.loggedCompletion) return t;
      claimed = { ...t };
      return { ...t, loggedCompletion: true };
    })
  );
  return claimed;
}

export interface StartTimerInput {
  source: TimerSource;
  label: string;
  objectiveId?: string;
  durationSeconds: number;
}

/**
 * Derives a timer's remaining seconds "live" — while running this is always
 * computed from the absolute `endAt` timestamp, so it stays accurate across
 * tab backgrounding, sleep, or a full page reload (unlike a naive
 * setInterval-decremented counter).
 */
export function remainingSecondsOf(timer: PomodoroTimerInstance, now: number = Date.now()): number {
  if (timer.status === "paused") return timer.pausedRemainingSeconds ?? 0;
  if (timer.status === "finished") return 0;
  if (timer.endAt === null) return timer.durationSeconds;
  return Math.max(0, Math.round((timer.endAt - now) / 1000));
}

/** Whole minutes actually elapsed so far in the current run. */
export function elapsedMinutesOf(timer: PomodoroTimerInstance, now: number = Date.now()): number {
  const elapsedSeconds = Math.max(0, timer.durationSeconds - remainingSecondsOf(timer, now));
  return Math.floor(elapsedSeconds / 60);
}

/**
 * Removes any running/paused timer(s) tracking `objectiveId` — used when the
 * objective's estimated time is edited from the Kanban board while a timer
 * for it is already active in the Pomodoro section. That timer's duration
 * was snapshotted at start time, so it'd otherwise silently go stale; instead
 * it's dropped so the user can start a fresh timer with the new estimate.
 * Callable from outside a usePomodoroTimers() instance (e.g. from
 * useObjectives), and safe to call even if no mounted instance exists.
 */
export function removeActiveTimersForObjective(objectiveId: string) {
  write((prev) => {
    const next: PomodoroTimerInstance[] = [];
    for (const t of prev) {
      if (t.objectiveId === objectiveId && t.status !== "finished") {
        recordTombstone(POMODORO_TIMERS_STORAGE_KEY, t.id);
        continue;
      }
      next.push(t);
    }
    return next;
  });
}

/**
 * Manages a list of concurrently running/paused/finished Pomodoro timers
 * (objective-linked and/or personal), similar to the iOS Clock app's
 * multiple-timers view. Persisted via useLocalStorage using absolute end
 * timestamps, so state survives refreshes without losing accuracy.
 *
 * Every mutator here reads the current persisted list fresh (via
 * writeLocalStorage) rather than off this instance's own React state, so two
 * mounted instances (e.g. the header's notification watcher and the
 * Pomodoro page) can never clobber each other's writes.
 */
export function usePomodoroTimers() {
  const [rawTimers, , hydrated] = useLocalStorage<PomodoroTimerInstance[]>(
    POMODORO_TIMERS_STORAGE_KEY,
    []
  );
  const timers = React.useMemo(() => normalizeTimers(rawTimers), [rawTimers]);

  // A single shared ticking clock drives re-renders for every timer card;
  // each card derives its own remaining time from `endAt`, so this tick is
  // just a "wake up and recompute" signal, not the source of truth. It only
  // runs while a timer is actually counting down — paused/finished/empty
  // lists don't need per-second re-renders (this hook is mounted app-wide
  // via the notifications watcher, so an unconditional interval would tick
  // on every page forever).
  const hasRunningTimer = timers.some((t) => t.status === "running");
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!hasRunningTimer) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [hasRunningTimer]);

  // When a countdown hits zero (or is paused at 0:00): reset to the original
  // duration (paused/Ready) and mark a completed run. Must re-check on every
  // `tick` — `timers` alone does not change while a running timer's endAt
  // quietly passes. Also migrate leftover "finished" rows from older builds.
  React.useEffect(() => {
    if (!hydrated) return;
    const now = Date.now();
    const anyDue = timers.some((t) => {
      if (t.status === "finished") return true;
      if (t.hasCompletedRun && t.status === "paused" && (t.pausedRemainingSeconds ?? 0) >= t.durationSeconds) {
        return false;
      }
      if (t.status === "running" && t.endAt !== null && t.endAt <= now) return true;
      if (t.status === "paused" && remainingSecondsOf(t, now) <= 0) return true;
      return false;
    });
    if (!anyDue) return;
    write((prev) =>
      prev.map((t) => {
        const alreadyReady =
          t.hasCompletedRun &&
          t.status === "paused" &&
          (t.pausedRemainingSeconds ?? 0) >= t.durationSeconds;
        if (alreadyReady) return t;

        const dueRunning = t.status === "running" && t.endAt !== null && t.endAt <= Date.now();
        const duePaused = t.status === "paused" && remainingSecondsOf(t) <= 0;
        const dueFinished = t.status === "finished";
        if (!dueRunning && !duePaused && !dueFinished) return t;

        return {
          ...t,
          status: "paused" as const,
          endAt: null,
          pausedRemainingSeconds: t.durationSeconds,
          hasCompletedRun: true,
          loggedCompletion: false,
          notified: false,
        };
      })
    );
  }, [hydrated, timers, tick]);

  const startTimer = React.useCallback((input: StartTimerInput) => {
    const now = Date.now();
    const durationSeconds = Math.max(1, Math.round(finiteNumber(input.durationSeconds, 25 * 60)));
    const instance: PomodoroTimerInstance = {
      id: createId(),
      source: TIMER_SOURCES.has(input.source) ? input.source : "personal",
      label: input.label.trim() || "Focus session",
      objectiveId: input.objectiveId,
      durationSeconds,
      endAt: now + durationSeconds * 1000,
      pausedRemainingSeconds: null,
      status: "running",
      createdAt: new Date().toISOString(),
    };
    write((prev) => [instance, ...prev]);
    return instance;
  }, []);

  const pauseTimer = React.useCallback((id: string) => {
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== "running") return t;
        const remaining = remainingSecondsOf(t);
        // Pausing at/after 0:00 should settle into a completed Ready state —
        // otherwise Focus Mode sticks and XP never awards.
        if (remaining <= 0) {
          return {
            ...t,
            status: "paused",
            endAt: null,
            pausedRemainingSeconds: t.durationSeconds,
            hasCompletedRun: true,
            loggedCompletion: false,
            notified: false,
          };
        }
        return { ...t, status: "paused", pausedRemainingSeconds: remaining, endAt: null };
      })
    );
  }, []);

  const resumeTimer = React.useCallback((id: string) => {
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== "paused") return t;
        const remaining = t.pausedRemainingSeconds ?? 0;
        if (remaining <= 0) {
          return {
            ...t,
            status: "paused",
            endAt: null,
            pausedRemainingSeconds: t.durationSeconds,
            hasCompletedRun: true,
            loggedCompletion: false,
            notified: false,
          };
        }
        return { ...t, status: "running", endAt: Date.now() + remaining * 1000, pausedRemainingSeconds: null };
      })
    );
  }, []);

  /** Ends a timer early. Returns whole minutes actually elapsed so callers can log partial progress. */
  const stopTimer = React.useCallback(
    (id: string) => {
      const timer = timers.find((t) => t.id === id);
      const minutes = timer ? elapsedMinutesOf(timer) : 0;
      recordTombstone(POMODORO_TIMERS_STORAGE_KEY, id);
      write((prev) => prev.filter((t) => t.id !== id));
      return minutes;
    },
    [timers]
  );

  const removeTimer = React.useCallback((id: string) => {
    recordTombstone(POMODORO_TIMERS_STORAGE_KEY, id);
    write((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /** Adds more time after a completion prompt and resumes (new focus interval). */
  const extendTimer = React.useCallback((id: string, extraSeconds: number) => {
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          durationSeconds: extraSeconds,
          status: "running",
          endAt: Date.now() + extraSeconds * 1000,
          pausedRemainingSeconds: null,
          loggedCompletion: false,
          notified: false,
          hasCompletedRun: false,
        };
      })
    );
  }, []);

  /** Adjust remaining time on a running/paused timer by deltaSeconds (clamped to 1 min … 8 h remaining). */
  const adjustTimerBy = React.useCallback((id: string, deltaSeconds: number) => {
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status === "finished") return t;
        const remaining = remainingSecondsOf(t);
        const nextRemaining = Math.max(60, Math.min(remaining + deltaSeconds, 8 * 3600));
        const delta = nextRemaining - remaining;
        if (delta === 0) return t;
        const durationSeconds = Math.max(60, t.durationSeconds + delta);
        if (t.status === "running") {
          return {
            ...t,
            durationSeconds,
            endAt: Date.now() + nextRemaining * 1000,
          };
        }
        return {
          ...t,
          durationSeconds,
          pausedRemainingSeconds: nextRemaining,
        };
      })
    );
  }, []);

  const restartTimer = React.useCallback((id: string) => {
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const durationSeconds = Math.max(1, t.durationSeconds);
        return {
          ...t,
          status: "running",
          endAt: Date.now() + durationSeconds * 1000,
          pausedRemainingSeconds: null,
          // Keep hasCompletedRun / loggedCompletion / notified so a prior full
          // run still qualifies for XP on Stop, we never double-award, and we
          // don't re-toast until the next natural finish.
        };
      })
    );
  }, []);

  const markLogged = React.useCallback((id: string) => {
    write((prev) => prev.map((t) => (t.id === id ? { ...t, loggedCompletion: true } : t)));
  }, []);

  const claimCompletion = React.useCallback((id: string) => claimTimerCompletion(id), []);

  const markNotified = React.useCallback((id: string) => {
    write((prev) => prev.map((t) => (t.id === id ? { ...t, notified: true } : t)));
  }, []);

  return {
    timers,
    hydrated,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    removeTimer,
    extendTimer,
    restartTimer,
    adjustTimerBy,
    markLogged,
    claimCompletion,
    markNotified,
  };
}
