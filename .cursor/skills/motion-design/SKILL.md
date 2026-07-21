---
name: motion-design
description: Design and implement purposeful motion for Axon — page transitions, hover states, micro-interactions, scroll animations, and loading states using Framer Motion, GSAP, and Lenis. Use when adding, reviewing, or planning any animation or interactive motion in Axon.
metadata:
  scope: project
---

# Motion Design (Axon)

Axon's stack: `framer-motion` (primary, component-level), `gsap` + `lenis` (scroll/landing-page choreography), `react-parallax-tilt` (card tilt). Every animation must justify itself against the "calm motion" rule already stated in `globals.css`: motion should never be consciously noticed as excessive — it should feel inevitable.

## Timing tokens (reuse, don't invent new curves)

Axon centralizes its motion language in **`src/lib/motion.ts`** — always import from there, never hand-roll a new easing curve or duration:

```ts
import { EASE, DURATION, STAGGER, SPRING, enterVariants, staggerContainer } from "@/lib/motion";
```

- `EASE` — the one easing curve used everywhere (`[0.21, 0.47, 0.32, 0.98]`, a soft confident deceleration)
- `DURATION.fast` (0.15s) — micro-interactions: hovers, toggles, icon nudges
- `DURATION.base` (0.28s) — default UI transitions: dialogs, dropdowns, small reveals
- `DURATION.section` (0.55s) — section/page entrances
- `STAGGER.tight/base/loose` (0.06/0.08/0.1s) — `staggerChildren` for orchestrated groups
- `SPRING.hover/tilt/enter/magnetic` — spring presets for pointer-driven motion (tilt, magnetic, drag)
- `enterVariants(y?)` / `enterTransition(delay?)` / `staggerContainer(stagger?)` — ready-made Framer Motion variant helpers for the standard "fade + drift up + hair of scale" entrance

Any component still defining its own local `EASE` constant or bespoke stagger/variant object (several pre-dated this shared module) should be migrated to import from `src/lib/motion` instead — that drift is exactly the kind of inconsistency this skill exists to prevent.

Duration guide (align new animations to the closest tier):
- Micro-interaction (hover/press/toggle): `DURATION.fast` (150ms)
- State change / dialog / small reveal: `DURATION.base` (280ms)
- Section/page entrance: `DURATION.section` (550ms)
- Ambient/looping (e.g. `pulse-glow` in `globals.css`): 2-3s, always subtle, never a hard blink

## Reduced motion — non-negotiable

Every new animation must respect `prefers-reduced-motion`. Axon already does this two ways — follow both:
1. Global CSS fallback in `globals.css` (`@media (prefers-reduced-motion: reduce)` forces near-zero durations on everything as a safety net).
2. Explicit `useReducedMotion()` checks in components (see `DashboardOverview`: `initial={prefersReducedMotion ? false : "hidden"}`, and `isAnimationActive={!prefersReducedMotion}` on the Recharts `Area`). Any new Framer Motion animation or chart animation needs this same explicit check, not just reliance on the CSS fallback.

## Where to spend motion budget

Favor **one signature moment per screen** over animating everything:
- **Page/section load**: staggered reveal using the `container`/`item` pattern above — already the house style, keep using it.
- **Hover/press feedback**: subtle scale (1.02-1.05) or border/shadow-elevation step-up (Axon's convention: `hover:border-border-strong hover:shadow-[var(--shadow-elevation-2)]`) — never a layout-shifting transform that moves neighboring content.
- **Completion/reward moments** (finishing a Pomodoro, completing an objective, hitting a goal/streak) — the highest-leverage place for something more expressive (confetti, scale+glow), because it reinforces the gamification loop (`product-design-thinking`).
- **Scroll-triggered reveals**: reserve GSAP+Lenis for the marketing/landing page (`src/components/landing/`); the authenticated dashboard shell should stay calmer per its "quiet luxury" brief — don't add scroll-triggered animation to Dashboard/Kanban/Analytics.
- **Loading states**: `Skeleton` components matching the real layout shape (see `LoadingState` in `dashboard-overview.tsx`) rather than a generic spinner — this preserves layout and perceived performance.

## Technical rules

- Animate only `transform`/`opacity` (GPU-accelerated) for anything that runs on scroll or frequently — never animate `width`/`height`/`top`/`left` directly.
- Framer Motion `variants` + `staggerChildren` for orchestrated groups (the house pattern); plain CSS `transition` for simple hover/focus states (cheaper, no JS needed) — see how `panel.tsx`'s `panelVariants` uses CSS transitions, not Framer Motion, for hover.
- Tilt (`react-parallax-tilt`, wrapped as `TiltCard`) is reserved for card-level hover affordance on the Dashboard's stat/goal/rank cards — don't add it to dense list rows or anything draggable (it will visually fight `@dnd-kit`'s drag transform on Kanban cards).

## Output format

When asked for a motion plan: name the ONE signature moment for the surface in question, list every other interaction as a micro-interaction/transition/loading tier with a specific duration+easing from the tokens above, and explicitly confirm the reduced-motion path for each. No code until the plan is confirmed unless implementation was explicitly requested.
