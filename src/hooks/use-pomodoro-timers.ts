"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { PomodoroTimerInstance, TimerSource } from "@/types";

const STORAGE_KEY = "axon:pomodoro:timers";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `timer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
 * Manages a list of concurrently running/paused/finished Pomodoro timers
 * (objective-linked and/or personal), similar to the iOS Clock app's
 * multiple-timers view. Persisted via useLocalStorage using absolute end
 * timestamps, so state survives refreshes without losing accuracy.
 */
export function usePomodoroTimers() {
  const [timers, setTimers, hydrated] = useLocalStorage<PomodoroTimerInstance[]>(STORAGE_KEY, []);

  // A single shared ticking clock drives re-renders for every timer card;
  // each card derives its own remaining time from `endAt`, so this tick is
  // just a "wake up and recompute" signal, not the source of truth.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Flip any running timer whose endAt has passed into "finished". Kept as
  // its own effect (rather than folded into the render) so it only ever
  // writes to storage when something actually changed.
  React.useEffect(() => {
    if (!hydrated) return;
    const now = Date.now();
    const anyDue = timers.some((t) => t.status === "running" && t.endAt !== null && t.endAt <= now);
    if (!anyDue) return;
    setTimers((prev) =>
      prev.map((t) => {
        if (t.status === "running" && t.endAt !== null && t.endAt <= now) {
          return { ...t, status: "finished", endAt: null, pausedRemainingSeconds: 0 };
        }
        return t;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, timers, setTimers]);

  const startTimer = React.useCallback(
    (input: StartTimerInput) => {
      const now = Date.now();
      const instance: PomodoroTimerInstance = {
        id: createId(),
        source: input.source,
        label: input.label,
        objectiveId: input.objectiveId,
        durationSeconds: input.durationSeconds,
        endAt: now + input.durationSeconds * 1000,
        pausedRemainingSeconds: null,
        status: "running",
        createdAt: new Date().toISOString(),
      };
      setTimers((prev) => [instance, ...prev]);
      return instance;
    },
    [setTimers]
  );

  const pauseTimer = React.useCallback(
    (id: string) => {
      setTimers((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "running") return t;
          return { ...t, status: "paused", pausedRemainingSeconds: remainingSecondsOf(t), endAt: null };
        })
      );
    },
    [setTimers]
  );

  const resumeTimer = React.useCallback(
    (id: string) => {
      setTimers((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "paused") return t;
          const remaining = t.pausedRemainingSeconds ?? 0;
          return { ...t, status: "running", endAt: Date.now() + remaining * 1000, pausedRemainingSeconds: null };
        })
      );
    },
    [setTimers]
  );

  /** Ends a timer early. Returns whole minutes actually elapsed so callers can log partial progress. */
  const stopTimer = React.useCallback(
    (id: string) => {
      const timer = timers.find((t) => t.id === id);
      const minutes = timer ? elapsedMinutesOf(timer) : 0;
      setTimers((prev) => prev.filter((t) => t.id !== id));
      return minutes;
    },
    [timers, setTimers]
  );

  const removeTimer = React.useCallback(
    (id: string) => {
      setTimers((prev) => prev.filter((t) => t.id !== id));
    },
    [setTimers]
  );

  /** Adds more time to a finished timer and resumes it (the Pomodoro "keep working" flow). */
  const extendTimer = React.useCallback(
    (id: string, extraSeconds: number) => {
      setTimers((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            durationSeconds: t.durationSeconds + extraSeconds,
            status: "running",
            endAt: Date.now() + extraSeconds * 1000,
            pausedRemainingSeconds: null,
            loggedCompletion: false,
          };
        })
      );
    },
    [setTimers]
  );

  const markLogged = React.useCallback(
    (id: string) => {
      setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, loggedCompletion: true } : t)));
    },
    [setTimers]
  );

  return {
    timers,
    hydrated,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    removeTimer,
    extendTimer,
    markLogged,
  };
}