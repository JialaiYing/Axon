# Axon — Product Requirements Document (v2, differentiation-led)

**Status:** Draft for review (revised Aug 2026 — City dropped; unlockable dark palettes replace ambient backgrounds)
**Supersedes:** the earlier `docs/product-requirements.md` (stabilization-only framing)
**Prepared:** July 27, 2026; gamification §4 revised August 2, 2026
**Read `current-state.md` first** — this document assumes you know what already exists.

---

## 1. Why this version exists

The first pass of this PRD framed the next phase as "polish and launch what's already built." Feedback on that draft changed the framing: **the product isn't differentiated enough to be worth launching as-is.** A student asked "why would I not just use Google Tasks + Google Calendar + Quizlet + Notion + my phone's clock app?" and the honest answer, today, is: they wouldn't have a strong reason not to. This version leads with closing that gap, then folds in the UI decluttering and trust/infra work from the first draft as later phases.

See `opinions.md` for a direct, unhedged take on how much of this is realistic to build before shipping anything publicly — read it before treating this whole document as a literal build order.

## 2. Positioning

**Positioning statement:** Axon is the one place a student plans, focuses, and reviews — instead of gluing together four separate apps and relying on their own discipline to keep them in sync. Three concrete things back that up once built:
1. **Zero-setup study automation** — spaced review surfaces itself; the student never has to decide what to study.
2. **A reward system tied to real completed work**, not check-ins or vanity streaks.
3. **Fewer tab-switches during a focus session** — the calendar and (eventually) audio live inside the app instead of requiring two more tabs.

**Target audience (unchanged, sharpened):** a self-directed student who has already tried and abandoned some combination of Notion, Google Tasks/Calendar, Quizlet/Anki, and a bare Pomodoro timer. Skeptical of "another productivity app."

**Homepage job (locked for M3 — see `landing-spec.md`):** explain the signed-in product accurately and get the visitor to create an account. The “why not four other apps?” objection is secondary proof only, not the hero’s primary job.

**Why not just use the obvious alternatives — the honest comparison:**
- **Google Tasks + Calendar:** fine for scheduling, has zero concept of focus sessions, streaks, or spaced review. Axon's answer: one dataset drives the to-do list, the calendar, and the focus timer together.
- **Notion:** infinitely flexible, which means it does nothing for you out of the box — a new user has to *build* their own system before getting value. Axon's answer: opinionated, pre-built structure; nothing to configure before day one.
- **Quizlet/Anki:** real spaced repetition, but it's a separate app the student has to remember to open. Axon's answer: review surfaces inside the same app they're already opening to check their tasks.
- **Phone clock/timer:** does the countdown, nothing else — no session history, no link to what was being worked on. Axon's answer: a session is tied to an objective and counts toward a visible reward.

This comparison is a draft to validate, not a finished claim — see `opinions.md` for how much weight to actually put on winning a feature-by-feature comparison versus just getting someone to try it.

## 3. Goals / non-goals

**Goals:** ship a version of Axon where the differentiation claims above are actually true in the product, declutter every surface to read like a consumer app instead of internal tooling, fix the trust-breaking copy/UX gaps already found, and get it deployed somewhere real.

**Non-goals (unchanged):** teams/collaboration, native mobile apps, payments/subscriptions, i18n, WCAG AAA, a design-token rebuild.

**New non-goal, explicit after this pass:** AI features of any kind remain off the table — the FAQ already proactively differentiates on *not* using AI, and gamification/spaced-repetition mechanics below are deliberately deterministic/rule-based, not AI-generated.

## 4. Gamification rework — unlockable dark palettes

Current state (see `current-state.md` §6): a rank ladder (10 ranks × 3 tiers, Novice→Polymath) is the primary progress visual, plus dark-only app palettes — starters (Axon, Tokyo Night, Nord) available from day one; Everforest, Gruvbox, and Catppuccin Mocha gated by level and equipped manually in Settings → Appearance.

**City / skyline dropped.** An earlier draft proposed replacing the rank page with a growing night-skyline ("City") metaphor. That was cut before implementation: too much art/production cost for a solo build, and a new visual metaphor does not by itself make the reward loop more motivating (see `opinions.md`). Rank stays.

**Confirmed decisions:**
- Keep the existing **rank ladder on `/rank`** as the primary progress surface — do not replace it with a growth-metaphor page.
- Replace the ambient Dashboard-background catalog with **unlockable, dark-only, app-wide color palettes** — quiet IDE-style themes (readable, low drama), not neon "reward skins" and not WebGL wallpaper.
- **Unlock ≠ equip.** Ranking up unlocks a palette; it never auto-applies mid-session. The user equips deliberately from Appearance (Settings), same mental model as installing then selecting a VS Code theme.
- **Dark-only for unlockable palettes.** Light mode stays the single neutral alternate (existing Appearance toggle). Do not ship light variants of each unlock in this phase.
- **Dashboard stays a command surface.** No theme carousel, unlock banners, or ambient effects in the first viewport. Progression cosmetics live in Rank + Settings; same-session dopamine stays brief (completion / daily-goal feedback), not a palette swap.

