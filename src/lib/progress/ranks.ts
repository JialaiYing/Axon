/**
 * The 30-level rank ladder: 10 named ranks, each split into three tiers
 * (I/II/III). Level 1 is Novice I, level 30 is Polymath III.
 */
export const MAX_LEVEL = 30;
export const LEVELS_PER_RANK = 3;

export const RANK_NAMES = [
  "Novice",
  "Apprentice",
  "Scholar",
  "Adept",
  "Fellow",
  "Mentor",
  "Sage",
  "Luminary",
  "Magister",
  "Polymath",
] as const;

/**
 * Trophy metal per rank (0-indexed) — iron → emerald.
 * Uses design tokens only; locked ranks dim via opacity in UI.
 */
export const RANK_TROPHY_CLASS = [
  "text-muted-foreground", // Novice — iron
  "text-muted", // Apprentice — pewter
  "text-warning/55", // Scholar — copper
  "text-warning/80", // Adept — bronze
  "text-foreground/70", // Fellow — silver
  "text-accent/85", // Mentor — steel
  "text-warning", // Sage — gold
  "text-accent", // Luminary — sapphire
  "text-secondary", // Magister — amethyst
  "text-success", // Polymath — emerald
] as const;

/** Tailwind color class for a rank’s trophy (1-indexed rankIndex from RankInfo). */
export function rankTrophyClass(rankIndex: number): string {
  const i = Math.min(RANK_TROPHY_CLASS.length, Math.max(1, Math.round(rankIndex))) - 1;
  return RANK_TROPHY_CLASS[i] ?? RANK_TROPHY_CLASS[0];
}

const TIER_LABELS = ["I", "II", "III"] as const;

export interface RankInfo {
  /** Base rank name, e.g. "Scholar". */
  name: string;
  /** 1-indexed tier within the rank (1, 2, or 3). */
  tier: 1 | 2 | 3;
  /** Roman-numeral tier label, e.g. "II". */
  tierLabel: string;
  /** Full display label, e.g. "Scholar II". */
  label: string;
  /** 1-indexed position of the rank itself among the 10 ranks. */
  rankIndex: number;
}

/** Resolves the rank + tier for a given absolute level (1-30, clamped). */
export function rankInfoForLevel(level: number): RankInfo {
  const clamped = Math.min(MAX_LEVEL, Math.max(1, Math.round(level)));
  const rankIndex = Math.ceil(clamped / LEVELS_PER_RANK);
  const tier = (((clamped - 1) % LEVELS_PER_RANK) + 1) as 1 | 2 | 3;
  const name = RANK_NAMES[rankIndex - 1] ?? RANK_NAMES[0];
  const tierLabel = TIER_LABELS[tier - 1] ?? TIER_LABELS[0];
  return {
    name,
    tier,
    tierLabel,
    label: `${name} ${tierLabel}`,
    rankIndex,
  };
}
