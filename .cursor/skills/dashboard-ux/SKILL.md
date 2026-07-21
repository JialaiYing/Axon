---
name: dashboard-ux
description: Design and evaluate complex dashboard/analytics layouts — information density, data visualization, card hierarchy, and productivity workflows in the style of Linear, Notion, Vercel, Stripe, Framer, and Raycast. Use when working on Axon's Dashboard, Analytics, Kanban, Calendar, or Goals pages, or any data-dense screen.
metadata:
  scope: project
---

# Dashboard UX Design (Axon)

Axon's premium bar is Linear / Notion / Vercel / Framer / Raycast / Stripe. Judge every dashboard-style screen against how those products actually solve density, hierarchy, and data viz — not against generic "AI dashboard" defaults (evenly-sized card grids, no visual hierarchy, one chart type repeated everywhere).

## Reference patterns from the target products

- **Linear** — near-zero visual noise; one accent color used only for state/action, never decoration; dense data rendered as flat rows with generous *vertical* rhythm rather than boxed cards; a single dominant focal element per view.
- **Vercel (dashboard/analytics)** — every metric card pairs a big number with a small inline trend (sparkline or %Δ vs. previous period) — never a bare number.
- **Stripe (dashboard)** — clear "primary metric + supporting metrics" hierarchy: one large chart/number dominates the top of the fold, everything else is visibly secondary in size and color weight.
- **Notion** — information architecture over decoration; sparse color, heavy reliance on typographic hierarchy (weight/size) and whitespace instead of borders/shadows to separate sections.
- **Raycast/Framer** — restraint in motion: one signature moment (page load, a key transition) rather than animating everything; keyboard-first affordances even in a mouse-driven UI.

## Density vs. readability

- Prefer Axon's existing 4/8px-multiple spacing rhythm (`gap-4`, `gap-5`, `p-5`, `p-6` seen throughout `dashboard-overview.tsx`) — don't introduce arbitrary values.
- Dashboard/Analytics screens can run denser (`gap-4`, `text-xs`/`text-[11px]` metadata) than Kanban card content or Settings forms, which need more breathing room since users read longer there.
- A screen with 6+ card-level sections (current Dashboard has ~8) needs an explicit **size hierarchy**: one hero element at 1.5-2x the visual weight of the rest, not N equally-sized cards. Check this before adding another card-shaped section to any page.

## Card hierarchy checklist

Before adding a new dashboard section, ask:
- Does this deserve its own bordered card, or is it better as a row inside an existing panel? (Not everything needs `rounded-2xl border` — over-boxing is the single most common way AI-generated dashboards look generic.)
- Is this the 1st, 2nd, or 3rd most important thing on the page? Its size/position/color weight must match that rank.
- Reuse `Panel` (`src/components/ui/panel.tsx`, variants `standard`/`glass`/`interactive`) instead of a bespoke wrapper — do not reintroduce a fourth "elevated card" implementation (see the `GlassPanel` duplication already flagged in `dashboard-overview.tsx`).

## Data visualization

- A bare number is the weakest way to show a metric. Prefer, in order of polish: number + trend arrow/%Δ > number + inline sparkline > number + full chart. Axon's `StatCard` (`dashboard-overview.tsx`) currently only does the first tier with a static hint string — upgrading to a 7-day-vs-prior-7-day delta is high-leverage, low-risk.
- Chart choice: `recharts` `AreaChart` (already used for "Focus this week") is right for a single continuous trend; use bar charts for compare-across-categories (e.g. minutes per subject), and avoid pie/donut charts for more than 4-5 segments.
- Always theme charts through the existing CSS variables (`var(--color-accent)`, `var(--color-border)`, `var(--color-muted-foreground)` — see the `ChartTooltip`/`AreaChart` setup in `dashboard-overview.tsx`) so charts stay correct across the dark/light theme toggle. Never hardcode hex in a chart.
- Empty/zero-data states for charts must match the app's existing pattern (icon + 1-line copy + CTA) — see the "No focus sessions yet this week" block.

## Axon page inventory — what "premium" means per page

- **Dashboard** — glance-and-go: today's agenda is correctly the primary surface (`TodayAgendaPanel`); needs a clearer visual size hierarchy above the stat-card row.
- **Kanban** — drag-and-drop board; premium bar = Linear-grade card density, instant drag feedback, no layout jank on drop.
- **Calendar** — month/week/day views; premium bar = Notion Calendar-grade clarity of overlapping events at a glance.
- **Flashcards** — 3D gallery + study/test views; premium bar = Framer-grade motion restraint (the 3D gallery is the one "signature moment" — don't compete with it elsewhere on that page).
- **Pomodoro** — focus timer; premium bar = Raycast-grade minimalism, near-zero chrome while a session is active.
- **Analytics** — charts-first; premium bar = Vercel Analytics-grade trend clarity (deltas, comparisons, not just totals).
- **Goals** — progress tracking; premium bar = Linear-grade progress-bar/streak treatment, already partially achieved via `ProgressBar` + `goalPaceStatus`.
- **Settings** — forms; premium bar = Stripe-grade calm forms — generous spacing, no dashboard density rules here.

## Output format

When auditing/designing a dashboard-style page: identify the intended hero element, rank every other section by importance, flag any bare-number metric that should carry a trend, and check spacing/card-boxing against the checklist above. Hand off to `premium-frontend` for the visual execution and `motion-design` for any hierarchy-supporting motion (e.g. the hero element animating in first).
