# Calendar audit findings (post-fix)

**Surface:** `/calendar` — grid views + Agenda / Unscheduled rail  
**Date:** 2026-07-22  
**Passes:** aesthetics-only (Kanban template) → product/UX (Notion Calendar target)

---

## User goal

Plan study time on a **grid-first** calendar: scan the period, place/move blocks, glance Agenda when needed. Side chrome stays sparse; typography carries the date; accent only on today, selection, and drag.

---

## Strengths (after this pass)

- Period title is the page H1; “Calendar” is a quiet eyebrow ([`calendar-header.tsx`](../src/components/calendar/calendar-header.tsx)).
- Agenda + Unscheduled use `Panel variant="standard"` with flat rows and priority dots (no glass / Badge pills / indigo glow).
- Month/week drop and today pills use token accent only; event chips/blocks are neutral surface with accent reserved for live/drag.
- Loading uses [`CalendarSkeleton`](../src/components/ui/skeleton.tsx) (grid + rail), not Kanban columns.
- View entrances and rail collapse respect `prefers-reduced-motion`.
- Unscheduled items are draggable onto day columns (default 9:00); Schedule popover remains for precise times.
- Mobile: Agenda/Unscheduled sit behind a disclosure so the grid stays first viewport.
- Month “+N more” expands/collapses in-cell; per-day hover “+” removed — primary Add is header; week/day empty-slot click remains for timed add.
- Export demoted to ghost; rail width tightened (`280px`).

---

## Findings (remaining)

- **[Should fix]** Unscheduled → week/day drop always lands at 9:00 (no pointer-Y snap). Acceptable MVP; richer drop targeting needs pointer→minutes mapping.
- **[Should fix]** Medium priority dots still use accent in shared `priorityDotClass` — same Kanban/dashboard debt.
- **[Nice to have]** Event actions menu still uses Sparkles + heavy elevation shadow; quieter icon/shadow would match chips.
- **[Nice to have]** Live timers in Agenda remain the only “carded” rail blocks (controls need a container) — fine while running; avoid expanding that pattern.

---

## Deferred recommendations (would need product scope)

- Multi-day event spanning / all-day lane
- External calendar sync
- Keyboard create-at-slot without opening the full add dialog

---

## Explicit non-findings

- Do **not** restore glass Agenda or indigo event washes.
- Do **not** put Badge priority pills back on rail rows.
- Empty week/day click-to-add is intentional (timed placement); month day “+” was the redundant entry point removed.

---

## Named pattern

**Notion Calendar** — grid dominant, sparse side chrome, date typography, accent on today / selection / drag only.
