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
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!hasRunningTimer) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [hasRunningTimer]);

  // Flip any running timer whose endAt has passed into "finished".
  React.useEffect(() => {
    if (!hydrated) return;
    const now = Date.now();
    const anyDue = timers.some((t) => t.status === "running" && t.endAt !== null && t.endAt <= now);
    if (!anyDue) return;
    write((prev) =>
      prev.map((t) => {
        if (t.status === "running" && t.endAt !== null && t.endAt <= Date.now()) {
          return { ...t, status: "finished", endAt: null, pausedRemainingSeconds: 0 };
        }
        return t;
      })
    );
  }, [hydrated, timers]);

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
        return { ...t, status: "paused", pausedRemainingSeconds: remainingSecondsOf(t), endAt: null };
      })
    );
  }, []);

  const resumeTimer = React.useCallback((id: string) => {
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== "paused") return t;
        const remaining = t.pausedRemainingSeconds ?? 0;
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

  /** Adds more time to a finished timer and resumes it (the Pomodoro "keep working" flow). */
  const extendTimer = React.useCallback((id: string, extraSeconds: number) => {
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          // Treat an extension after completion as a new focus interval.
          // The completed interval was already logged, so retaining the old
          // duration here would count it a second time when this run finishes.
          durationSeconds: extraSeconds,
          status: "running",
          endAt: Date.now() + extraSeconds * 1000,
          pausedRemainingSeconds: null,
          loggedCompletion: false,
          notified: false,
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

  const markLogged = React.useCallback((id: string) => {
    write((prev) => prev.map((t) => (t.id === id ? { ...t, loggedCompletion: true } : t)));
  }, []);

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
    adjustTimerBy,
    markLogged,
    markNotified,
  };
}
