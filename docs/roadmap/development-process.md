# Development process — how to work through this roadmap

This is written for whoever (whichever chat/session) picks this work up next, including a future instance of an AI assistant with no memory of this conversation. Read `current-state.md` and `product-requirements.md` first; this file is the "how," not the "what."

## Milestone order

Work in this order unless new evidence (real usage, user feedback) says otherwise. Each milestone should be a shippable unit — don't start the next one with the previous one half-done.

### M1 — Cheap, real, low-risk wins
- [x] Pomodoro work/break interval cycling (`product-requirements.md` §9)
- [x] Goals simplification: fixed "3 objectives/day" default (§5)
- [x] Dashboard trim (§9) — agenda-only hero; Up next / Focus this week / Personal+Recent removed; Rank strip links to `/rank`
- [x] Kanban copy rename (§9)
- [x] Flashcards Home-rail/gallery-tab removal (§9)
- [x] Calendar toolbar alignment (§9)
- [x] Settings copy cuts (§8, using `known-issues.md`'s catalogued strings)

**Skills to use:** `.cursor/skills/premium-frontend/SKILL.md`, `.cursor/skills/dashboard-ux/SKILL.md`, `.cursor/skills/nextjs-react-patterns/SKILL.md` for the Dashboard/Kanban/Flashcards work; `.cursor/skills/axon-design-workflow/SKILL.md` if doing a full coordinated pass across pages rather than one at a time.

**Definition of done:** every item above is implemented, `npm run lint` is clean, no new axe-core violations introduced on the touched pages, and the corresponding entry in `known-issues.md` is updated to "resolved."

### M2 — Positioning-dependent features
- [x] Flashcards spaced repetition scheduler (§7) — Flashcards-only Leitner boxes; Library Study surfaces due cards without set pick first.
- [x] Flashcards UX follow-through — `flashcards-improvements.md` (schedule-visible UI, caught-up Study, set context in due Study, edit cards/set metadata, session end summary). Do after Leitner; do not expand into SM-2 or card media.
- [x] Kanban subject-owned color system (§9) — `colorForSubject()` in `src/lib/subject-colors.ts`; board card accent, Calendar dots/chips, Dashboard agenda, and Analytics focus-by-subject bars share one mapping; per-objective color swatch removed from create/edit forms.
- [x] Unlockable dark-only app palettes (§4) — ambient Dashboard backgrounds retired; starters at L1 (Axon / Tokyo Night / Nord); gated Everforest L3 / Gruvbox L7 / Catppuccin Mocha L13; **never auto-equip**; Appearance is the picker; chrome follows accent so swaps are visible. Specs: `theme-palettes.md`.

**Skills to use:** `.cursor/skills/design-system/SKILL.md` for tokenized palette swaps (same CSS variables per theme); `.cursor/skills/premium-frontend/SKILL.md` to keep unlocked palettes quiet and non-distracting; `.cursor/skills/nextjs-react-patterns/SKILL.md` for Flashcards scheduler state.

**Definition of done:** ambient Dashboard backgrounds are gone; at least three unlockable dark palettes can be unlocked by rank and manually equipped app-wide without auto-apply on level-up; Flashcards "Study" surfaces due cards without the user picking a set first; subject colors on the board match Analytics.

**Post-M2 follow-through (optional, not a new milestone):** Dashboard re-coupling — `dashboard-improvements.md`. Do not pull M3–M5 items into that pass.

### M3 — Trust pass (do after M1/M2, not before)
- Rewrite landing page copy to reflect the *new* positioning from `product-requirements.md` §2 — not just an auth-accuracy fix, since the product story itself changed.
- Fix the landing bugs in `known-issues.md` tagged `[Independent]`: mobile nav menu, How It Works mobile behavior, `/faq` token migration.

**Definition of done:** a new visitor reading only the homepage is never surprised by the signup wall or by what the product actually does; nav and How It Works both work at 375/768/1024px.

### M4 — Infra + launch
- Execute `docs/deploy-checklist.md` against a real host.
- Turn on Supabase's own Auth rate limits; keep the app's in-memory limiter as a secondary layer only.
- Verify self-serve account deletion end-to-end (cloud rows + storage purge).
- Ship JSON data export from Settings.
- Run a real accessibility pass (`.cursor/skills/accessibility-audit/SKILL.md` exists for exactly this and hasn't been used yet) and a reliability/error-state pass (Supabase outage, failed auth, corrupted localStorage, expired session mid-edit — none of this has ever been tested).

**Definition of done:** the deploy checklist's smoke test passes on the actual production URL; zero Critical/Serious axe-core violations; the failure scenarios above have been manually reproduced and don't lose data or show a blank/broken UI.

### M5 — Evidence-gated, not scheduled
- Calendar two-way sync (Google/Outlook)
- Any real third-party audio/streaming integration

Do not start these until there's been real usage post-launch. If nobody who actually uses the product asks for these, don't build them speculatively.

## Keeping docs honest

The previous set of docs (five separate per-page audit files, a website-spec snapshot, a landing-redesign spec) went stale and were deleted as part of this reorganization because nobody was updating them as work landed. Don't repeat that:

- When an item in `known-issues.md` is fixed, mark it resolved in that file in the same change, don't leave it for later.
- When `current-state.md` becomes inaccurate (new routes, new store keys, a changed auth model, etc.), update it in the same change that made it inaccurate — it's supposed to always reflect reality, not a snapshot that ages out.
- Don't create a new one-off audit/spec doc per page again. If a page needs a real audit, put findings directly into `known-issues.md` with the same `[Independent]/[Subsumed]/[By design]` tagging convention.
- `docs/security-audit.md`, `docs/deploy-checklist.md`, and `docs/supabase-setup.md` are the only docs outside this folder that should still be treated as current — keep them that way when auth/sync/security work changes.
