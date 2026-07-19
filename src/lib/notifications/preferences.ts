const DUE_SOON_KEY = "axon:notifications:dueSoon";

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
