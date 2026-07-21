---
name: motion-plan
description: Explicit command — creates a concrete motion design plan (timing, easing, and sequencing) for a page, flow, or interaction without writing implementation code. Invoke with /motion-plan.
disable-model-invocation: true
metadata:
  scope: project
---

# /motion-plan

Create a motion design plan.

Use `motion-design` exclusively. Do not implement — output a plan only, in this format:

- **Signature moment**: the ONE animation that should carry the most weight for this surface (page load stagger, a key transition, a completion moment) — name it specifically.
- **Micro-interactions**: bulleted list of every hover/press/toggle affected, each with a duration + easing pulled from `motion-design`'s timing tokens (reuse the house `EASE` curve and duration tiers — don't invent new curves).
- **Transitions**: any state/section/page transitions, same format.
- **Loading states**: whether a `Skeleton` matching the real layout is needed, per `motion-design`'s guidance.
- **Reduced motion path**: explicitly state what happens for each item above under `prefers-reduced-motion` — every item needs an answer, not just a blanket "respects reduced motion."

Only proceed to implementation if the user explicitly confirms the plan or asks for code directly.
