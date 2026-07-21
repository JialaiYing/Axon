/**
 * Explicit delete markers for synced array collections.
 *
 * We never infer deletes from "local is missing an id" (that wiped other-device
 * data when one browser had a thinner copy). Instead:
 * - Local hard-deletes record a tombstone → push DELETEs that id on Supabase
 * - Pull tracks last-known remote ids → removes local rows that disappeared
 *   from the server after a prior successful pull
 */

import { readLocalStorage, writeLocalStorage } from "@/hooks/use-local-storage";
import { SYNC_COLLECTIONS } from "@/lib/sync/collections";

export const TOMBSTONES_KEY = "axon:sync:tombstones";
export const REMOTE_IDS_KEY = "axon:sync:remoteIds";

/** table → id → deletedAt ISO */
type TombstoneMap = Record<string, Record<string, string>>;
/** table → list of ids last seen on a successful pull */
type RemoteIdsMap = Record<string, string[]>;

function emptyTombstones(): TombstoneMap {
  return {};
}

function emptyRemoteIds(): RemoteIdsMap {
  return {};
}

export function tableForStorageKey(storageKey: string): string | null {
  const collection = SYNC_COLLECTIONS.find((c) => c.key === storageKey && c.kind === "array");
  return collection?.table ?? null;
}

export function recordTombstone(storageKey: string, id: string) {
  const table = tableForStorageKey(storageKey);
  if (!table || !id) return;
  const now = new Date().toISOString();
  writeLocalStorage<TombstoneMap>(
    TOMBSTONES_KEY,
    (prev) => {
      const next = { ...(prev ?? emptyTombstones()) };
      next[table] = { ...(next[table] ?? {}), [id]: now };
      return next;
    },
    emptyTombstones()
  );
}

export function readTombstonesForTable(table: string): Record<string, string> {
  const all = readLocalStorage<TombstoneMap>(TOMBSTONES_KEY, emptyTombstones());
  return all[table] ?? {};
}

export function clearTombstonesForTable(table: string, ids: string[]) {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  writeLocalStorage<TombstoneMap>(
    TOMBSTONES_KEY,
    (prev) => {
      const next = { ...(prev ?? emptyTombstones()) };
      const bucket = { ...(next[table] ?? {}) };
      for (const id of idSet) delete bucket[id];
      if (Object.keys(bucket).length === 0) delete next[table];
      else next[table] = bucket;
      return next;
    },
    emptyTombstones()
  );
}

export function readLastRemoteIds(table: string): Set<string> {
  const all = readLocalStorage<RemoteIdsMap>(REMOTE_IDS_KEY, emptyRemoteIds());
  return new Set(all[table] ?? []);
}

export function writeLastRemoteIds(table: string, ids: string[]) {
  writeLocalStorage<RemoteIdsMap>(
    REMOTE_IDS_KEY,
    (prev) => {
      const next = { ...(prev ?? emptyRemoteIds()) };
      next[table] = ids;
      return next;
    },
    emptyRemoteIds()
  );
}

/** Wipe tombstone + remote-id tracking (account switch / sign-out). */
export function clearSyncDeleteState() {
  writeLocalStorage(TOMBSTONES_KEY, () => emptyTombstones(), emptyTombstones());
  writeLocalStorage(REMOTE_IDS_KEY, () => emptyRemoteIds(), emptyRemoteIds());
}
