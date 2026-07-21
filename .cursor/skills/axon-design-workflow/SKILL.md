---
name: axon-design-workflow
description: Orchestrates Axon's end-to-end design improvement process — analyze, identify weaknesses, plan, define design-system changes, plan component updates, implement, and review against premium SaaS standards. Use whenever the user asks to improve, redesign, audit, or polish any part of Axon's UI/UX, or mentions matching the quality of Linear, Notion, Vercel, Framer, Raycast, or Stripe.
metadata:
  scope: project
---

# Axon Design Workflow

Axon's design goal: feel like a premium modern SaaS product comparable to Linear, Notion, Vercel, Framer, Raycast, and Stripe. **Prioritize visual quality, polish, and UX over new features** — this is the standing constraint for every step below unless the user explicitly asks for a new feature.

This skill is the entry point that sequences the other design skills. Follow all 7 steps in order for any non-trivial UI change; for small, obviously-scoped fixes, steps can be collapsed but never skipped entirely.

## Step 1 — Analyze current page

Read the actual component(s), their domain hooks, and how they're used. Load `product-design-thinking` and state the user's goal for this surface before proposing anything.

## Step 2 — Identify UX/UI weaknesses

Run the friction/heuristic checklist (`product-design-thinking`) and, if the surface is dashboard/analytics-like, the density/hierarchy checklist (`dashboard-ux`). Produce a concrete, file-cited findings list — no vague "could be improved" statements.

## Step 3 — Create a design improvement plan

Turn findings into a prioritized, scoped plan. Explicitly separate:
- **Visual/interaction polish** (default lane — always in scope)
- **New functionality** (out of scope unless the user asked for it — flag and set aside rather than silently including it)

## Step 4 — Define design-system changes

Only if the plan requires new tokens/patterns: use `design-system` (token architecture) and `premium-frontend` (Axon's existing identity — extend it, don't replace it) to define the delta. Most polish work should need zero new tokens — if you're reaching for a new color or shadow, double-check it isn't already covered by an existing `--color-*`/`--shadow-*` token first.

## Step 5 — Plan component updates

List the exact files that change and what changes in each. Cross-check against `nextjs-react-patterns` (memoization, hydration/`hydrated` gating, code-splitting) so the plan doesn't introduce a performance or architecture regression while chasing polish.

## Step 6 — Implement improvements

Write the code. Use `ui-styling` for Tailwind/shadcn/Radix mechanics, `motion-design` for any animation, `premium-frontend`'s execution checklist (tokens only, both themes checked, hover/focus states defined) as you go — don't defer these checks to step 7.

## Step 7 — Review against premium SaaS standards

Before considering the work done, explicitly check it against `premium-frontend` and `accessibility-audit`, and name which of Linear/Notion/Vercel/Framer/Raycast/Stripe's specific pattern the result now matches (see `dashboard-ux`'s reference-pattern list). If you can't name one, the work isn't done yet.

## Related skills quick-reference

- `product-design-thinking` — user goals, flows, IA, friction heuristics
- `dashboard-ux` — SaaS dashboard layout/data-viz patterns + Axon page inventory
- `premium-frontend` — visual craft anchored to Axon's existing tokens
- `motion-design` — Framer Motion/GSAP/Lenis motion system
- `nextjs-react-patterns` — Next.js/React/Tailwind architecture and performance
- `accessibility-audit` — WCAG 2.2 AA checklist
- `design-system`, `ui-styling`, `ui-ux-pro-max` — pre-existing token/component/reference skills, used for mechanics not judgment

## Quick commands

For narrower, explicitly-invoked versions of parts of this workflow, use:
- `/audit-page` — steps 1-2 only, read-only findings
- `/redesign-like-linear` — full workflow, `premium-frontend`+`dashboard-ux` as primary lens
- `/aesthetics-only` — full workflow with a hard "no new functionality" constraint
- `/review-component` — component-scoped steps 1-2 + accessibility pass
- `/motion-plan` — motion-only plan, no implementation
