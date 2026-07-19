"use client";

import * as React from "react";
import { useLocalStorage, writeLocalStorage, asArray, dedupeById } from "@/hooks/use-local-storage";
import type { TimerNotification } from "@/types";

const STORAGE_KEY = "axon:notifications";
const MAX_ARCHIVED = 30;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function write(updater: (prev: TimerNotification[]) => TimerNotification[]) {
  return writeLocalStorage(
    STORAGE_KEY,
    (prev) => normalizeNotifications(updater(normalizeNotifications(prev))).slice(0, MAX_ARCHIVED),
    [] as TimerNotification[]
  );
}

function normalizeNotification(value: TimerNotification): TimerNotification | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const kind = value.kind === "due-soon" ? "due-soon" : "timer";
  return {
    ...value,
    timerId: typeof value.timerId === "string" ? value.timerId : "",
    kind,
    href: typeof value.href === "string" ? value.href : undefined,
    title: typeof value.title === "string" && value.title.trim() ? value.title : "Notification",
    message: typeof value.message === "string" ? value.message : "",
    createdAt:
      typeof value.createdAt === "string" && !Number.isNaN(new Date(value.createdAt).getTime())
        ? value.createdAt
        : new Date().toISOString(),
    read: Boolean(value.read),
  };
}

function normalizeNotifications(value: unknown): TimerNotification[] {
  return dedupeById(asArray<TimerNotification>(value))
    .map(normalizeNotification)
    .filter((notification): notification is TimerNotification => notification !== null);
}

/**
 * Archive of "timer finished" notifications shown via the header bell.
 * Mirrors usePomodoroTimers()'s read-fresh-then-write pattern so the bell
 * (always mounted) and the toast watcher (also always mounted) never
 * clobber each other.
 */
export function useNotifications() {
  const [rawNotifications, , hydrated] = useLocalStorage<TimerNotification[]>(STORAGE_KEY, []);
  const notifications = React.useMemo(() => normalizeNotifications(rawNotifications), [rawNotifications]);

  const addNotification = React.useCallback(
    (input: {
      timerId: string;
      title: string;
      message: string;
      kind?: TimerNotification["kind"];
      href?: string;
    }) => {
      const notification: TimerNotification = {
        id: createId(),
        timerId: input.timerId,
        kind: input.kind ?? "timer",
        href: input.href,
        title: input.title,
        message: input.message,
        createdAt: new Date().toISOString(),
        read: false,
      };
      write((prev) => [notification, ...prev].slice(0, MAX_ARCHIVED));
      return notification;
    },
    []
  );

  const removeNotification = React.useCallback((id: string) => {
    write((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markRead = React.useCallback((id: string) => {
    write((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = React.useCallback(() => {
    write((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = React.useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return {
    notifications,
    hydrated,
    addNotification,
    removeNotification,
    markRead,
    markAllRead,
    unreadCount,
  };
}
