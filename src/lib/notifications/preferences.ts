const DUE_SOON_KEY = "axon:notifications:dueSoon";
const MISSED_SCHEDULE_KEY = "axon:notifications:missedSchedule";

/** Due-soon reminders are opt-in — Pomodoro completion stays the default. */
export function getDueSoonNotificationPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DUE_SOON_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDueSoonNotificationPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DUE_SOON_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Missed schedule / deadline alerts are on by default. Only an explicit
 * `"false"` disables them — absent / other values count as enabled.
 */
export function getMissedScheduleNotificationPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MISSED_SCHEDULE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setMissedScheduleNotificationPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MISSED_SCHEDULE_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore quota / private mode */
  }
}
