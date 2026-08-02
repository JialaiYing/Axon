# Dashboard improvements — implementation brief

**Status:** Shipped (items 1–7)  
**Context:** M1 trim and M2 (Leitner Flashcards, subject colors, unlockable palettes, fixed goals) are done. Dashboard is still mostly pre-M2 in what it *surfaces*.  
**Out of scope:** Landing/trust (M3), deploy/export/full a11y·reliability (M4), calendar sync / streaming audio (M5). Do **not** restore Up next, Focus this week chart, Personal goals / Recent trio, inline goal bars, or a theme gallery on the home viewport.

Read `current-state.md` (Dashboard row) and this brief before changing `dashboard-overview.tsx`. One composition rule: **agenda stays the hero**; at most one quiet secondary signal beyond stats + Rank (due cards). Daily goal is a number inside existing chrome, not a fourth block.

---

## Goal

Re-couple the Dashboard to what the product now does — due review, daily clear, focus continuity — without re-cluttering the command surface.

## Suggested order

| # | Item | Why it matters |
|---|---|---|
| 1 | ~~Due-cards cue → Flashcards~~ **done** | Makes M2 spaced repetition visible on the surface users open first |
| 2 | ~~Daily goal glance (`n/3`)~~ **done** | Fixed goals exist; home has no heartbeat for the daily clear |
| 3 | ~~Empty “Clear day” CTAs~~ **done** | Copy-only empty state is a dead end |
| 4 | ~~“New objective” opens create~~ **done** | CTA currently dumps onto Board with no create flow |
| 5 | ~~Stats: replace / reframe Intervals~~ **done** | All-time intervals don’t belong on a “today” home |
| 6 | ~~Active timer chip~~ **done** | Same-session continuity when a Pomodoro is already running |
| 7 | ~~Agenda overflow (“+N more”)~~ **done** | Silent caps hide work |

---

## 1. Due-cards cue → Flashcards

**Problem:** Library Study + Leitner ship; Dashboard never mentions flashcards. Positioning (“review surfaces itself”) fails on the home screen.

**Build:**
- One quiet cue when `dueCount > 0`: e.g. “N cards due” linking to `/flashcards` (prefer landing users where Study/due is obvious).
- Place it adjacent to the agenda header or as a single line under the greeting CTAs — **not** a second agenda panel or mini study UI.
- When `dueCount === 0`, show nothing (no “Caught up” chrome on Dashboard).

**Files:** `dashboard-overview.tsx`; `use-flashcards.ts` (`dueCount`).

**Done when:** A student with due cards sees that fact on `/dashboard` and can reach review in one click.

---

## 2. Daily goal glance (`n/3`)

**Problem:** Fixed “3 objectives today” lives on Goals; M1 correctly removed Personal goals and inline bars. Home has no progress signal for the daily clear.

**Build:**
- Show `completedToday / 3` (or live equivalent from goals/objectives) as a **single compact affordance** — e.g. inside the stats strip or as a muted line on the Rank strip — linking to `/goals`.
- Do **not** put progress bars on every agenda row or revive a Personal goals card.

**Files:** `dashboard-overview.tsx`; goals/objectives helpers already used on `/goals`.

**Done when:** Daily goal progress is visible at a glance without adding a new hero section.

---

## 3. Empty “Clear day” CTAs

**Problem:** Empty agenda is icon + copy only; real actions live only in the header.

**Build:**
- In `TodayAgendaPanel` empty state, add the same primary actions as the header: **New objective** / **Start focus** (and reuse due-cards link only if item 1 is visible elsewhere — don’t duplicate).
- Keep copy short; don’t turn empty state into onboarding.

**Files:** `today-agenda-panel.tsx`, `dashboard-overview.tsx`.

**Done when:** A clear day can be acted on without scanning up to the header.

---

## 4. “New objective” opens create

**Problem:** “New objective” navigates to `/kanban` only — half a CTA.

**Build:**
- Navigating from Dashboard (header and empty-state) should open the Board **create** flow (query param, hash, or shared open-create entry — match existing dialog patterns).
- Same behavior from empty-state CTA once item 3 exists.

**Files:** `dashboard-overview.tsx`, Board/Kanban page or objective dialog entry.

**Done when:** One click from Dashboard starts creating an objective, not just viewing the board.

---

## 5. Stats: replace / reframe Intervals

**Problem:** Stats are streak · focus today · **intervals (all-time)**. Lifetime count fights the “today” job of the page.

**Build:**
- Replace the third cell with a same-day signal — preferred: **objectives completed today** or the daily-goal fraction if not already shown in item 2 (don’t show the same metric twice).
- If you keep a lifetime metric, rename/relocate it off the primary today strip (e.g. only on `/rank` or `/analytics`).

**Files:** `dashboard-overview.tsx` (`StatCell`s), `use-user-stats.ts` / objectives as needed.

**Done when:** Every stats cell answers a today-or-streak question a student cares about on home.

---

## 6. Active timer chip

**Problem:** If a Pomodoro is running, Dashboard doesn’t acknowledge it — easy to “Start focus” into a confusing replace flow or lose context.

**Build:**
- When a timer is active, show a compact chip/banner (objective title or “Focus”, remaining time) → `/pomodoro`.
- Keep it thin; don’t embed full timer controls on Dashboard.
- Coordinate with existing “Start focus” CTA (e.g. label becomes “Open timer” while running).

**Files:** `dashboard-overview.tsx`; pomodoro timer hook/store.

**Done when:** A running session is obvious on home and one click returns to it.

---

## 7. Agenda overflow (“+N more”)

**Problem:** Agenda buckets are capped; overflow is silent.

**Build:**
- When a section hits its cap, show muted “+N more” linking to the right place (`/kanban` or `/calendar`).
- No need to expand in-place on Dashboard.

**Files:** `today-agenda-panel.tsx`, `dashboard-agenda.ts`.

**Done when:** Hidden items are acknowledged, not invisible.

---

## Explicitly not in this brief

| Skipped | Reason |
|---|---|
| Theme / palette picker or unlock banners on Dashboard | Intentionally Appearance/Rank only; distracts from command surface |
| Level-up “Equip palette?” toast | Easy noise; little home-screen value |
| Subject color legend | Dots are enough |
| Analytics teaser / charts | Undoes M1 declutter |
| Restoring Up next, weekly focus chart, Personal goals, inline goal bars | Explicitly removed |
| Full agenda deep-link-to-card (open specific objective dialog) | Nice later; lower ROI than create CTA + overflow for this pass |
| XP arithmetic hover | Belongs on Rank / progress surfaces, not Dashboard chrome |
| Merging In progress / On the board IA | Label polish only; small win vs items above |

---

## Definition of done (whole brief)

- [x] Items 1–7 shipped
- [x] First viewport still reads as one composition: greeting → agenda hero → stats → Rank (plus at most the due-cards cue and active-timer chip)
- [x] `npm run lint` clean
- [ ] No new axe-core Critical/Serious on `/dashboard`
- [x] `current-state.md` Dashboard row updated
- [x] `known-issues.md` updated in the same change

## Skills

`.cursor/skills/dashboard-ux/SKILL.md`, `.cursor/skills/premium-frontend/SKILL.md`, `.cursor/skills/product-design-thinking/SKILL.md` — density and hierarchy over new cards; every addition must earn a job.
