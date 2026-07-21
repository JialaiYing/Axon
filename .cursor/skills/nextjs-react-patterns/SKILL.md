---
name: nextjs-react-patterns
description: Apply Next.js 15 App Router, React 18, and Tailwind v4 architecture and performance best practices specific to Axon's codebase — code-splitting heavy libraries, memoization discipline, hydration safety with localStorage state, and scalable component structure. Use when writing, reviewing, or refactoring Axon components, hooks, or pages.
metadata:
  scope: project
---

# React / Next.js / Tailwind Patterns (Axon)

Axon-specific architecture discipline — see `claude.md` for the full domain-hook/store-key reference; this skill covers *how* to write the React/Next code well, not *what* the data model is.

## Component structure (match existing convention)

- **Thin pages, fat components**: `app/(app)/{feature}/page.tsx` just renders one feature component (e.g. `<KanbanBoard />`). Business logic lives in domain hooks (`use-*.ts`) and feature components, never in the page file.
- **Memoize expensive derived data**, not components reflexively: `dashboard-overview.tsx` already does this correctly (`useMemo` for `streak`, `weekData`, `queue`, `recent`; `React.memo` for `StatCard`, `GoalRow`, `ChartTooltip`). Follow this exact pattern for new derived values — wrap the computation in `useMemo`, wrap pure presentational subcomponents that receive stable props in `React.memo`.
- **Avoid premature `useCallback`**: only memoize handlers actually passed to a memoized child or a dependency array — not every inline handler.

## Hydration safety with localStorage state

Every domain hook reads from `useLocalStorage`/`readLocalStorage`, which is a client-only source of truth — this creates a real SSR/hydration hazard if not handled:
- Every domain hook already exposes a `hydrated` boolean (see `objectivesHydrated`, `sessionsHydrated`, etc. in `dashboard-overview.tsx`). **Always gate first render on `hydrated`** and render a matching `Skeleton`/`LoadingState`, exactly as `DashboardOverview` does (`if (!hydrated) return <LoadingState />;`). Never assume the store's initial value is safe to render before hydration — it will mismatch between server and client.
- New components consuming a domain hook must destructure and check `hydrated` the same way; don't add a new ad-hoc loading pattern.

## Code-splitting heavy dependencies

Axon ships several genuinely heavy libraries — these must never end up in the initial bundle for a route that doesn't need them:
- **Three.js/OGL** (flashcards 3D dome gallery) — dynamic-import with `next/dynamic` and `{ ssr: false }`, scoped to the Flashcards route only.
- **GSAP + Lenis** — landing-page/scroll-choreography only; don't import at the root layout if only the landing page uses it.
- **Recharts** — already reasonably scoped to Dashboard/Analytics; keep new chart usage lazy if it's below the fold on a heavy page.
- Check any new heavy import against this rule before adding it: "does every route load this, or only one?" If only one, `next/dynamic` it.

## Performance checklist for new components

- Long lists (Kanban columns, flashcard sets, calendar event lists) — virtualize or paginate once they can realistically exceed ~50 items; don't render everything unconditionally.
- Debounce any search/filter input at 200-300ms before triggering derived computation.
- Prefer CSS transitions over Framer Motion for simple hover/focus states (cheaper — see `motion-design`); reserve Framer Motion for orchestrated multi-element sequences.
- Use `next/image` for any user-uploaded or static image (flashcard cover images via Supabase Storage) — never a raw `<img>`.

## Tailwind v4 conventions

- Tokens are defined via `@theme` in `globals.css`, not `tailwind.config.js` — new design tokens go there, referenced as `var(--color-*)`/`var(--shadow-*)`/`var(--radius-*)`, never as hardcoded values in component classNames.
- Use the `light:` custom variant (`@custom-variant light`) only for the rare case where a *different* treatment (not just a different token value) is needed in light mode — most theming should flow through the CSS variables automatically.
- Use `cn()` (`src/lib/utils`, clsx + tailwind-merge) for all conditional className logic — never string concatenation.

## TypeScript

- All domain types live in `src/types/index.ts` — extend them there, don't redefine shapes locally.
- Prefer explicit prop interfaces per component (as seen throughout `dashboard-overview.tsx`) over inline prop types for anything with 3+ props.

Hand off to `motion-design` for animation-specific performance rules (GPU-safe properties) and `accessibility-audit` for a11y-specific patterns.
