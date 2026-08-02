# Axon roadmap — start here

This folder is the current single source of truth for where Axon is and where it's headed next. It replaced a set of older docs (`docs/product-requirements.md`, `docs/axon-website-spec.md`, `docs/landing-redesign-spec.md`, and five per-page `*-audit-findings.md` files) that had started to drift from reality and would have confused whoever picked this up next — those are gone; anything from them still worth knowing was carried into `known-issues.md`.

**Still current, unchanged, live outside this folder:** `docs/security-audit.md`, `docs/deploy-checklist.md`, `docs/supabase-setup.md`. Nothing here supersedes those.

## Reading order

1. **`current-state.md`** — what actually exists in the app today. Purely factual, no plans or opinions. If this contradicts anything else (including `CLAUDE.md`), trust this file — it was written by re-reading the source.
2. **`product-requirements.md`** — what's being proposed next and why: positioning/differentiation, gamification (unlockable dark palettes; City dropped), per-page simplification, sequencing.
3. **`theme-palettes.md`** — locked hex tables for Axon Dark + starters (Tokyo Night / Nord) + gated unlocks (Everforest / Gruvbox / Catppuccin Mocha). Source of truth before touching `globals.css` palette CSS.
4. **`known-issues.md`** — specific open bugs/debt, each tagged as independent of the redesign, resolved by it, or intentional by design.
5. **`development-process.md`** — the executable version of the PRD: milestone order, which skills to use, definition of done per milestone, and the rule for keeping these docs from going stale again.
6. **`flashcards-improvements.md`** — post-Leitner Flashcards UX brief (schedule visibility, caught-up Study, edit, session summary). Implement from here; not a substitute for `current-state.md`.
7. **`opinions.md`** — a direct, deliberately unhedged take on what's realistic here and where I'd push back on the plan above. Read this before treating `product-requirements.md` as a literal, fully-committed build order.

## One correction made alongside this folder

`CLAUDE.md` (loaded into every chat automatically) previously described Supabase auth as optional/offline-graceful. That's no longer true — `RequireAuth` makes an account mandatory for every app route. `CLAUDE.md` was corrected directly as part of this pass; `current-state.md` §4 has the full detail.
