"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUserStats } from "@/hooks/use-user-stats";
import { useNotifications } from "@/hooks/use-notifications";
import {
  unlockedUnlockablePalettes,
  type PaletteId,
} from "@/lib/palettes/catalog";
import { showBrowserNotification } from "@/lib/notifications/browser";

const SEEDED_KEY = "axon:notifications:paletteUnlocks:seeded";
const NOTIFIED_KEY = "axon:notifications:paletteUnlocks:notified";

function readNotifiedIds(): Set<PaletteId> {
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is PaletteId => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeNotifiedIds(ids: Set<PaletteId>) {
  try {
    window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
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
 * Watches level progression and notifies when a new dark palette unlocks.
 * Never auto-equips — the user must pick it in Settings → Appearance.
 */
export function PaletteUnlockWatcher() {
  const router = useRouter();
  const { stats, hydrated: statsHydrated } = useUserStats();
  const { addNotification, notifications, hydrated: notifHydrated } = useNotifications();
  const level = stats.level || 1;

  React.useEffect(() => {
    if (!statsHydrated || !notifHydrated) return;

    const unlockable = unlockedUnlockablePalettes(level);
    const unlockedIds = unlockable.map((p) => p.id);

    if (!isSeeded()) {
      writeNotifiedIds(new Set(unlockedIds));
      markSeeded();
      return;
    }

    const notified = readNotifiedIds();
    const newlyUnlocked = unlockable.filter((p) => !notified.has(p.id));
    if (newlyUnlocked.length === 0) return;

    for (const palette of newlyUnlocked) {
      const dedupeId = `palette-unlock-${palette.id}`;
      if (notifications.some((n) => n.timerId === dedupeId)) {
        notified.add(palette.id);
        continue;
      }

      const title = "Palette unlocked";
      const message = `"${palette.name}" is available — open Appearance in Settings to equip it.`;

      addNotification({
        timerId: dedupeId,
        kind: "palette-unlock",
        href: "/settings#appearance",
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
          router.push("/settings#appearance");
          browserNote.close();
        };
      }

      notified.add(palette.id);
    }

    writeNotifiedIds(notified);
  }, [statsHydrated, notifHydrated, level, notifications, addNotification, router]);

  return null;
}
