"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { PomodoroSession } from "@/types";

const STORAGE_KEY = "axon:pomodoro:sessions";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function usePomodoroSessions() {
  const [sessions, setSessions, hydrated] = useLocalStorage<PomodoroSession[]>(STORAGE_KEY, []);

  const logSession = React.useCallback(
    (input: Omit<PomodoroSession, "id" | "date">) => {
      setSessions((prev) => [
        { ...input, id: createId(), date: new Date().toISOString() },
        ...prev,
      ]);
    },
    [setSessions]
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