---
name: accessibility-audit
description: Audit and improve Axon's accessibility against WCAG 2.2 AA — keyboard navigation, focus management, ARIA, color contrast, drag-and-drop, and reduced-motion compliance for Radix-based components. Use when reviewing, building, or fixing accessibility for any Axon UI surface.
metadata:
  scope: project
---

# Accessibility Audit (Axon)

Target: WCAG 2.2 Level AA, treated as the baseline for a professional SaaS product, not a stretch goal. Builds on `ui-styling`'s `references/shadcn-accessibility.md` (Radix a11y basics) — this skill adds the checks specific to Axon's actual components and known-risky patterns.

## Keyboard navigation

- Every interactive element reachable by Tab in visual/logical order; no keyboard trap.
- Sidebar (`sidebar.tsx`) collapse/expand and nav items must remain operable when collapsed to icon-only width — verify `title`/`aria-label` fallback (already present) still works with just a keyboard.
- **Drag-and-drop (`@dnd-kit`)**: both `kanban-board.tsx` and `calendar-page.tsx` already register `KeyboardSensor` alongside `PointerSensor` — keep this pairing on any new `DndContext` usage, it's the established convention, not something to add from scratch. What's *not* yet verified: whether a screen-reader user gets an announced description of what a keyboard-initiated drag actually did (dnd-kit supports an `announcements` config on `DndContext` for this — check whether it's set before assuming keyboard support alone is sufficient).
- Modals/dialogs (Radix `Dialog`) must trap focus while open and return focus to the trigger on close — verify for objective-detail and any new dialog, not just assume Radix defaults are wired correctly.

## Focus visibility

- Every focusable element needs a visible focus ring distinct from hover state — check icon-only buttons like the settings/theme-toggle/notification-bell icons in `header.tsx`, which currently rely on `hover:bg-card` / `active:scale-90` but should be checked for an explicit `focus-visible:ring-*` treatment too.
- Focus order must match visual/DOM order — don't use CSS to visually reorder focusable elements.

## Color contrast

Axon leans heavily on low-opacity text for hierarchy (`text-foreground/45`, `/55`, `/70` — pervasive in `dashboard-overview.tsx` and `today-agenda-panel.tsx`). This is a real contrast risk:
- Body/label text needs ≥4.5:1 contrast; large text (≥24px or ≥19px bold) needs ≥3:1.
- Audit every `/40`–`/55` opacity text token against both the dark background (`#0a0a0a`/`#161616`) and light background (`#f7f6f2`/`#ffffff`) — compute actual contrast ratio, don't eyeball it. If a token fails, either raise the opacity or move that content to a non-`foreground`-derived muted token (`--color-muted`/`--color-muted-foreground` are tuned for this and already meet contrast — prefer them over ad-hoc opacity).
- Never use color alone to convey state (danger/warning/success) — Axon already pairs color with an icon or label in most places (`AgendaLink`, `Badge` variants); keep that pairing for any new status indicator.

## ARIA & semantics

- Icon-only buttons/links always need `aria-label` (already done in most places, e.g. `header.tsx`'s Settings link, sidebar collapse button — use as the reference pattern for new ones).
- Status/live updates (streak achieved, XP gained, session complete) should be announced via `aria-live="polite"` if they're not accompanied by an obvious focus change or dialog.
- Use `aria-current="page"` for active nav state (already done in `sidebar.tsx` — replicate for any new nav-like component).

## Motion & vestibular safety

- Every animation must have a working reduced-motion path (overlaps `motion-design` here — cross-check both). Verify `pulse-glow` and any parallax/tilt effect actually stops or is dampened under `prefers-reduced-motion`, not just the fade/stagger animations.

## Forms

- Every input has a visible or `aria-label`-equivalent label, not placeholder-only.
- Validation errors are associated with their field via `aria-describedby` and announced, not just shown as floating red text.

## Output format

When auditing: list findings grouped by [Critical] (blocks task completion for keyboard/screen-reader users) vs [Should fix] vs [Nice to have], each citing the specific file/component. Verify fixes against both themes and with reduced-motion enabled before considering the audit closed.
