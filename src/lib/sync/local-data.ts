import { readLocalStorage, writeLocalStorage } from "@/hooks/use-local-storage";
import { SYNC_COLLECTIONS } from "@/lib/sync/collections";
import { clearSyncDeleteState } from "@/lib/sync/tombstones";

/** Remembers which account last synced on this device. */
export const LAST_USER_KEY = "axon:sync:lastUserId";

const DEVICE_DEDUP_KEYS = [
  "axon:notifications:backgroundUnlocks:seeded",
  "axon:notifications:backgroundUnlocks:notified",
  "axon:notifications:dueSoon:firedDay",
] as const;

export function readLastUserId(): string | null {
  try {
    return window.localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

export function writeLastUserId(id: string | null) {
  try {
    if (id === null) window.localStorage.removeItem(LAST_USER_KEY);
    else window.localStorage.setItem(LAST_USER_KEY, id);
  } catch {
    /* ignore */
  }
}

/**
 * True when this browser has guest / leftover synced study data worth asking
 * about before the first push into a newly signed-in account.
 */
export function hasLocalSyncedData(): boolean {
  for (const collection of SYNC_COLLECTIONS) {
    const raw = readLocalStorage<unknown>(collection.key, collection.fallback);
    if (collection.kind === "array") {
      if (Array.isArray(raw) && raw.length > 0) return true;
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    if (collection.key === "axon:progress:v1") {
      if (typeof record.xp === "number" && record.xp > 0) return true;
      if (Array.isArray(record.awardedObjectiveIds) && record.awardedObjectiveIds.length > 0) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Wipes every synced collection (and a few device dedupe keys) so the next
 * account on this browser cannot inherit or push another user's local data.
 */
export function clearLocalSyncedData() {
  for (const collection of SYNC_COLLECTIONS) {
    writeLocalStorage(collection.key, () => collection.fallback, collection.fallback);
  }
  for (const key of DEVICE_DEDUP_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    window.localStorage.removeItem("axon:profile:displayName");
  } catch {
    /* ignore */
  }
  clearSyncDeleteState();
  writeLastUserId(null);
}
