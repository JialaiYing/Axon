---
name: redesign-like-linear
description: Explicit command — redesigns the current page or component to match the polish level of Linear (or another named premium SaaS reference), running the full Axon design workflow. Invoke with /redesign-like-linear.
disable-model-invocation: true
metadata:
  scope: project
---

# /redesign-like-linear

Redesign this dashboard/page to match Linear's level of polish (or Notion/Vercel/Framer/Raycast/Stripe if the user names a different reference — same process, different reference).

Run the full 7-step `axon-design-workflow`, with `premium-frontend` and `dashboard-ux` as the primary lens for steps 2-4 and 7. Specifically:
1. Analyze + identify weaknesses (steps 1-2), explicitly comparing the current surface against the named reference product's actual patterns from `dashboard-ux`'s reference-pattern list — not generic "make it nicer" language.
2. Plan (step 3) — visual/interaction polish only unless the user also asked for new functionality; call that out if so.
3. Design-system + component plan (steps 4-5) — reuse Axon's existing tokens/components (`premium-frontend`, `nextjs-react-patterns`); avoid introducing a parallel implementation of something that already exists (e.g. don't add a 4th "elevated card" pattern).
4. Implement (step 6).
5. Review (step 7) — explicitly state which specific pattern from the named reference product the result now matches, and confirm both themes + accessibility + reduced-motion still hold.

Ask before implementing if the scope is large (e.g. "redesign the whole dashboard") — confirm the prioritized plan from step 3 first, then proceed.
