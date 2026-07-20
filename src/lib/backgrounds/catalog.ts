/**
 * Unlockable dashboard backgrounds (React Bits–style ambient effects already
 * in the repo). Each variant has dark + light palettes.
 *
 * Registry note: add to Cursor MCP/config when available:
 * { "registries": { "@react-bits": "https://reactbits.dev/r/{name}.json" } }
 */

export type BackgroundId = "aurora" | "lines" | "ether" | "lightfall" | "mesh";

export interface BackgroundVariant {
  id: BackgroundId;
  name: string;
  description: string;
  /** Minimum level (1–30) required to unlock. */
  unlockLevel: number;
  dark: { label: string; gradient: string[] };
  light: { label: string; gradient: string[] };
}

export const BACKGROUNDS: BackgroundVariant[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Default soft ambient wash — unlocked from day one.",
    unlockLevel: 1,
    dark: { label: "Midnight aurora", gradient: ["#e945f5", "#6f6f6f", "#6a6a6a"] },
    light: { label: "Day aurora", gradient: ["#93c5fd", "#c4b5fd", "#e2e8f0"] },
  },
  {
    id: "lines",
    name: "Floating Lines",
    description: "Animated line field (React Bits FloatingLines).",
    unlockLevel: 1,
    dark: { label: "Neon lines", gradient: ["#3b82f6", "#a855f7", "#64748b"] },
    light: { label: "Soft lines", gradient: ["#60a5fa", "#a78bfa", "#94a3b8"] },
  },
  {
    id: "ether",
    name: "Liquid Ether",
    description: "Fluid color fields — unlock at Scholar (level 7).",
    unlockLevel: 7,
    dark: { label: "Deep ether", gradient: ["#1e1b4b", "#312e81", "#4c1d95"] },
    light: { label: "Mist ether", gradient: ["#e0e7ff", "#ddd6fe", "#fce7f3"] },
  },
  {
    id: "lightfall",
    name: "Lightfall",
    description: "Cascading light beams — unlock at Adept (level 10).",
    unlockLevel: 10,
    dark: { label: "Night fall", gradient: ["#0f172a", "#1d4ed8", "#7c3aed"] },
    light: { label: "Morning fall", gradient: ["#f8fafc", "#bfdbfe", "#c4b5fd"] },
  },
  {
    id: "mesh",
    name: "Mesh Gradient",
    description: "Static premium mesh — unlock at Mentor (level 16).",
    unlockLevel: 16,
    dark: { label: "Void mesh", gradient: ["#0b1020", "#1e293b", "#312e81"] },
    light: { label: "Paper mesh", gradient: ["#f1f5f9", "#dbeafe", "#ede9fe"] },
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
