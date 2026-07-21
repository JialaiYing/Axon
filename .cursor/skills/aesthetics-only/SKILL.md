---
name: aesthetics-only
description: Explicit command — improves visual and interaction polish on the current page or component with a hard constraint against adding any new functionality, data, or props. Invoke with /aesthetics-only.
disable-model-invocation: true
metadata:
  scope: project
---

# /aesthetics-only

Improve aesthetics only. Do not add features.

Run the `axon-design-workflow` with one hard constraint that overrides everything else: **no new functionality**. Concretely, that means:
- No new props, no new data fetched/computed, no new user-facing capability, no new routes/pages.
- No behavior changes to what the user can *do* — only how it *looks and feels* (color, spacing, typography, shadows, borders, radii, hover/focus states, motion, layout/hierarchy, copy microcopy for tone only).
- If fixing a genuine visual bug requires a small structural change (e.g. consolidating the `GlassPanel`/`Panel`/`.glass-panel` duplication into one implementation), that's in scope — it's a code-quality fix in service of consistent aesthetics, not a feature.
- If you find something during the audit that *would* require new functionality to fix properly (e.g. a metric that needs new data to show a trend), note it in the output as a **deferred recommendation** instead of implementing it.

Use `premium-frontend` and `dashboard-ux` for the visual judgment, `motion-design` for any interaction polish, and confirm against `premium-frontend`'s execution checklist before finishing.
