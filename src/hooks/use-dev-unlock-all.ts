"use client";

import * as React from "react";
import {
  isDevUnlockAll,
  subscribeDevUnlockAll,
} from "@/lib/dev/unlocks";

/** Subscribe to the local developer unlock-all flag so UI re-renders when it flips. */
export function useDevUnlockAll(): boolean {
  return React.useSyncExternalStore(
    subscribeDevUnlockAll,
    isDevUnlockAll,
    () => false
  );
}
