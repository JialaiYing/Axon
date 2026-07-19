"use client";

import * as React from "react";
import { useObjectives } from "@/hooks/use-objectives";
import { useNotifications } from "@/hooks/use-notifications";
import { getDueSoonNotificationPreference } from "@/lib/notifications/preferences";
import { isOverdue, isScheduleOverdue } from "@/lib/kanban-utils";
import { isToday as isTodayDate } from "@/lib/goals-utils";

const FIRED_KEY = "axon:notifications:dueSoon:firedDay";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Opt-in once-per-day reminder for overdue / due-today objectives.
 * Off by default so notifications stay lean and distraction-free.
 */
export function DueSoonWatcher() {
  const { objectives, hydrated } = useObjectives();
  const { addNotification, notifications } = useNotifications();
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hydrated || firedRef.current) return;
    if (!getDueSoonNotificationPreference()) return;

    const key = todayKey();
    try {
      if (window.localStorage.getItem(FIRED_KEY) === key) return;
    } catch {
      /* continue */
    }

    const active = objectives.filter((o) => o.status !== "done" && o.status !== "recycled");
    const due = active.filter(
      (o) =>
        isOverdue(o.dueDate, o.status) ||
        isScheduleOverdue(o) ||
        (o.dueDate ? isTodayDate(o.dueDate) : false)
    );
    if (due.length === 0) return;

    const dedupeId = `due-soon-${key}`;
    if (notifications.some((n) => n.timerId === dedupeId)) return;

    firedRef.current = true;
    addNotification({
      timerId: dedupeId,
      kind: "due-soon",
      href: "/kanban",
      title: "Deadlines need attention",
      message:
        due.length === 1
          ? `"${due[0]!.title}" is due today or overdue.`
          : `${due.length} objectives are due today or overdue.`,
    });
    try {
      window.localStorage.setItem(FIRED_KEY, key);
    } catch {
      /* ignore */
    }
  }, [hydrated, objectives, notifications, addNotification]);

  return null;
}
