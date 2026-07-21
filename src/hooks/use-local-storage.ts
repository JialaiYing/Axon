"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persists state to localStorage under `key`.
 *
 * This hook is intentionally the single abstraction boundary for local
 * persistence across the app. When a real backend is introduced, only
 * this hook (or a drop-in replacement with the same signature) needs to
 * change — feature code that calls useLocalStorage should not need to.
 *
 * Multiple components can mount this hook against the same key (e.g. the
 * always-mounted header watching timers written to by the Pomodoro page).
 * A tiny in-tab pub/sub (`broadcast`/`subscribe`) keeps every instance in
 * sync the moment one of them writes, and a `storage` listener covers the
 * cross-tab case — without either, only the instance that wrote would ever
 * see the new value.
 */
const subscribers = new Map<string, Set<() => void>>();

function subscribe(key: string, listener: () => void) {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(listener);
  return () => {
    subscribers.get(key)?.delete(listener);
  };
}

function broadcast(key: string) {
  subscribers.get(key)?.forEach((listener) => listener());
  // Global bus so the sync engine can debounce pushes without coupling to each key.
  globalListeners.forEach((listener) => listener(key));
}

const globalListeners = new Set<(key: string) => void>();

/** Subscribe to every localStorage write that goes through this module. */
export function subscribeLocalStorageWrites(listener: (key: string) => void) {
  globalListeners.add(listener);
  return () => {
    globalListeners.delete(listener);
  };
}

type StorageFailureReason = "quota" | "unknown";

const storageFailureListeners = new Set<(reason: StorageFailureReason) => void>();

/** Subscribe to failed localStorage writes (quota full, private mode, etc.). */
export function subscribeStorageFailures(listener: (reason: StorageFailureReason) => void) {
  storageFailureListeners.add(listener);
  return () => {
    storageFailureListeners.delete(listener);
  };
}

function notifyStorageFailure(error: unknown) {
  const isQuota =
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
  const reason: StorageFailureReason = isQuota ? "quota" : "unknown";
  storageFailureListeners.forEach((listener) => listener(reason));
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return fallback;
    const parsed = JSON.parse(item);
    // A stored literal "null"/"undefined" (or any parse producing nullish)
    // must fall back too — otherwise callers expecting e.g. an array get
    // `null` and crash on the next .map/.filter/Set(...) call.
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch (error) {
    console.error(`useLocalStorage: failed to read key "${key}"`, error);
    // Self-heal: a non-JSON value under this key (e.g. written by older code
    // that bypassed writeLocalStorage) would otherwise fail JSON.parse on
    // every single read. Clear it so the key falls back cleanly from now on
    // instead of erroring forever.
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return fallback;
  }
}

function hasStringId(value: unknown): value is { id: string } {
  return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string";
}

/** Keeps the first occurrence of each valid id — self-heals corrupted list rows too. */
export function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of list) {
    if (!hasStringId(item)) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

/** Coerces a possibly-corrupted persisted value back into a safe array. */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * One-off read of a localStorage key from outside a mounted useLocalStorage
 * instance — e.g. the XP engine reading Pomodoro sessions to compute a
 * streak bonus when awarding XP for a completed objective. Prefer
 * useLocalStorage inside components; this is for cross-module reads only.
 */
export function readLocalStorage<T>(key: string, fallback: T): T {
  return readStorage(key, fallback);
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  const sync = useCallback(() => {
    setStoredValue(readStorage(key, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    sync();
    setHydrated(true);
    const unsubscribe = subscribe(key, sync);
    function onStorage(e: StorageEvent) {
      if (e.key === key) sync();
    }
    window.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, [key, sync]);

  // Writes go through writeLocalStorage — which reads/writes localStorage
  // directly and only *then* broadcasts — rather than doing the write and
  // broadcast from inside this setStoredValue's own updater callback.
  // Broadcasting from inside a useState updater is re-entrant: it
  // synchronously triggers every subscriber's setStoredValue (including
  // this same instance's, via its own subscription) while React is still
  // processing the original dispatch, which can make React re-invoke this
  // updater a second time against a `prev` that already reflects the first
  // run — e.g. duplicating an item a functional update just appended.
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      writeLocalStorage<T>(key, (prev) => (value instanceof Function ? value(prev) : value), initialValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [storedValue, setValue, hydrated] as const;
}

/**
 * Read-modify-write against a localStorage key from outside a React
 * component/hook instance (e.g. one hook's action needs to affect another
 * hook's storage key, like clearing a Pomodoro timer when its objective's
 * estimate changes). Always reads the current persisted value first, so it
 * can't clobber a write another mounted instance just made — unlike calling
 * a stale closure's `setValue(prev => ...)` across instances.
 */
export function writeLocalStorage<T>(key: string, updater: (prev: T) => T, fallback: T): T {
  const prev = readStorage(key, fallback);
  const next = updater(prev);
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
    broadcast(key);
  } catch (error) {
    console.error(`writeLocalStorage: failed to write key "${key}"`, error);
    notifyStorageFailure(error);
  }
  return next;
}
