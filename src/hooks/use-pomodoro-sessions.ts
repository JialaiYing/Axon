"use client";

import * as React from "react";
import { asArray, dedupeById, useLocalStorage } from "@/hooks/use-local-storage";
import { isToday } from "@/lib/goals-utils";
import { awardFocusSessionXp } from "@/lib/progress/store";
import type { PomodoroSession } from "@/types";

export const POMODORO_SESSIONS_STORAGE_KEY = "axon:pomodoro:sessions";
const STORAGE_KEY = POMODORO_SESSIONS_STORAGE_KEY;
const SESSION_TYPES = new Set(["work", "short-break", "long-break"]);

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSession(value: PomodoroSession): PomodoroSession | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const durationMinutes =
    typeof value.durationMinutes === "number" && Number.isFinite(value.durationMinutes)
      ? Math.max(0, Math.round(value.durationMinutes))
      : 0;

  return {
    ...value,
    date: typeof value.date === "string" && !Number.isNaN(new Date(value.date).getTime()) ? value.date : new Date().toISOString(),
    durationMinutes,
    type: SESSION_TYPES.has(value.type) ? value.type : "work",
    completed: Boolean(value.completed),
    objectiveId: typeof value.objectiveId === "string" ? value.objectiveId : undefined,
    label: typeof value.label === "string" ? value.label : undefined,
  };
}

function normalizeSessions(value: unknown): PomodoroSession[] {
  return dedupeById(asArray<PomodoroSession>(value))
    .map(normalizeSession)
    .filter((session): session is PomodoroSession => session !== null);
}

export function usePomodoroSessions() {
  const [rawSessions, setRawSessions, hydrated] = useLocalStorage<PomodoroSession[]>(STORAGE_KEY, []);
  const sessions = React.useMemo(() => normalizeSessions(rawSessions), [rawSessions]);

  const logSession = React.useCallback(
    (input: Omit<PomodoroSession, "id" | "date">) => {
      setRawSessions((prev) =>
        normalizeSessions([
          { ...input, id: createId(), date: new Date().toISOString() },
          ...normalizeSessions(prev),
        ])
      );
      // Only fully-completed work sessions earn XP — abandoned/partial
      // sessions and breaks don't. Runs after the write above so the streak
      // bonus the XP engine computes already reflects this session.
      if (input.completed && input.type === "work" && input.durationMinutes > 0) {
        awardFocusSessionXp(input.durationMinutes);
      }
    },
    [setRawSessions]
  );

  // Counts any logged work session today, partial or fully completed — same
  // scope as `todayFocusMinutes` below, so the two numbers displayed
  // together (dashboard, Pomodoro page) never disagree about what counts.
  const todaySessions = React.useMemo(
    () => sessions.filter((s) => s.type === "work" && s.durationMinutes > 0 && isToday(s.date)),
    [sessions]
  );

  const todayFocusMinutes = React.useMemo(
    () =>
      sessions
        .filter((s) => s.type === "work" && s.durationMinutes > 0 && isToday(s.date))
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions]
  );

  return {
    sessions,
    hydrated,
    logSession,
    todaySessions,
    todayFocusMinutes,
  };
}