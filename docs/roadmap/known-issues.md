# Known issues — salvaged from prior audits

This consolidates everything still worth knowing from `docs/dashboard-audit-findings.md`, `docs/kanban-audit-findings.md`, `docs/calendar-audit-findings.md`, `docs/pomodoro-audit-findings.md`, `docs/flashcards-audit-findings.md`, and `docs/landing-redesign-spec.md` before those files were deleted (they were about to go stale the moment the redesign work in `product-requirements.md` starts, and five separately-dated line-numbered audits are exactly the kind of thing that confuses a future chat).

Each item is tagged:
- **[Independent]** — a real bug/gap unrelated to the redesign; still needs fixing on its own regardless of what else ships.
- **[Subsumed]** — the redesign work already scoped in `product-requirements.md` resolves this as a side effect; no separate ticket needed.
- **[By design]** — logged in the original audit as intentional; not a bug.

Update this file as items get resolved instead of letting it silently rot — see `development-process.md`.

---

## Landing / marketing page

- **[Independent]** No mobile nav menu. Below 768px, "How it works" / "Progress" / "Principles" / "FAQ" links are completely unreachable — `landing-nav.tsx` hides them with no hamburger/disclosure.
- **[Independent]** How It Works section breaks on mobile: the shared visual sits above all four step rows; tapping step 3/4 changes a visual already scrolled past, with no feedback.
- **[Subsumed]** Homepage copy contradicts mandatory auth ("Works offline. Syncs when you want." in hero/trust/footer) — this needed a rewrite already, and now needs a *second* rewrite once the differentiation positioning in `product-requirements.md` lands, since the product story itself is changing, not just the auth framing.
- **[Independent]** `/faq` page uses raw `bg-black`/`text-white`/`border-white/10` instead of the shared token system — the one page the dark-mode sweep missed.
- **[Independent]** No risk-reversal microcopy under Hero/Final CTA buttons (e.g. "free account, sync included").

## Dashboard

- **[Subsumed]** Hardcoded indigo glow (`rgba(94,106,210,…)`) — the dashboard page itself was already cleaned up; remnants live in Calendar/`xp-burst`/`tilt-card`/Tabs (see Calendar entry below).
- **[Subsumed]** "Recent" column had no footer strip while Goals/Rank did (uneven baseline) — moot once Personal goals/Recent are removed from the dashboard per the new PRD scope.
- **[Resolved — M1]** Dashboard trim (§9): removed Up next, Focus this week chart, Personal goals / Recent bottom trio, and agenda inline goal-progress bars. Stats strip + Rank preview remain; Rank strip now links to `/rank`.
- **[Resolved — post-M2]** Dashboard re-coupling (`dashboard-improvements.md`): due-cards cue, daily `n/3` on Rank strip, Clear day CTAs, New objective → `?new=1`, Open today stats (replacing all-time intervals), active timer chip, agenda `+N more` overflow.
- **[Resolved — M2 sweep]** Due cue deep-links to `/flashcards?study=due`; scheduled focus/calendar capped separately so overflow isn't silent; agenda + Open today refresh after midnight; empty-state timer CTA matches header.

## Kanban

