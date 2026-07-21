---
name: review-component
description: Explicit command — reviews a specific component for UX problems, covering usability, hierarchy, and accessibility, without making any code changes. Invoke with /review-component.
disable-model-invocation: true
metadata:
  scope: project
---

# /review-component

Review this component for UX problems.

Component-scoped critique — narrower than `/audit-page`. If the target component isn't obvious from context/selection, ask which one.

1. Read the component and its immediate parent context (where is it used, with what data/props).
2. Apply `product-design-thinking`'s heuristic checklist (Hick's/Fitts's law, cognitive load, consistency, feedback visibility) scoped to just this component.
3. Apply `accessibility-audit`'s checklist scoped to just this component (keyboard reachability, focus visibility, contrast of any low-opacity text, ARIA labels on icon-only controls).
4. If the component renders inside a larger dashboard-style page, sanity-check its visual weight against `dashboard-ux`'s card-hierarchy checklist.

**Do not edit any files.** Output:
- **Purpose**: what this component is for, in one sentence
- **UX problems found**: bulleted, tagged [Critical] / [Should fix] / [Nice to have], each with a specific fix suggestion (not just the problem)
- **Accessibility problems found**: same format
- **Verdict**: ship as-is / needs the Should-fix items / needs a redesign pass via `/redesign-like-linear`
