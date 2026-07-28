"use client";

import * as React from "react";
import { useLocalStorage, writeLocalStorage, asArray, dedupeById } from "@/hooks/use-local-storage";
import { readFocusPreferences } from "@/hooks/use-focus-preferences";
import { recordTombstone } from "@/lib/sync/tombstones";
import type { PomodoroPhase, PomodoroTimerInstance, TimerSource } from "@/types";

export const POMODORO_TIMERS_STORAGE_KEY = "axon:pomodoro:timers";

const TIMER_STATUSES = new Set(["running", "paused", "finished"]);
const TIMER_SOURCES = new Set(["objective", "personal"]);
const TIMER_PHASES = new Set(["work", "short-break", "long-break"]);

export type PhaseAdvanceAction = "start-break" | "skip-break" | "start-work";

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizePhase(value: unknown): PomodoroPhase {
  return TIMER_PHASES.has(value as string) ? (value as PomodoroPhase) : "work";
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
  const cycleIndex = Math.max(0, Math.round(finiteNumber(value.cycleIndex, 0)));

  const createdAt = typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString();
  const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : createdAt;

  return {
    ...value,
    source,
    status,
    phase: normalizePhase(value.phase),
    cycleIndex,
    label: typeof value.label === "string" && value.label.trim() ? value.label : "Focus session",
    objectiveId: typeof value.objectiveId === "string" ? value.objectiveId : undefined,
    durationSeconds,
    endAt,
    pausedRemainingSeconds,
    hasCompletedRun: Boolean(value.hasCompletedRun),
    loggedCompletion: Boolean(value.loggedCompletion),
    notified: Boolean(value.notified),
    createdAt,
    updatedAt,
  };
}

function touch(
  timer: PomodoroTimerInstance,
  patch: Partial<PomodoroTimerInstance> = {}
): PomodoroTimerInstance {
  return { ...timer, ...patch, updatedAt: new Date().toISOString() };
}

function normalizeTimerList(value: unknown): PomodoroTimerInstance[] {
  return dedupeById(asArray<PomodoroTimerInstance>(value))
    .map(normalizeTimer)
    .filter((timer): timer is PomodoroTimerInstance => timer !== null);
}

/** Pure — no side effects. Prefer the running timer when collapsing. */
function pickSingleTimer(list: PomodoroTimerInstance[]): PomodoroTimerInstance[] {
  if (list.length <= 1) return list;
  const running = list.find((t) => t.status === "running");
  return [running ?? list[0]!];
}

function normalizeTimers(value: unknown): PomodoroTimerInstance[] {
  return pickSingleTimer(normalizeTimerList(value));
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
    (prev) => {
      const next = normalizeTimerList(updater(normalizeTimerList(prev)));
      if (next.length <= 1) return next;
      const running = next.find((t) => t.status === "running");
      const keep = running ?? next[0]!;
      for (const t of next) {
        if (t.id !== keep.id) recordTombstone(POMODORO_TIMERS_STORAGE_KEY, t.id);
      }
      return [keep];
    },
    [] as PomodoroTimerInstance[]
  );
}

function isReadyAfterRun(t: PomodoroTimerInstance): boolean {
  return Boolean(
    t.hasCompletedRun &&
      t.status === "paused" &&
      (t.pausedRemainingSeconds ?? 0) >= t.durationSeconds
  );
}

function minutesToSeconds(minutes: number): number {
  return Math.max(60, Math.round(minutes) * 60);
}

/**
 * Timers the user explicitly started/resumed this browser tab session.
 * Module-scoped so every usePomodoroTimers() mount (page + notification
 * watcher) shares the same allowlist — otherwise one mount pauses what
 * another just started.
 */
const allowedRunningIds = new Set<string>();

function allowRunning(id: string) {
  allowedRunningIds.add(id);
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
      return touch(t, { loggedCompletion: true });
    })
  );
  return claimed;
}

export interface StartTimerInput {
  source: TimerSource;
  label: string;
  objectiveId?: string;
  /** Defaults to Settings work interval when omitted. */
  durationSeconds?: number;
  phase?: PomodoroPhase;
  cycleIndex?: number;
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
 * linked objective is deleted or sent to the recycle bin so the Pomodoro
 * section doesn't keep a dead session. Callable from outside a
 * usePomodoroTimers() instance (e.g. from useObjectives).
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
 * Manages the single active Pomodoro timer (objective-linked or personal).
 * Persisted via useLocalStorage using absolute end timestamps, so state
 * survives refreshes without losing accuracy. Starting a new timer replaces
 * any existing one — only one focus session can run at a time.
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

