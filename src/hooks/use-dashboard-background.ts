"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useUserStats } from "@/hooks/use-user-stats";
import { useTheme } from "@/components/providers/theme-provider";
import {
  BACKGROUNDS,
  isBackgroundUnlocked,
  type BackgroundId,
} from "@/lib/backgrounds/catalog";

const STORAGE_KEY = "axon:background:prefs";

interface BackgroundPrefs {
  id: BackgroundId;
}

const DEFAULT: BackgroundPrefs = { id: "lines" };

function normalize(value: unknown): BackgroundPrefs {
  if (!value || typeof value !== "object") return DEFAULT;
  const id = (value as BackgroundPrefs).id;
  if (BACKGROUNDS.some((b) => b.id === id)) return { id };
  return DEFAULT;
}

export function useDashboardBackground() {
  const [raw, setRaw, hydrated] = useLocalStorage<BackgroundPrefs>(STORAGE_KEY, DEFAULT);
  const prefs = normalize(raw);
  const { stats } = useUserStats();
  const { theme } = useTheme();
  const level = stats.level || 1;

  const activeId: BackgroundId = isBackgroundUnlocked(prefs.id, level)
    ? prefs.id
    : "lines";

  const variant = BACKGROUNDS.find((b) => b.id === activeId) ?? BACKGROUNDS[1]!;
  const palette = theme === "light" ? variant.light : variant.dark;

  const setBackgroundId = React.useCallback(
    (id: BackgroundId) => {
      if (!isBackgroundUnlocked(id, level)) return;
      setRaw({ id });
    },
    [level, setRaw]
  );

  return {
    backgroundId: activeId,
    variant,
    palette,
    theme,
    level,
    setBackgroundId,
    hydrated,
    catalog: BACKGROUNDS,
  };
}