**Palette set (cosmetic progression track):**
- **Theme zero (default):** current Axon dark — always available, never locked.
- **Unlock candidates** (ship default + starters immediately; gate ~3 more by level): **Tokyo Night + Nord** (starters at L1), then **Everforest Dark**, **Gruvbox Dark**, **Catppuccin Mocha**. Optional later: Rosé Pine.
- Implementation constraint: each palette remaps the **same CSS variables** (surfaces, borders, muted text, primary accent). Semantic success/warning/danger and **subject-owned board colors** stay independent of the palette so Kanban/Analytics accents do not fight the theme.

**Action → reward split (keep this honest):**

| Action | Reward |
|---|---|
| Complete an objective / finish a focus session | Existing XP into the rank ladder + brief same-session feedback (toast / short motion) — not a theme change. |
| Hit the daily goal (see §5) | A discrete "clear" moment (e.g. stronger toast or Rank pulse) — still not a palette swap. |
| Level / rank-up (existing XP curve stays as the internal math) | Unlocks the next dark palette in Appearance (manual equip only). |
| Maintain / break streak | Keep on Rank (numbers + any muted/loss treatment there) — do not dim the whole Dashboard. |

**Settings implication:** retire the "Dashboard backgrounds" block entirely when palettes land. Appearance owns light/dark + unlocked palette picker; Rank can preview what's locked/unlocked and deep-link to Appearance to equip.

## 5. Goals, simplified

Current state: users configure their own daily/weekly targets, and target types include both objectives-completed and focus-minutes.

**Change:** retire focus-minutes as a goal type — "focus time shouldn't be a goal," per direct feedback; the honest reasoning given was that external, fixed instructions work better than self-set ones for this audience. Replace the user-configurable daily goal with a **fixed system default: "Complete 3 objectives today."** Weekly becomes a fixed multiple of that, not a user-tunable slider. Hitting that fixed daily clear is the trigger for the discrete "bigger" same-session reward in §4 — not a theme unlock (themes stay rank-gated).

## 6. Insights and metric transparency

- The existing `buildInsight()` text on the Goals page (`goals-overview.tsx:266`) is deterministic, not AI — but reads as generic filler prose ("Keep logging focus sessions..."). Requirement: only keep it if it can be rewritten as a concrete, number-backed statement (e.g., "You complete objectives most often on Tuesdays"); otherwise cut it rather than ship vague encouragement text.
- Requirement: XP/streak numbers should be able to show their own arithmetic on hover/tap (e.g., "50 (objective) + 30 (focus) + 15 (daily bonus) = 95") instead of being an opaque total — this directly answers "it's not clear how the metrics are calculated."

## 7. Study-system differentiators

