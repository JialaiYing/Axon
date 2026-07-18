"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import {
  DEFAULT_PROGRESS_STATE,
  PROGRESS_STORAGE_KEY,
  normalizeProgressState,
  type ProgressState,
} from "@/lib/progress/store";
import { levelFromTotalXp, type LevelProgress } from "@/lib/progress/xp-curve";
import { rankInfoForLevel, type RankInfo } from "@/lib/progress/ranks";
import { computeCurrentStreak } from "@/lib/progress/streak";
import { computeProductivityIndex } from "@/lib/progress/productivity";
import { computeTodayXp } from "@/lib/progress/today";
import type { UserStats } from "@/types";

export interface UseUserStatsResult {
  stats: UserStats;
  progression: LevelProgress;
  rank: RankInfo;
  /** XP earned today — purely derived, always live even before any storage write. */
  todayXp: number;
  hydrated: boolean;
}

/**
 * The single read model for the dashboard's identity layer. Combines the
 * persisted lifetime XP total with live-derived streak and productivity
 * numbers, so the rest of the app never has to know XP is stored
 * separately from the objectives/sessions it's computed from.
 */
export function useUserStats(): UseUserStatsResult {
  const [rawState, , progressHydrated] = useLocalStorage<ProgressState>(
    PROGRESS_STORAGE_KEY,
    DEFAULT_PROGRESS_STATE
  );
  const state = React.useMemo(() => normalizeProgressState(rawState), [rawState]);

  const { objectives, hydrated: objectivesHydrated } = useObjectives();
  const { sessions, hydrated: sessionsHydrated } = usePomodoroSessions();
  const hydrated = progressHydrated && objectivesHydrated && sessionsHydrated;

  const currentStreak = React.useMemo(() => computeCurrentStreak(sessions), [sessions]);
  const longestStreak = Math.max(state.longestStreak, currentStreak);

  const progression = React.useMemo(() => levelFromTotalXp(state.xp), [state.xp]);
  const rank = React.useMemo(() => rankInfoForLevel(progression.level), [progression.level]);

  const productivityIndex = React.useMemo(
    () => computeProductivityIndex({ objectives, sessions, currentStreak }),
    [objectives, sessions, currentStreak]
  );

  const todayXp = React.useMemo(
    () => computeTodayXp(objectives, sessions, currentStreak),
    [objectives, sessions, currentStreak]
  );

  const stats: UserStats = React.useMemo(
    () => ({
      xp: state.xp,
      level: progression.level,
      rank: rank.label,
      currentStreak,
      longestStreak,
      intervalsCompleted: state.intervalsCompleted,
      productivityIndex,
    }),
    [state.xp, progression.level, rank.label, currentStreak, longestStreak, state.intervalsCompleted, productivityIndex]
  );

  return { stats, progression, rank, todayXp, hydrated };
}
