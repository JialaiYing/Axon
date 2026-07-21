/**
 * Unlockable dashboard backgrounds. Default is a solid canvas; React Bits
 * ambient effects unlock as the user levels up and keep their normal palettes.
 */

export type BackgroundId = "solid" | "aurora" | "lines" | "ether" | "lightfall" | "mesh";

export interface BackgroundPalette {
  label: string;
  /** Solid canvas under / instead of the effect. */
  base: string;
  gradient: string[];
}

export interface BackgroundVariant {
  id: BackgroundId;
  name: string;
  description: string;
  /** Minimum level (1–30) required to unlock. */
  unlockLevel: number;
  dark: BackgroundPalette;
  light: BackgroundPalette;
}

/** Dark-mode default canvas — 75% black. */
export const DARK_BG_BASE = "#404040";
/** Light-mode default canvas — soft near-white counterpart. */
export const LIGHT_BG_BASE = "#f0f0f0";

export const BACKGROUNDS: BackgroundVariant[] = [
  {
    id: "solid",
    name: "Solid",
    description: "Clean flat canvas — unlocked from day one.",
    unlockLevel: 1,
    dark: {
      label: "75% black",
      base: DARK_BG_BASE,
      gradient: [DARK_BG_BASE, DARK_BG_BASE, DARK_BG_BASE],
    },
    light: {
      label: "Soft white",
      base: LIGHT_BG_BASE,
      gradient: [LIGHT_BG_BASE, LIGHT_BG_BASE, LIGHT_BG_BASE],
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Soft ambient wash with floating lines.",
    unlockLevel: 3,
    dark: {
      label: "Midnight aurora",
      base: "#08090c",
      gradient: ["#e945f5", "#6f6f6f", "#6a6a6a"],
    },
    light: {
      label: "Day aurora",
      base: "#f7f6f2",
      gradient: ["#93c5fd", "#c4b5fd", "#e2e8f0"],
    },
  },
  {
    id: "lines",
    name: "Floating Lines",
    description: "Animated line field (React Bits FloatingLines).",
    unlockLevel: 5,
    dark: {
      label: "Neon lines",
      base: "#08090c",
      gradient: ["#3b82f6", "#a855f7", "#64748b"],
    },
    light: {
      label: "Soft lines",
      base: "#f7f6f2",
      gradient: ["#60a5fa", "#a78bfa", "#94a3b8"],
    },
  },
  {
    id: "ether",
    name: "Liquid Ether",
    description: "Fluid color fields — unlock at Scholar (level 7).",
    unlockLevel: 7,
    dark: {
      label: "Deep ether",
      base: "#08090c",
      gradient: ["#1e1b4b", "#312e81", "#4c1d95"],
    },
    light: {
      label: "Mist ether",
      base: "#f7f6f2",
      gradient: ["#e0e7ff", "#ddd6fe", "#fce7f3"],
    },
  },
  {
    id: "lightfall",
    name: "Lightfall",
    description: "Cascading light beams — unlock at Adept (level 10).",
    unlockLevel: 10,
    dark: {
      label: "Night fall",
      base: "#0f172a",
      gradient: ["#A6C8FF", "#5227FF", "#FF9FFC"],
    },
    light: {
      label: "Morning fall",
      base: "#f8fafc",
      gradient: ["#bfdbfe", "#c4b5fd", "#f8fafc"],
    },
  },
  {
    id: "mesh",
    name: "Mesh Gradient",
    description: "Static premium mesh — unlock at Mentor (level 16).",
    unlockLevel: 16,
    dark: {
      label: "Void mesh",
      base: "#0b1020",
      gradient: ["#0b1020", "#1e293b", "#312e81"],
    },
    light: {
      label: "Paper mesh",
      base: "#f1f5f9",
      gradient: ["#f1f5f9", "#dbeafe", "#ede9fe"],
    },
  },
];

export function isBackgroundUnlocked(id: BackgroundId, level: number): boolean {
  const bg = BACKGROUNDS.find((b) => b.id === id);
  if (!bg) return false;
  return level >= bg.unlockLevel;
}

export function unlockedBackgrounds(level: number): BackgroundVariant[] {
  return BACKGROUNDS.filter((b) => level >= b.unlockLevel);
}
