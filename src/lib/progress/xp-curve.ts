import { MAX_LEVEL } from "./ranks";

/**
 * Cumulative XP required to *reach* level `L` (level 1 starts at 0).
 * Exponential growth (^1.65) so early levels come quickly and late levels
 * take meaningfully longer — tuned so level 30 sits around 26k total XP.
 */
export function totalXpToReach(level: number): number {
  const clamped = Math.min(MAX_LEVEL, Math.max(1, level));
  return Math.floor(100 * Math.pow(Math.max(0, clamped - 1), 1.65));
}

/** XP needed to go from level `L` to `L + 1`. Undefined past the level cap. */
export function xpToNextLevel(level: number): number | null {
  if (level >= MAX_LEVEL) return null;
  return totalXpToReach(level + 1) - totalXpToReach(level);
}

export interface LevelProgress {
  level: number;
  /** True once the player has reached the level cap. */
  isMaxLevel: boolean;
  /** XP earned since hitting the current level. */
  xpIntoLevel: number;
  /** XP required to reach the next level; null at the cap. */
  xpForNextLevel: number | null;
  /** 0-100 progress toward the next level; 100 at the cap. */
  progressPercent: number;
}

/** Derives the current level and in-level progress from a lifetime XP total. */
export function levelFromTotalXp(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (level < MAX_LEVEL && xp >= totalXpToReach(level + 1)) {
    level += 1;
  }

  const isMaxLevel = level >= MAX_LEVEL;
  const xpIntoLevel = xp - totalXpToReach(level);
  const xpForNextLevel = xpToNextLevel(level);
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpIntoLevel / (xpForNextLevel ?? 1)) * 100));

  return { level, isMaxLevel, xpIntoLevel, xpForNextLevel, progressPercent };
}
