/**
 * Unlockable dark-only app palettes.
 * Hex values: docs/roadmap/theme-palettes.md — do not invent colors here.
 */

import { isDevUnlockAll } from "@/lib/dev/unlocks";

export type PaletteId =
  | "axon"
  | "tokyo-night"
  | "nord"
  | "everforest"
  | "gruvbox"
  | "rose-pine";

export interface PaletteVariant {
  id: PaletteId;
  name: string;
  description: string;
  /** Minimum level (1–30) required to unlock. */
  unlockLevel: number;
  /** Settings / Rank preview swatch. */
  preview: { background: string; accent: string };
}

export const DEFAULT_PALETTE_ID: PaletteId = "axon";

/** Starter palettes available at level 1 (not gated unlock notifications). */
export const STARTER_PALETTE_IDS: readonly PaletteId[] = [
  "axon",
  "tokyo-night",
  "nord",
] as const;

export const PALETTES: PaletteVariant[] = [
  {
    id: "axon",
    name: "Axon Dark",
    description: "Default quiet near-black — always available.",
    unlockLevel: 1,
    preview: { background: "#0a0a0a", accent: "#5b8def" },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "Deep navy with soft blue chrome.",
    unlockLevel: 1,
    preview: { background: "#16161e", accent: "#7aa2f7" },
  },
  {
    id: "nord",
    name: "Nord",
    description: "Polar night surfaces with frost accent.",
    unlockLevel: 1,
    preview: { background: "#2e3440", accent: "#88c0d0" },
  },
  {
    id: "everforest",
    name: "Everforest Dark",
    description: "Soft green forest chrome.",
    unlockLevel: 3,
    preview: { background: "#232a2e", accent: "#a7c080" },
  },
  {
    id: "gruvbox",
    name: "Gruvbox Dark",
    description: "Warm brown surfaces with orange accent.",
    unlockLevel: 7,
    preview: { background: "#1d2021", accent: "#fe8019" },
  },
  {
    id: "rose-pine",
    name: "Rosé Pine",
    description: "Muted plum surfaces with soft iris accent.",
    unlockLevel: 13,
    preview: { background: "#191724", accent: "#c4a7e7" },
  },
];

const PALETTE_IDS = new Set<string>(PALETTES.map((p) => p.id));

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === "string" && PALETTE_IDS.has(value);
}

export function getPalette(id: PaletteId): PaletteVariant {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
}

export function isPaletteUnlocked(id: PaletteId, level: number): boolean {
  if (isDevUnlockAll()) return true;
  const palette = getPalette(id);
  return level >= palette.unlockLevel;
}

/**
 * Gated unlocks only (excludes starter trio) — for notify watchers.
 * Uses real level only — developer unlock-all must not spam unlock notifications.
 */
export function unlockedUnlockablePalettes(level: number): PaletteVariant[] {
  return PALETTES.filter(
    (p) => !STARTER_PALETTE_IDS.includes(p.id) && level >= p.unlockLevel
  );
}

export function resolveEquippablePaletteId(
  stored: unknown,
  level: number
): PaletteId {
  if (!isPaletteId(stored)) return DEFAULT_PALETTE_ID;
  if (!isPaletteUnlocked(stored, level)) return DEFAULT_PALETTE_ID;
  return stored;
}
