# Development process — how to work through this roadmap

This is written for whoever (whichever chat/session) picks this work up next, including a future instance of an AI assistant with no memory of this conversation. Read `current-state.md` and `product-requirements.md` first; this file is the "how," not the "what."

## Milestone order

Work in this order unless new evidence (real usage, user feedback) says otherwise. Each milestone should be a shippable unit — don't start the next one with the previous one half-done.

### M1 — Cheap, real, low-risk wins
- Pomodoro work/break interval cycling (`product-requirements.md` §9)
- Goals simplification: fixed "3 objectives/day" default (§5)
- Per-page decluttering: Dashboard trim, Kanban copy rename, Flashcards Home-rail/gallery-tab removal, Calendar toolbar alignment (§9)
- Settings copy cuts (§8, using `known-issues.md`'s catalogued strings)

**Skills to use:** `.cursor/skills/premium-frontend/SKILL.md`, `.cursor/skills/dashboard-ux/SKILL.md`, `.cursor/skills/nextjs-react-patterns/SKILL.md` for the Dashboard/Kanban/Flashcards work; `.cursor/skills/axon-design-workflow/SKILL.md` if doing a full coordinated pass across pages rather than one at a time.

**Definition of done:** every item above is implemented, `npm run lint` is clean, no new axe-core violations introduced on the touched pages, and the corresponding entry in `known-issues.md` is updated to "resolved."

### M2 — Positioning-dependent features
- Kanban subject-owned color system (§9) — do this alongside the Kanban rename since both touch the same card component.
- Flashcards spaced repetition scheduler (§7) — scope to Flashcards only, Leitner-box style.
- City page v1 (§4) — **build the smallest version that proves the mechanic** (objective completion visibly changes the page) before investing in multiple theme skins or elaborate skyline art. See `opinions.md` before over-building this.

**Skills to use:** `.cursor/skills/motion-design/SKILL.md` for the City page's growth animation; `.cursor/skills/design-system/SKILL.md` if new tokens are needed for the curated theme skins (Tokyo Night/Nord/Catppuccin/Everforest).

**Definition of done:** completing an objective visibly changes the City page in the same session (no page reload needed), the fixed daily goal from M1 triggers the "bigger" reward tier, and Flashcards "Study" surfaces due cards without the user picking a set first.

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
