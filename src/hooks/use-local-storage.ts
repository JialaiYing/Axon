"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persists state to localStorage under `key`.
 *
 * This hook is intentionally the single abstraction boundary for local
 * persistence across the app. When a real backend is introduced, only
 * this hook (or a drop-in replacement with the same signature) needs to
 * change — feature code that calls useLocalStorage should not need to.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(`useLocalStorage: failed to read key "${key}"`, error);
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch (error) {
          console.error(`useLocalStorage: failed to write key "${key}"`, error);
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue, hydrated] as const;
}