- **[Resolved — M2]** Subject-owned colors: board card accent, Calendar event accents/dots, Dashboard today agenda, and Analytics focus-by-subject bars all use `colorForSubject()` (`src/lib/subject-colors.ts`). Per-objective color swatch removed from create/edit forms. Legacy `objective.color` may still exist in storage but is ignored in UI.
- **[Resolved — M2 sweep]** Analytics aggregates subjects case-insensitively; subject palette hexes no longer collide with accent/danger tokens; new objectives no longer write `color`.
- **[Independent]** Hardcoded indigo glow debt (same root cause as Calendar/Dashboard below) — one sweep still needed across `xp-burst`, `tilt-card`, Tabs regardless of the M2 color rework.
- **[By design]** Objective form / recycle-bin dialog polish was intentionally deferred in the original audit; still not urgent.
- **[Resolved — M1]** Page/copy still said "Kanban" throughout ("Kanban" title, empty-state icon/copy, Calendar's "Pick an existing Kanban objective" / "Add to Kanban board?" strings) — renamed the page to "Board" and swapped the leftover Calendar copy to match, since the feature is objective management, not a specific board-software brand.
- **[Resolved — M1]** Dragging In Progress → Finished silently no-oped when the card still had unlogged estimate minutes or open subtasks (`canMarkObjectiveDone` hard-gate, no toast). Removed the gate so board/form can mark Finished freely; study-time progress still tracks independently.

## Calendar

- **[Independent]** Hardcoded indigo glow (`rgba(94,106,210,…)`) still present — the one surface that never got the token cleanup the other pages got.
- **[Independent]** Unscheduled → week/day drag-drop always lands at 9:00, no pointer→minutes snapping.
- **[Independent]** Event actions menu still uses a Sparkles icon + heavy elevation shadow, inconsistent with the flattened chip style elsewhere.
- **[Resolved — M1]** Toolbar alignment (title `text-xl` vs. `h-7`/`h-8` controls, loose `sm:items-center` centering) — split into two clean rows: a title row with Export/Add event on the title's baseline, and a toolbar row (range label, prev/today/next, view tabs) all sharing one `h-8` control height.

## Pomodoro

- **[Independent]** Toast auto-expire doesn't clear the notification-bell entry (minor, intentional-for-history per original audit, but worth a real decision).
- **[Resolved — M1]** Multi-timer-grid-as-default and lack of work/break phase cycling — replaced with a single primary timer, classic work→short/long break cycling (Settings defaults), and prompt-gated transitions.
- **[By design]** Objective timers wait for Stop before showing the finish dialog (toast covers the immediate signal) — logged as intentional, not a bug. Interval end now opens the phase-transition prompt; finish-objective dialog still appears when Stop ends a Ready work session.

## Goals

- **[Resolved — M1]** User-configurable daily/weekly targets (including focus-minutes) and the generic `buildInsight` blurb — replaced with fixed system defaults (3 objectives/day, 15/week), live progress from board completions only, and a decluttered Goals page without edit-target or Insights chrome.

## Flashcards

- **[Resolved — M2]** Leitner spaced repetition shipped — cards carry `box` / `dueAt`; Library **Study** queues due cards across sets; Know/Forgot (and Test) advance the schedule. Specs live in code (`src/lib/flashcards/leitner.ts`).
- **[Resolved — M2]** Flashcards review UX polish (`flashcards-improvements.md`): schedule-visible overview, honest caught-up Study, set context in due Study, edit cards/set metadata without resetting schedule, session end summary.
- **[Resolved — M2 sweep]** Session-complete empty flash fixed; summary copy for remaining Forgot cards; library set tiles show due counts; Dashboard due link opens Study via `?study=due`; Test chrome says Library not Study.
- **[Independent]** Legacy folders may still store old purple hex colors in `localStorage` from before the token migration — self-healing (users can recolor via Edit), low priority.
- **[Resolved — M1]** Home left-rail duplication ("Continue studying" / "Recent folders" sections) and the "Visual gallery" tab (lazy-loaded Three.js dome view) removed — the plain grid library is now the only view, cutting the duplicate entry points and the extra bundle weight the dome pulled in on every page load.

## Settings

- **[Resolved — M1]** Every setting block carried a full explanatory paragraph (Profile, Appearance, Dashboard backgrounds, Data & privacy, Focus Mode, Notifications, Feature tips, Homepage) — cut down to essentials or removed outright where the control was self-explanatory; section/block headings bumped up a size for scannability now that the body copy is gone.
- **[Resolved — M2]** Level-gated ambient Dashboard backgrounds retired; replaced by unlockable dark-only app-wide palettes (starters: Axon / Tokyo Night / Nord; gated: Everforest / Gruvbox / Catppuccin Mocha). Specs in `theme-palettes.md`. City/skyline page was considered and **dropped** (not scheduled).
- **[Resolved — M2 sweep]** FOUC no longer applies gated palettes before unlock proof (`axon:paletteEffective` + starter allowlist); ThemeProvider waits for stats before painting locked ids; palette unlock notify keys clear on account switch.

## Rank / progress

- **[Subsumed]** "Primary progress visual needs a growth metaphor / City page" — withdrawn. Rank ladder stays; cosmetic progression is unlockable palettes, not a new route or skyline.

## Not previously audited (found during this pass)

- **CLAUDE.md auth-optional inaccuracy** — corrected directly in `CLAUDE.md` as part of this round (see git history); flagging here so it isn't rediscovered as a mystery later.
- **No error/empty/loading-state audit exists** for Supabase outage during sync, failed auth, corrupted localStorage payload, or expired session mid-edit — nobody has looked at this yet. Still open, not addressed by this roadmap pass; see `product-requirements.md` reliability section.
- **No accessibility audit has actually been run** against the app despite `.cursor/skills/accessibility-audit/SKILL.md` existing — still open.