- **Spaced repetition, scoped to Flashcards** (not an ill-defined "study-system-wide" feature — see `opinions.md` for why the app-wide framing doesn't actually hold together). Add a lightweight scheduler (Leitner-box style is enough; full SM-2 is not necessary) so "Study" surfaces what's due today automatically instead of the user picking a set to grind through. This is the feature that most directly answers "the average user shouldn't have to think about what to study."
- **Calendar sync (Google/Outlook) — downgraded to an explored candidate, not committed P1.** The previous draft of this PRD called this P1; on reflection (see `opinions.md`) that was premature for a project with zero real users and two different OAuth integrations to build and maintain. Keep it on the list, do not schedule it yet.
- **Ambient audio during focus sessions — narrowed scope.** Rather than integrating a third-party streaming service (Spotify/Apple Music), which needs partner API approval for real playback control, the realistic version is bundling a small set of self-hosted ambient/lo-fi tracks with Focus Mode — no external auth, no API dependency, no ongoing integration maintenance. If real demand for actual Spotify/Apple Music control shows up later, revisit; don't build it speculatively first.

## 8. Content & layout philosophy (new cross-cutting principle)

**Remove text first, add it back only where it's actually load-bearing.** Concretely:
- No descriptive subtitle copy that just restates what a section already visually communicates. Example already found: the Settings page description "Appearance, profile, privacy, and study preferences." (`src/app/(app)/settings/page.tsx:238`) and the similarly redundant explanatory sentences under every Settings block (Profile, Appearance, Dashboard backgrounds, Focus Mode, Notifications, Feature tips — all catalogued in the prior audit, now folded into this cut list). Keep only the genuinely non-obvious lines (what's device-local vs. synced, what "Delete account" actually deletes).
- Bigger section headers, more vertical whitespace between sections, everywhere — the product should read as a consumer app, not documentation.

## 9. Per-page simplification scope

- **Dashboard** (`dashboard-overview.tsx`): keep the agenda's actual to-do list, strip the inline goal-progress bar out of it. Remove "Up next" entirely — it's a second queue duplicating the agenda. Remove the "Focus this week" weekly chart — "Focus today" already exists in the stats strip; a quick-scan dashboard doesn't need a second, weekly view of the same metric. From the bottom trio (Personal goals / Rank / Recent), drop Personal goals and Recent (Goals has its own page already); keep Rank as a link/preview into `/rank` (progress + unlock previews — not a theme gallery on the Dashboard itself).
- **Kanban → drop the word "Kanban" from user-facing copy.** Call it a to-do list / board in the UI (title, description, nav label) — keep the underlying drag-and-drop board mechanic, just stop calling it "Kanban" in copy the user sees. Replace the independent per-objective color swatch with a **subject-owned color**: each distinct subject gets one persistent color, and the card's left accent bar renders that color instead of an arbitrary independent choice — this is also the fix for "what is the point of the color bar" (today it doesn't correlate with anything scannable across cards). Unify with Analytics' separate subject-color list so the board and charts agree on the same colors.
- **Calendar:** fix the toolbar alignment (title `text-xl` vs. `h-7`/`h-8` controls, loosely centered). Independent of, and unblocked by, the calendar-sync candidate in §7.
- **Flashcards:** remove the left "Home" rail — its content duplicates the main Library panel's own create bar and navigation. Remove the "Visual gallery" (Dome) tab as a primary navigation option.
- **Pomodoro:** change the default layout from a grid of simultaneous timer cards to **one large centered timer** as the primary view (multi-timer support can remain available, just not the flagship layout). Add real work→break interval cycling — the classic Pomodoro technique (work → short break → repeat → long break after N cycles) that the app is nominally named after but doesn't currently implement.
- **Settings:** apply §8's cut list to the specific strings already catalogued in `known-issues.md`.

## 10. Trust & infra work carried forward from the first draft

Still valid, now sequenced later (see §11):
- Landing page pass — build from **`landing-spec.md`** (accurate signed-in product story + signup; competitive comparison secondary). Also: How It Works mobile behavior, `/faq` tokens, CTA risk-reversal; mobile nav already exists — verify completeness rather than assuming missing.
- Production infra hardening: real deploy against `docs/deploy-checklist.md`, Supabase's own Auth rate limits turned on, self-serve account deletion verified end-to-end, JSON data export from Settings.
- Accessibility pass (no full audit has been run yet, despite a skill existing for it) and a reliability/error-state pass (Supabase outage during sync, failed auth messaging, corrupted localStorage, expired session mid-edit) — neither has ever been done.

Full detail on these carries over unchanged from the git history of this document; nothing new was added to this section this round beyond re-sequencing it.

## 11. Suggested sequencing

See `development-process.md` for the executable version of this. At a high level:
1. Cheap, real, low-risk: Pomodoro work/break cycling, goals simplification, per-page decluttering, Settings copy cuts.
2. Positioning-dependent: unlockable dark-only app palettes (§4 — replace ambient Dashboard backgrounds; no City), Flashcards spaced repetition, Kanban subject-owned colors.
3. Trust pass: execute `landing-spec.md` (homepage job = accurate product + signup), How It Works mobile, `/faq` tokens.
4. Infra + launch: deploy checklist, rate limiting, account deletion, data export, accessibility pass.
5. Evidence-gated, not scheduled yet: calendar sync, any real third-party audio integration — revisit based on actual usage once there is any.

## 12. Success metrics

Same launch-readiness framing as the first draft — pre-launch, so these are gates, not growth KPIs:
- Zero contradictions between site copy and actual product behavior.
- Zero open "Independent" items in `known-issues.md`.
- Deploy checklist smoke test passes 100% on the real production URL.
- Zero axe-core Critical/Serious violations across all routes, both themes.
- A working JSON export that round-trips real user data.

## 13. Open questions

- Exact rank/tier gates for each unlockable palette (and whether Rank shows a locked preview vs. name-only until unlocked).
- Is "3 objectives/day, fixed" the right default number, or does it need to flex by how many objectives a user typically creates per day? Worth a quick sanity check against a few real usage days before hardcoding.
- How much same-session completion / daily-goal feedback is enough once City is gone — toast only, or also a Rank-surface pulse? Keep it brief either way.
