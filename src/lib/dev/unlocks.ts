/**
 * Local developer override for cosmetic unlocks (palettes, etc.).
 * Does not change level math, XP, or unlock notifications — only gate checks.
 *
 * Enable via:
 * - Settings → Appearance toggle (shown in `next dev` only), or
 * - `NEXT_PUBLIC_DEV_UNLOCK_ALL=true` in `.env.local`
 */

export const DEV_UNLOCK_ALL_KEY = "axon:dev:unlockAll";
const DEV_UNLOCK_ALL_EVENT = "axon:dev-unlock-all";

export function isDevUnlockAll(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (process.env.NEXT_PUBLIC_DEV_UNLOCK_ALL === "true") return true;
    return window.localStorage.getItem(DEV_UNLOCK_ALL_KEY) === "true";
  } catch {
    return false;
  }
}

/** True when the env var alone forces unlock-all (toggle is display-only). */
export function isDevUnlockAllForcedByEnv(): boolean {
  return process.env.NEXT_PUBLIC_DEV_UNLOCK_ALL === "true";
}

export function setDevUnlockAll(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(DEV_UNLOCK_ALL_KEY, "true");
    } else {
      window.localStorage.removeItem(DEV_UNLOCK_ALL_KEY);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DEV_UNLOCK_ALL_EVENT));
}

export function subscribeDevUnlockAll(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(DEV_UNLOCK_ALL_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(DEV_UNLOCK_ALL_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
