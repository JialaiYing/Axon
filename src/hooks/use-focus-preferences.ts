"use client";

import { useLocalStorage, readLocalStorage } from "@/hooks/use-local-storage";

export const FOCUS_PREFERENCES_KEY = "axon:focus:preferences";

export interface FocusPreferences {
  /** Automatically enter Focus Mode when a timer starts. */
  autoEnterFocusMode: boolean;
  /** Show the site-blocklist reminder strip inside Focus Mode. */
  showBlocklistReminder: boolean;
  /** Work interval length in minutes (global default for every new timer). */
  workMinutes: number;
  /** Short break length in minutes. */
  shortBreakMinutes: number;
  /** Long break length in minutes. */
  longBreakMinutes: number;
  /** Completed work intervals before a long break. */
  cyclesBeforeLongBreak: number;
}

export const DEFAULT_FOCUS_PREFERENCES: FocusPreferences = {
  autoEnterFocusMode: true,
  showBlocklistReminder: true,
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

const MIN_INTERVAL_MINUTES = 1;
const MAX_INTERVAL_MINUTES = 8 * 60;
const MIN_CYCLES = 1;
const MAX_CYCLES = 12;

function clampMinutes(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(MAX_INTERVAL_MINUTES, Math.max(MIN_INTERVAL_MINUTES, Math.round(value)));
}

function clampCycles(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(MAX_CYCLES, Math.max(MIN_CYCLES, Math.round(value)));
}

export function normalizeFocusPreferences(value: unknown): FocusPreferences {
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
    workMinutes: clampMinutes(v.workMinutes, DEFAULT_FOCUS_PREFERENCES.workMinutes),
    shortBreakMinutes: clampMinutes(
      v.shortBreakMinutes,
      DEFAULT_FOCUS_PREFERENCES.shortBreakMinutes
    ),
    longBreakMinutes: clampMinutes(
      v.longBreakMinutes,
      DEFAULT_FOCUS_PREFERENCES.longBreakMinutes
    ),
    cyclesBeforeLongBreak: clampCycles(
      v.cyclesBeforeLongBreak,
      DEFAULT_FOCUS_PREFERENCES.cyclesBeforeLongBreak
    ),
  };
}

/** Imperative read for timer engine / non-React callers. */
export function readFocusPreferences(): FocusPreferences {
  return normalizeFocusPreferences(
    readLocalStorage(FOCUS_PREFERENCES_KEY, DEFAULT_FOCUS_PREFERENCES)
  );
}

export function useFocusPreferences() {
  const [raw, setRaw, hydrated] = useLocalStorage<FocusPreferences>(
    FOCUS_PREFERENCES_KEY,
    DEFAULT_FOCUS_PREFERENCES
  );
  const preferences = normalizeFocusPreferences(raw);

  function updatePreferences(patch: Partial<FocusPreferences>) {
    setRaw((prev) => normalizeFocusPreferences({ ...normalizeFocusPreferences(prev), ...patch }));
  }

  return { preferences, updatePreferences, hydrated };
}
