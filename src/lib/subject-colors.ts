/**
 * Subject-owned board / Analytics colors.
 * Fixed hex list — independent of theme palettes (`theme-palettes.md`).
 * Same subject always maps to the same color across Board, Calendar, and Analytics.
 */

export const SUBJECT_COLOR_PALETTE = [
  "#6b9ef5", // soft steel (distinct from accent chrome)
  "#8b7ec8", // soft violet
  "#3dba6e", // green
  "#e0a03a", // amber
  "#d97757", // terracotta (not danger red)
  "#2dd4bf", // teal
  "#ec4899", // pink
  "#94a3b8", // slate
] as const;

/** @deprecated Prefer SUBJECT_COLOR_PALETTE — kept as alias for older imports. */
export const OBJECTIVE_COLORS = SUBJECT_COLOR_PALETTE;

export function normalizeSubjectKey(subject: string): string {
  const trimmed = subject.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : "general";
}

function hashSubject(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Persistent color for a subject string (case/whitespace-insensitive). */
export function colorForSubject(subject: string): string {
  const key = normalizeSubjectKey(subject);
  const index = hashSubject(key) % SUBJECT_COLOR_PALETTE.length;
  return SUBJECT_COLOR_PALETTE[index]!;
}
