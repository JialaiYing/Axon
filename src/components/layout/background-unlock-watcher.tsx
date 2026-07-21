"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUserStats } from "@/hooks/use-user-stats";
import { useNotifications } from "@/hooks/use-notifications";
import { unlockedBackgrounds, type BackgroundId } from "@/lib/backgrounds/catalog";
import { showBrowserNotification } from "@/lib/notifications/browser";

const SEEDED_KEY = "axon:notifications:backgroundUnlocks:seeded";
const NOTIFIED_KEY = "axon:notifications:backgroundUnlocks:notified";

function readNotifiedIds(): Set<BackgroundId> {
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is BackgroundId => typeof id === "string") as BackgroundId[]);
  } catch {
    return new Set();
  }
}

function writeNotifiedIds(ids: Set<BackgroundId>) {
  try {
    window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota / private mode */
  }
}

function isSeeded(): boolean {
  try {
    return window.localStorage.getItem(SEEDED_KEY) === "true";
  } catch {
    return false;
  }
}

function markSeeded() {
  try {
    window.localStorage.setItem(SEEDED_KEY, "true");
  } catch {
    /* ignore */
  }
}

/**
 * Watches level progression and notifies when a new dashboard background
 * unlocks. Never auto-applies a background — the user must pick it in Settings.
 * Seeds quietly on first run so existing unlocks don't spam returning users.
 */
export function BackgroundUnlockWatcher() {
  const router = useRouter();
  const { stats, hydrated: statsHydrated } = useUserStats();
  const { addNotification, notifications, hydrated: notifHydrated } = useNotifications();
  const level = stats.level || 1;

  React.useEffect(() => {
    if (!statsHydrated || !notifHydrated) return;

    const unlockable = unlockedBackgrounds(level).filter((bg) => bg.id !== "solid");
    const unlockedIds = unlockable.map((bg) => bg.id);

    if (!isSeeded()) {
      writeNotifiedIds(new Set(unlockedIds));
      markSeeded();
      return;
    }

    const notified = readNotifiedIds();
    const newlyUnlocked = unlockable.filter((bg) => !notified.has(bg.id));
    if (newlyUnlocked.length === 0) return;

    for (const bg of newlyUnlocked) {
      const dedupeId = `bg-unlock-${bg.id}`;
      if (notifications.some((n) => n.timerId === dedupeId)) {
        notified.add(bg.id);
        continue;
      }

      const title = "Background unlocked";
      const message = `"${bg.name}" is available — open Settings to apply it.`;

      addNotification({
        timerId: dedupeId,
        kind: "background-unlock",
        href: "/settings",
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
          router.push("/settings");
          browserNote.close();
        };
      }

      notified.add(bg.id);
    }

    writeNotifiedIds(notified);
  }, [statsHydrated, notifHydrated, level, notifications, addNotification, router]);

  return null;
}
