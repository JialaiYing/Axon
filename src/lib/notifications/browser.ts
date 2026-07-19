"use client";

const PREF_KEY = "axon:notifications:browserEnabled";

export type BrowserNotificationPermission = NotificationPermission | "unsupported";

export function areBrowserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREF_KEY) === "true";
  } catch {
    return false;
  }
}

export function setBrowserNotificationPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, enabled ? "true" : "false");
  } catch {
    // ignore quota / private mode
  }
}

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!areBrowserNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!areBrowserNotificationsSupported()) return "unsupported";
  const result = await Notification.requestPermission();
  if (result === "granted") setBrowserNotificationPreference(true);
  return result;
}

/**
 * Fire a system notification when the tab is unfocused (or always if forced).
 * No-ops when permission isn't granted or the preference is off.
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { force?: boolean }
): Notification | null {
  if (!areBrowserNotificationsSupported()) return null;
  if (Notification.permission !== "granted") return null;
  if (!getBrowserNotificationPreference()) return null;
  if (!options?.force && typeof document !== "undefined" && !document.hidden) {
    return null;
  }

  try {
    const { force: _force, ...rest } = options ?? {};
    const notification = new Notification(title, {
      icon: "/axon-mark.svg",
      badge: "/axon-mark.svg",
      ...rest,
    });
    return notification;
  } catch (error) {
    console.error("Failed to show browser notification", error);
    return null;
  }
}
