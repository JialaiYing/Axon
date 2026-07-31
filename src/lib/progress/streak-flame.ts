/**
 * Visual tiers for streak flames (Duolingo-style progression).
 * Always filled with color; heat, size, and glow intensify with streak length.
 */

export type StreakFlameTierId =
  | "dormant"
  | "spark"
  | "ember"
  | "flame"
  | "blaze"
  | "inferno"
  | "legend";

export interface StreakFlameVisual {
  tier: StreakFlameTierId;
  /** Relative icon scale (1 = base size for the chosen `size` prop). */
  scale: number;
  /** Tailwind text/color classes for the flame. */
  colorClass: string;
  /** Soft colored halo behind the icon. */
  glow: boolean;
  /** Gentle idle flicker when the streak is strong. */
  pulse: boolean;
  /** Short accessible label for the current heat level. */
  label: string;
}

/**
 * Maps streak days → scale, color, and motion intensity.
 * Day 0 stays a dim filled ember so the icon is never a hollow outline.
 */
export function getStreakFlameVisual(days: number): StreakFlameVisual {
  const d = Math.max(0, Math.floor(days));

  // Continuous size curve — grows quickly early, then asymptotes (~1.75×).
  const scale =
    d === 0 ? 0.85 : Math.min(1.75, 0.95 + Math.log2(d + 1) * 0.24);

  if (d === 0) {
    return {
      tier: "dormant",
      scale,
      colorClass: "text-warning/45",
      glow: false,
      pulse: false,
      label: "No streak yet",
    };
  }
  if (d < 3) {
    return {
      tier: "spark",
      scale,
      colorClass: "text-warning/75",
      glow: false,
      pulse: false,
      label: "Spark",
    };
  }
  if (d < 7) {
    return {
      tier: "ember",
      scale,
      colorClass: "text-warning",
      glow: true,
      pulse: false,
      label: "Ember",
    };
  }
  if (d < 14) {
    return {
      tier: "flame",
      scale,
      colorClass: "text-warning",
      glow: true,
      pulse: false,
      label: "Flame",
    };
  }
  if (d < 30) {
    return {
      tier: "blaze",
      scale,
      colorClass: "text-warning",
      glow: true,
      pulse: true,
      label: "Blaze",
    };
  }
  if (d < 60) {
    return {
      tier: "inferno",
      scale,
      colorClass: "text-danger",
      glow: true,
      pulse: true,
      label: "Inferno",
    };
  }
  return {
    tier: "legend",
    scale,
    colorClass: "text-danger",
    glow: true,
    pulse: true,
    label: "Legend",
  };
}