  // Block phantom auto-starts: after refresh/sync, a "running" row without an
  // explicit user action this tab session is paused (Resume / Start still work).
  React.useEffect(() => {
    if (!hydrated) return;
    const now = Date.now();
    const illicit = timers.filter(
      (t) => t.status === "running" && !allowedRunningIds.has(t.id)
    );
    if (illicit.length === 0) return;
    write((prev) =>
      prev.map((t) => {
        if (t.status !== "running" || allowedRunningIds.has(t.id)) return t;
        const remaining = remainingSecondsOf(t, now);
        if (remaining <= 0) {
          return touch(t, {
            status: "paused",
            endAt: null,
            pausedRemainingSeconds: t.durationSeconds,
            hasCompletedRun: true,
            // Don't clear an existing claim — avoids double XP after refresh/sync.
            loggedCompletion: Boolean(t.loggedCompletion),
            notified: Boolean(t.notified),
          });
        }
        return touch(t, {
          status: "paused",
          endAt: null,
          pausedRemainingSeconds: remaining,
        });
      })
    );
  }, [hydrated, timers]);

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
      if (isReadyAfterRun(t)) return false;
      if (t.status === "running" && t.endAt !== null && t.endAt <= now) return true;
      if (t.status === "paused" && remainingSecondsOf(t, now) <= 0) return true;
      return false;
    });
    if (!anyDue) return;
    write((prev) =>
      prev.map((t) => {
        if (isReadyAfterRun(t)) return t;

        const dueRunning = t.status === "running" && t.endAt !== null && t.endAt <= Date.now();
        const duePaused = t.status === "paused" && remainingSecondsOf(t) <= 0;
        const dueFinished = t.status === "finished";
        if (!dueRunning && !duePaused && !dueFinished) return t;

        return touch(t, {
          status: "paused",
          endAt: null,
          pausedRemainingSeconds: t.durationSeconds,
          hasCompletedRun: true,
          // Never un-claim — prevents double XP if a settle re-runs after claim.
          loggedCompletion: Boolean(t.loggedCompletion),
          notified: Boolean(t.notified),
        });
      })
    );
  }, [hydrated, timers, tick]);

  const startTimer = React.useCallback((input: StartTimerInput) => {
    const now = Date.now();
    const prefs = readFocusPreferences();
    const durationSeconds = Math.max(
      1,
      Math.round(
        finiteNumber(
          input.durationSeconds,
          minutesToSeconds(prefs.workMinutes)
        )
      )
    );
    const createdAt = new Date().toISOString();
    const instance: PomodoroTimerInstance = {
      id: createId(),
      source: TIMER_SOURCES.has(input.source) ? input.source : "personal",
      label: input.label.trim() || "Focus session",
      objectiveId: input.objectiveId,
      durationSeconds,
      endAt: now + durationSeconds * 1000,
      pausedRemainingSeconds: null,
      status: "running",
      phase: input.phase ?? "work",
      cycleIndex: Math.max(0, Math.round(finiteNumber(input.cycleIndex, 0))),
      createdAt,
      updatedAt: createdAt,
    };
    // Hard single-timer rule: replace any existing session.
    allowRunning(instance.id);
    write((prev) => {
      for (const t of prev) {
        allowedRunningIds.delete(t.id);
        recordTombstone(POMODORO_TIMERS_STORAGE_KEY, t.id);
      }
      return [instance];
    });
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
          return touch(t, {
            status: "paused",
            endAt: null,
            pausedRemainingSeconds: t.durationSeconds,
            hasCompletedRun: true,
            loggedCompletion: false,
            notified: false,
          });
        }
        return touch(t, { status: "paused", pausedRemainingSeconds: remaining, endAt: null });
      })
    );
  }, []);

  const resumeTimer = React.useCallback((id: string) => {
    allowRunning(id);
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== "paused") return t;
        // Ready (awaiting phase transition) must not resume as a fresh countdown —
        // that would re-settle and double-award XP. Use restart / advancePhase instead.
        if (isReadyAfterRun(t)) return t;
        const remaining = t.pausedRemainingSeconds ?? 0;
        if (remaining <= 0) {
          return touch(t, {
            status: "paused",
            endAt: null,
            pausedRemainingSeconds: t.durationSeconds,
            hasCompletedRun: true,
            loggedCompletion: false,
            notified: false,
          });
        }
        return touch(t, {
          status: "running",
          endAt: Date.now() + remaining * 1000,
          pausedRemainingSeconds: null,
        });
      })
    );
  }, []);

  /** Ends a timer early. Returns whole minutes actually elapsed so callers can log partial progress. */
  const stopTimer = React.useCallback(
    (id: string) => {
      const timer = timers.find((t) => t.id === id);
      const minutes = timer ? elapsedMinutesOf(timer) : 0;
      allowedRunningIds.delete(id);
      recordTombstone(POMODORO_TIMERS_STORAGE_KEY, id);
      write((prev) => prev.filter((t) => t.id !== id));
      return minutes;
    },
    [timers]
  );

  const removeTimer = React.useCallback((id: string) => {
    allowedRunningIds.delete(id);
    recordTombstone(POMODORO_TIMERS_STORAGE_KEY, id);
    write((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /** Adds more time after a completion prompt and resumes (new focus interval). Work phase only. */
  const extendTimer = React.useCallback((id: string, extraSeconds: number) => {
    allowRunning(id);
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return touch(t, {
          phase: "work",
          durationSeconds: extraSeconds,
          status: "running",
          endAt: Date.now() + extraSeconds * 1000,
          pausedRemainingSeconds: null,
          loggedCompletion: false,
          notified: false,
          hasCompletedRun: false,
        });
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
          return touch(t, {
            durationSeconds,
            endAt: Date.now() + nextRemaining * 1000,
          });
        }
        return touch(t, {
          durationSeconds,
          pausedRemainingSeconds: nextRemaining,
        });
      })
    );
  }, []);

  const restartTimer = React.useCallback((id: string) => {
    allowRunning(id);
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const durationSeconds = Math.max(1, t.durationSeconds);
        return touch(t, {
          // Restart redoes the same phase interval (work stays work).
          status: "running",
          endAt: Date.now() + durationSeconds * 1000,
          pausedRemainingSeconds: null,
          hasCompletedRun: false,
          loggedCompletion: false,
          notified: false,
        });
      })
    );
  }, []);

  /**
   * Prompt-gated phase transition after an interval settles to Ready.
   * Reads current Settings interval lengths so the next interval picks up
   * any preference changes.
   */
  const advancePhase = React.useCallback((id: string, action: PhaseAdvanceAction) => {
    const prefs = readFocusPreferences();
    allowRunning(id);
    write((prev) =>
      prev.map((t) => {
        if (t.id !== id || !isReadyAfterRun(t)) return t;

        if (action === "start-break" || action === "skip-break") {
          if (t.phase !== "work") return t;
          const worksCompleted = t.cycleIndex + 1;
          const needsLong = worksCompleted >= prefs.cyclesBeforeLongBreak;

          if (action === "skip-break") {
            const durationSeconds = minutesToSeconds(prefs.workMinutes);
            return touch(t, {
              phase: "work",
              cycleIndex: needsLong ? 0 : worksCompleted,
              durationSeconds,
              status: "running",
              endAt: Date.now() + durationSeconds * 1000,
              pausedRemainingSeconds: null,
              hasCompletedRun: false,
              loggedCompletion: false,
              notified: false,
            });
          }

          const phase: PomodoroPhase = needsLong ? "long-break" : "short-break";
          const breakMinutes = needsLong ? prefs.longBreakMinutes : prefs.shortBreakMinutes;
          const durationSeconds = minutesToSeconds(breakMinutes);
          return touch(t, {
            phase,
            cycleIndex: worksCompleted,
            durationSeconds,
            status: "running",
            endAt: Date.now() + durationSeconds * 1000,
            pausedRemainingSeconds: null,
            hasCompletedRun: false,
            loggedCompletion: false,
            notified: false,
          });
        }

        // start-work — from a completed break
        if (t.phase === "work") return t;
        const durationSeconds = minutesToSeconds(prefs.workMinutes);
        return touch(t, {
          phase: "work",
          cycleIndex: t.phase === "long-break" ? 0 : t.cycleIndex,
          durationSeconds,
          status: "running",
          endAt: Date.now() + durationSeconds * 1000,
          pausedRemainingSeconds: null,
          hasCompletedRun: false,
          loggedCompletion: false,
          notified: false,
        });
      })
    );
  }, []);

  const markLogged = React.useCallback((id: string) => {
    write((prev) => prev.map((t) => (t.id === id ? touch(t, { loggedCompletion: true }) : t)));
  }, []);

  const claimCompletion = React.useCallback((id: string) => claimTimerCompletion(id), []);

  const markNotified = React.useCallback((id: string) => {
    write((prev) => prev.map((t) => (t.id === id ? touch(t, { notified: true }) : t)));
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
    advancePhase,
    adjustTimerBy,
    markLogged,
    claimCompletion,
    markNotified,
  };
}
