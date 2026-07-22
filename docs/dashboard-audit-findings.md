# Dashboard audit findings (post-fix)

**Surface:** `/dashboard` — [`dashboard-overview.tsx`](../src/components/dashboard/dashboard-overview.tsx) + [`today-agenda-panel.tsx`](../src/components/dashboard/today-agenda-panel.tsx)  
**Date:** 2026-07-22  
**Constraint reviewed against:** aesthetics-only (no new features)

---

## User goal

Glance-and-go: see what matters today, take one action (Start focus / open board), leave. Rank/goals/recent are secondary support.

---

## Strengths

- Agenda remains the sole elevation-2 glass hero; Up next and stats stay flat/supporting.
- Week chart stays neutral data (border-strong / faint foreground fill) — correctly separated from action accent.
- Progress bars now use neutral `foreground` fill globally ([`progress-bar.tsx`](../src/components/ui/progress-bar.tsx)); Start focus stays accent — correct action vs data mapping.
- Supporting trio sits in one shared `Panel` with equal columns and internal dividers; Rank uses the same header / body / footer rhythm as Personal goals (XP in footer, not floating in empty stretch).

---

## Findings

- **[Should fix]** Recent column has no footer strip while Goals (links) and Rank (XP bar) do — footers won’t share a pixel-aligned baseline when content heights differ. Acceptable for now; only revisit if the band still feels uneven with real data.
- **[Should fix]** Hardcoded indigo glows remain outside this page (`rgba(94,106,210,…)` in calendar, xp-burst, tilt-card, tabs). Navigating away from `/dashboard` can reintroduce the “fake blue” feel.
- **[Nice to have]** Primary `Button` default still uses elevation shadow on `sm` Start focus — quieter than before relative to bars, but could drop shadow on dashboard `size="sm"` if the CTA still feels loud in isolation.
- **[Nice to have]** `--color-secondary` violet unused on this page; leave until a global palette pass.

---

## Explicit non-findings (pushback held)

- Do **not** recolor Start focus to match the chart. Chart = data = neutral; button = action = accent.
- Do **not** revert trio to `items-start` short Rank or to `mt-auto` XP float — both were failed extremes; the shared Panel + matched column structure is the correct fix.

---

## Recommended next step

Optional: `/aesthetics-only` on hardcoded indigo glow call sites app-wide (calendar / xp-burst / tilt), **or** stop and live with `/dashboard` for a few days before another hierarchy pass.

**Named pattern match:** Linear — neutrals first, one accent action, data as quiet strokes/fills, supporting metrics in one divided band.
