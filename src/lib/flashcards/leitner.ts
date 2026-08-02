/**
 * Leitner-box spaced repetition for flashcards.
 * Boxes 1–5 with fixed day intervals — not SM-2.
 */

import type { Flashcard, FlashcardSet } from "@/types";

export const LEITNER_MIN_BOX = 1;
export const LEITNER_MAX_BOX = 5;

/** Days until next review after landing in each box (1-indexed). */
export const LEITNER_INTERVAL_DAYS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 14,
};

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface DueCardRef {
  setId: string;
  setTitle: string;
  subject: string;
  card: Flashcard;
}

export function clampLeitnerBox(value: unknown): LeitnerBox {
  const n = typeof value === "number" ? Math.round(value) : LEITNER_MIN_BOX;
  return Math.min(LEITNER_MAX_BOX, Math.max(LEITNER_MIN_BOX, n)) as LeitnerBox;
}

export function addDaysIso(from: Date, days: number): string {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** New / never-scheduled cards are due immediately in box 1. */
export function defaultLeitnerFields(now = new Date()): Pick<Flashcard, "box" | "dueAt"> {
  return { box: 1, dueAt: now.toISOString() };
}

export function isCardDue(card: Flashcard, now = new Date()): boolean {
  const due = new Date(card.dueAt).getTime();
  if (Number.isNaN(due)) return true;
  return due <= now.getTime();
}

export function applyLeitnerReview(
  card: Flashcard,
  knew: boolean,
  now = new Date()
): Flashcard {
  const current = clampLeitnerBox(card.box);
  const nextBox: LeitnerBox = knew
    ? (Math.min(LEITNER_MAX_BOX, current + 1) as LeitnerBox)
    : 1;
  const interval = LEITNER_INTERVAL_DAYS[nextBox] ?? 0;
  const correctCount = card.correctCount + (knew ? 1 : 0);
  const incorrectCount = card.incorrectCount + (knew ? 0 : 1);
  const attempts = correctCount + incorrectCount;

  return {
    ...card,
    box: nextBox,
    dueAt: addDaysIso(now, interval),
    correctCount,
    incorrectCount,
    masteryPercent: attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0,
  };
}

/** Due cards across active (non-recycled) sets, oldest due first then box ascending. */
export function collectDueCards(
  sets: FlashcardSet[],
  now = new Date(),
  setIdFilter?: string
): DueCardRef[] {
  const out: DueCardRef[] = [];
  for (const set of sets) {
    if (set.recycledAt) continue;
    if (setIdFilter && set.id !== setIdFilter) continue;
    for (const card of set.cards) {
      if (!isCardDue(card, now)) continue;
      out.push({
        setId: set.id,
        setTitle: set.title,
        subject: set.subject,
        card,
      });
    }
  }
  out.sort((a, b) => {
    const da = new Date(a.card.dueAt).getTime();
    const db = new Date(b.card.dueAt).getTime();
    if (da !== db) return da - db;
    return a.card.box - b.card.box;
  });
  return out;
}

export function countDueCards(sets: FlashcardSet[], now = new Date(), setIdFilter?: string): number {
  return collectDueCards(sets, now, setIdFilter).length;
}

/** Count of cards currently in each Leitner box (active sets only). */
export function boxBreakdown(
  sets: FlashcardSet[],
  setIdFilter?: string
): Record<LeitnerBox, number> {
  const counts: Record<LeitnerBox, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const set of sets) {
    if (set.recycledAt) continue;
    if (setIdFilter && set.id !== setIdFilter) continue;
    for (const card of set.cards) {
      const box = clampLeitnerBox(card.box);
      counts[box] += 1;
    }
  }
  return counts;
}

/** Earliest future dueAt across cards (null if none scheduled ahead). */
export function getNextDueAt(
  sets: FlashcardSet[],
  now = new Date(),
  setIdFilter?: string
): string | null {
  let next: number | null = null;
  for (const set of sets) {
    if (set.recycledAt) continue;
    if (setIdFilter && set.id !== setIdFilter) continue;
    for (const card of set.cards) {
      const t = new Date(card.dueAt).getTime();
      if (Number.isNaN(t) || t <= now.getTime()) continue;
      if (next === null || t < next) next = t;
    }
  }
  return next === null ? null : new Date(next).toISOString();
}

/** Short human label for a due timestamp relative to now. */
export function formatRelativeDue(iso: string, now = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "soon";
  const diffMs = t - now.getTime();
  if (diffMs <= 0) return "now";
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return mins <= 1 ? "in a minute" : `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
  const days = Math.round(hours / 24);
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/** Days until next review after a card lands in `box` (for post-grade cue). */
export function intervalDaysForBox(box: number): number {
  return LEITNER_INTERVAL_DAYS[clampLeitnerBox(box)] ?? 0;
}
