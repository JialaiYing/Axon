"use client";

import * as React from "react";
import { asArray, dedupeById, useLocalStorage } from "@/hooks/use-local-storage";
import type { PomodoroSession } from "@/types";

const STORAGE_KEY = "axon:pomodoro:sessions";
const SESSION_TYPES = new Set(["work", "short-break", "long-break"]);

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isToday(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
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
    },
    [setRawSessions]
  );

  const todaySessions = React.useMemo(
    () => sessions.filter((s) => s.completed && isToday(s.date)),
    [sessions]
  );

  const todayFocusMinutes = React.useMemo(
    () => todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
    [todaySessions]
  );

  return {
    sessions,
    hydrated,
    logSession,
    todaySessions,
    todayFocusMinutes,
  };
}