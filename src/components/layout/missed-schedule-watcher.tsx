"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useObjectives } from "@/hooks/use-objectives";
import { useNotifications } from "@/hooks/use-notifications";
import { getMissedScheduleNotificationPreference } from "@/lib/notifications/preferences";
import { showBrowserNotification } from "@/lib/notifications/browser";
import { isOverdue, isScheduleOverdue } from "@/lib/kanban-utils";
import type { Objective } from "@/types";

const NOTIFIED_KEY = "axon:notifications:missedSchedule:notified";
/** How often to scan for newly missed blocks / deadlines while the app is open. */
const CHECK_MS = 30_000;

function readNotifiedIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeNotifiedIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota / private mode */
  }
}

function isActive(o: Objective) {
  return o.status !== "done" && o.status !== "recycled";
}

/** Missed scheduled block and/or past due date — unfinished. */
function isMissed(o: Objective) {
  if (!isActive(o)) return false;
  return isScheduleOverdue(o) || isOverdue(o.dueDate, o.status);
}

function isPersonalEvent(o: Objective) {
  return o.showOnKanban === false;
}

function missedCopy(o: Objective): { title: string; message: string; href: string } {
  const personal = isPersonalEvent(o);
  const href = personal ? "/calendar" : "/kanban";

  if (isScheduleOverdue(o)) {
    return {
      title: personal ? "Missed calendar event" : "Missed focus block",
      message: `"${o.title}" ended without being completed.`,
      href,
    };
  }

  return {
    title: personal ? "Missed calendar deadline" : "Missed deadline",
    message: `"${o.title}" is past its due date.`,
    href,
  };
}

/**
 * While the app shell is open, notify once per objective when a scheduled
 * block ends unfinished or a due date slips past — covers Kanban objectives
 * and calendar-only personal events (`showOnKanban: false`).
 *
 * On by default; Settings can disable. Re-fires if the user reschedules and
 * misses again (notified ids are pruned when the item is no longer missed).
 */
export function MissedScheduleWatcher() {
  const router = useRouter();
  const { objectives, hydrated: objectivesHydrated } = useObjectives();
  const { addNotification, notifications, hydrated: notifHydrated } = useNotifications();

  const scan = React.useCallback(() => {
    if (!objectivesHydrated || !notifHydrated) return;
    if (!getMissedScheduleNotificationPreference()) return;

    const missed = objectives.filter(isMissed);
    const missedIds = new Set(missed.map((o) => o.id));
    const notified = readNotifiedIds();
    let dirty = false;

    // Drop ids that are done, deleted, or no longer overdue (e.g. rescheduled).
    for (const id of [...notified]) {
      if (!missedIds.has(id)) {
        notified.delete(id);
        dirty = true;
      }
    }

    for (const objective of missed) {
      if (notified.has(objective.id)) continue;

      const dedupeId = `missed-schedule-${objective.id}`;
      if (notifications.some((n) => n.timerId === dedupeId)) {
        notified.add(objective.id);
        dirty = true;
        continue;
      }

      const { title, message, href } = missedCopy(objective);

      addNotification({
        timerId: dedupeId,
        kind: "missed-schedule",
        href,
        title,
        message,
      });

      const browserNote = showBrowserNotification(title, {
        body: message,
        tag: dedupeId,
      });
      if (browserNote) {
        browserNote.onclick = () => {
          window.focus();
          router.push(href);
          browserNote.close();
        };
      }

      notified.add(objective.id);
      dirty = true;
    }

    if (dirty) writeNotifiedIds(notified);
  }, [
    objectives,
    objectivesHydrated,
    notifHydrated,
    notifications,
    addNotification,
    router,
  ]);

  React.useEffect(() => {
    scan();
    const id = window.setInterval(scan, CHECK_MS);
    return () => window.clearInterval(id);
  }, [scan]);

  return null;
}
