# Kanban page audit findings (post-fix)

**Surface:** `/kanban` — board columns + cards  
**Date:** 2026-07-22  
**Aligned with:** dashboard polish (neutrals first, accent = action, no indigo glow)

---

## User goal

Capture and advance study work: scan columns, drag status, create/edit, schedule when needed. Scanability over decoration.

---

## Strengths (after this pass)

- Board cards no longer use `MagicCard` / stars / border glow / hardcoded indigo.
- Columns use `Panel variant="standard"` (not glass) — one elevation family with cards.
- Drop feedback is token-only (`border-accent/50`, `bg-accent-muted/20`) — accent as drag affordance only.
- Priority is a colored **dot** + quiet meta text (same language as dashboard lists), not accent Badge pills.
- ProgressBar shows only when `progress > 0` or subtasks exist; fill stays neutral.
- Schedule controls are neutral borders (warning only when overdue); title hover is not accent.
- Primary accent CTA remains **New objective** in the toolbar.
- Recycle bin / objective dialogs were intentionally left alone (not Critical path).

---

## Findings (remaining)

- **[Should fix]** Medium priority still maps to `bg-accent` / `text-accent` in [`kanban-utils.ts`](../src/lib/kanban-utils.ts) (`priorityDotClass` / `priorityTextClass`). Tiny dots are acceptable; if accent should mean *only* actions app-wide, retune medium to a neutral/warm gray in a utils pass (affects dashboard lists too).
- **[Should fix]** Calendar still ships hardcoded `rgba(94,106,210,…)` glows — next surface for the same rules.
- **[Nice to have]** Objective form / recycle dialog polish — deferred; recycle list rows are already closer to Linear than the old board was.
- **[Nice to have]** Card still carries created/due/time meta rows — denser than Linear issues; further compression is optional if boards feel tall with real data.

---

## Explicit non-findings

- Do **not** restore MagicCard “premium” effects on dense boards.
- Do **not** put accent fill back on schedule pills or progress bars.
- Drop-state accent border is correct (affordance), not decorative chrome.

---

## Recommended next step

`/audit-page` then `/aesthetics-only` on **Calendar** (same indigo glow debt), using this Kanban pass as the template.

**Named pattern:** Linear — quiet columns, compact cards, accent on primary create + drag feedback only.
