import type { Priority } from "@/types";

/** Base XP awarded per completed objective, before bonuses. */
export const PRIORITY_XP_BASE: Record<Priority, number> = {
  low: 25,
  medium: 50,
  high: 85,
  urgent: 130,
};

/** Streak bonus caps here so grinding streak alone can't dominate XP gain. */
const MAX_STREAK_BONUS_DAYS = 10;
const STREAK_BONUS_PER_DAY = 0.05;
const EARLY_COMPLETION_BONUS = 0.25;

export interface ObjectiveXpInput {
  priority: Priority;
  /** Deadline, if any. */
  dueDate?: string;
  /** When the objective was actually marked done. */
  completedAt: string;
  /** Current streak (in days) at the moment of completion. */
  streak: number;
}

/**
 * XP for finishing an objective: priority sets the base, an early-completion
 * bonus rewards beating the deadline, and a soft streak multiplier (capped
 * at +50%) rewards consistency without letting streak alone carry XP gain.
 */
export function objectiveCompletionXp({ priority, dueDate, completedAt, streak }: ObjectiveXpInput): number {
  const base = PRIORITY_XP_BASE[priority] ?? PRIORITY_XP_BASE.medium;
  const completedDate = new Date(completedAt).getTime();
  const dueDateMs = dueDate ? new Date(dueDate).getTime() : NaN;
  const early = !Number.isNaN(dueDateMs) && completedDate < dueDateMs ? EARLY_COMPLETION_BONUS : 0;
  const streakMultiplier = 1 + STREAK_BONUS_PER_DAY * Math.min(Math.max(0, streak), MAX_STREAK_BONUS_DAYS);
  return Math.round(base * (1 + early) * streakMultiplier);
}

/** XP for a completed focus session — scales with duration, floored so short sessions still count. */
export function focusSessionXp(durationMinutes: number): number {
  return Math.max(8, Math.round(durationMinutes * 1.2));
}

/** Awarded once per calendar day with any completed work session or objective — reinforces the streak. */
export const DAILY_ACTIVITY_BONUS_XP = 15;
