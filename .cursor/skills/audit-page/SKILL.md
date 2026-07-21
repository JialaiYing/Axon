---
name: audit-page
description: Explicit command — audits the current page or component like a senior product designer, producing a findings report without making any code changes. Invoke with /audit-page.
disable-model-invocation: true
metadata:
  scope: project
---

# /audit-page

Audit this page like a senior product designer.

Run steps 1-2 of `axon-design-workflow` only:
1. Read the component(s) in focus (or ask which page/component if not obvious from context) and their domain hooks; state the user's goal for this surface (`product-design-thinking`).
2. Identify UX/UI weaknesses using the friction/heuristic checklist (`product-design-thinking`) and, if applicable, the dashboard density/hierarchy checklist (`dashboard-ux`).

**Do not edit any files.** Output a findings report only, in this format:
- **User goal**: 1-2 sentences
- **Strengths**: what's already working (don't skip this — Axon's baseline is often already good; say so when true)
- **Findings**: bulleted, each citing the specific file/line/element, tagged [Critical] / [Should fix] / [Nice to have]
- **Recommended next step**: which command/skill to run next (e.g. `/redesign-like-linear`, `/motion-plan`, `/review-component`)
