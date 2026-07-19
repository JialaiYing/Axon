"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";

export const FOCUS_PREFERENCES_KEY = "axon:focus:preferences";

export interface FocusPreferences {
  /** Automatically enter Focus Mode when a timer starts. */
  autoEnterFocusMode: boolean;
  /** Show the site-blocklist reminder strip inside Focus Mode. */
  showBlocklistReminder: boolean;
}

export const DEFAULT_FOCUS_PREFERENCES: FocusPreferences = {
  autoEnterFocusMode: true,
  showBlocklistReminder: true,
};

function normalize(value: unknown): FocusPreferences {
  if (!value || typeof value !== "object") return DEFAULT_FOCUS_PREFERENCES;
  const v = value as Partial<FocusPreferences>;
  return {
    autoEnterFocusMode:
      typeof v.autoEnterFocusMode === "boolean"
        ? v.autoEnterFocusMode
        : DEFAULT_FOCUS_PREFERENCES.autoEnterFocusMode,
    showBlocklistReminder:
      typeof v.showBlocklistReminder === "boolean"
        ? v.showBlocklistReminder
        : DEFAULT_FOCUS_PREFERENCES.showBlocklistReminder,
  };
}

export function useFocusPreferences() {
  const [raw, setRaw, hydrated] = useLocalStorage<FocusPreferences>(
    FOCUS_PREFERENCES_KEY,
    DEFAULT_FOCUS_PREFERENCES
  );
  const preferences = normalize(raw);

  function updatePreferences(patch: Partial<FocusPreferences>) {
    setRaw((prev) => ({ ...normalize(prev), ...patch }));
  }

  return { preferences, updatePreferences, hydrated };
}
