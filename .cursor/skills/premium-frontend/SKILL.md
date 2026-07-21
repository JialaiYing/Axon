---
name: premium-frontend
description: Apply premium visual craft to Axon's UI — avoid generic AI-generated aesthetics, strengthen hierarchy and composition, and keep every change consistent with Axon's existing quiet-luxury dark design system. Use when styling, redesigning, or visually polishing any Axon component or page.
metadata:
  scope: project
---

# Premium Frontend Design (Axon)

Axon already has a deliberate visual identity — don't replace it with something generic. The job here is to *refine and extend* what's in `src/app/globals.css`, not reinvent it each time.

## Axon's established identity (extend, don't override)

- **Color**: near-black neutral scale (`--color-background: #0a0a0a` → `--color-card-hover: #1c1c1c`), not blue-tinted; one restrained accent blue (`--color-accent: #5b8def`) used sparingly on chrome/controls, plus a secondary violet and semantic success/warning/danger. Never add a second "loud" accent color, and never default to a purple gradient — that's the single most overused, most generic-AI-looking pattern and Axon deliberately avoids it.
- **Typography**: `Sansation` (display) paired with `Instrument Sans` (body) and `Fragment Mono` (numeric/code) — a deliberate geometric/humanist pairing, not the generic Inter-everywhere default. Any new typographic element should pick one of these three, not introduce a fourth font.
- **Shadows**: four tokenized elevation steps (`--shadow-elevation-1` through `-4`), all "quiet, close-in depth" — small blur, low spread. Never add an ad-hoc `shadow-2xl` or drop shadow outside these tokens.
- **Texture**: a single fixed, near-invisible grain overlay (`.grain-overlay`, opacity 0.035) keeps flat surfaces from reading dead-flat. This is Axon's one atmospheric signature — don't add competing textures (noise, gradients-as-background) elsewhere.
- **Radii**: `--radius-sm/md/lg/xl` (0.5rem→1.25rem) — pick from this scale, don't use arbitrary `rounded-[Npx]`.

## Anti-patterns to actively reject

Reject these even if they're the "default" output for a UI task — they're what makes interfaces look generic and AI-generated:
- Purple/blue gradient backgrounds or buttons
- Inter/Roboto/system-ui as the only font when the project already has a display/body pairing
- Evenly-distributed, timid color palettes instead of one dominant neutral + sharp restrained accent (Axon's whole point)
- Every card at the same visual weight (see `dashboard-ux` for hierarchy)
- Decorative animation with no functional purpose (see `motion-design`)
- Icon-only buttons/links with no accessible label (see `accessibility-audit`)

## Composition and hierarchy

- Establish one clear focal point per screen before styling anything else — size, color saturation, and position should all point there first.
- Use whitespace and typographic weight (font-semibold vs. regular, text-sm vs. text-[11px] uppercase tracking-wide labels — Axon's existing pattern for section eyebrows) to create hierarchy before reaching for a new border or background color.
- Asymmetry and unexpected layout (Axon's marketing/landing components already do this — see `src/components/landing/`) are fine and encouraged on landing/marketing surfaces; the authenticated dashboard shell should stay calmer and more utilitarian per its "quiet luxury" brief — match intensity to context.

## Execution checklist before calling a visual change "premium"

1. Every color used traces back to a `--color-*` token — no new hardcoded hex.
2. Every shadow traces back to a `--shadow-elevation-*` or `--shadow-glow-*` token.
3. Every radius traces back to the `--radius-*` scale.
4. The change reads correctly in **both** dark and light theme (`[data-theme="light"]` overrides in `globals.css`) — check both, don't assume.
5. The change has a clear reason tied to hierarchy or the user's goal (cross-check `product-design-thinking`/`dashboard-ux`), not decoration for its own sake.
6. Hover/focus/active states are defined, not just the resting state (Axon's convention: `hover:border-border-strong hover:bg-card-hover`, `active:scale-90` on icon buttons — see `header.tsx`).

Hand off to `ui-styling`/`design-system` for the mechanical Tailwind/shadcn implementation, `motion-design` for any animated polish, and `accessibility-audit` before shipping.
