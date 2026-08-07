# Landing page — spec & M3 requirements

**Status:** Shipped (M3)  
**Primary job (locked):** Explain the signed-in product accurately, then get the visitor to create an account.  
**Secondary job:** Optionally reduce the “why not four other apps?” objection with honest proof points — never the hero’s main job.  
**Build M3 from this file.** When shipped marketing copy or section structure changes, update this doc in the same change (same honesty rule as `current-state.md`).

Read first: `current-state.md` (auth model, feature inventory), then this. `product-requirements.md` §2 is background positioning; **this file overrides** the older “homepage’s job is to win the four-apps comparison” framing.

---

## 1. Audience & conversion model

**Visitor:** Self-directed student considering yet another study tool. Skeptical. Will bounce if the page promises offline/guest use or features that aren’t in the app.

**Funnel:**
1. Understand what Axon is (one signed-in command center: plan → focus → review).
2. Believe the claims match a real product (post-M2).
3. Create a free account (`/login?mode=signup`) → land on `/dashboard`.

**Success is not** winning a feature bake-off in the hero. Success is: no surprise at the signup wall, no false offline story, clear path to account creation, and a truthful picture of Board / Calendar / Pomodoro / Flashcards (Leitner) / Goals / Rank / palettes.

---

## 2. Must-say / must-not-say

### Must say (somewhere obvious: hero fine print, Principles, FAQ, and/or footer)

| Claim | Accurate framing |
|---|---|
| Account required | Free account required to use the app — not optional sync on top of a guest mode |
| Sync | Data syncs across devices once signed in (localStorage + Supabase); not “works offline first” as the lead story |
| Free | Free to use; no credit card for signup (true today — no paid tier) |
| No AI | Deterministic / rule-based study tools; not AI-generated plans or coaching |
| Study loop | Plan objectives → schedule → focus sessions → spaced flashcard review |
| Rewards | XP / rank / streaks / unlockable dark palettes from real completed work — unlock ≠ auto-equip |

### Must not say

| Banned / dangerous | Why |
|---|---|
| “Works offline” / “sync when you want” as the lead promise | Account is mandatory; no guest mode |
| Guest / try without signup | False |
| City / skyline / ambient Dashboard backgrounds as a feature | Dropped / retired |
| SM-2, Anki parity, card images | Not shipped |
| Teams, mobile apps, calendar two-way sync, Spotify | Non-goals or M5 |
| “Personal goals you configure” as the study target story | Fixed 3 objectives/day system default |
| AI features | Explicit non-goal |

**Risk-reversal under primary CTAs (required):** e.g. “Free account · no credit card · sync included.” Keep one short line under Hero and Final CTA.

---

## 3. Visual & IA character (constraints, not a redesign)

Keep the existing marketing character unless a change is required for truth or mobile:

- Forced dark on `/`, `/login`, `/faq` (and legal as today) — **same `axon` palette as the signed-in app**; the landing page borrows no separate hue or new color tokens, only structural refinements (see below)
- Quiet product-chrome mocks (no stock photography, no purple-glow theater)
- Brand (Axon) lives in the sticky nav (top-left); hero copy is centered — eyebrow, headline, lead, CTAs — without a second logo mark in the first viewport
- First viewport budget: one eyebrow, one headline, one short supporting line, one CTA group, one dominant product visual — no logo duplicate, no competitive bake-off, no promo chips in the hero
- **Hairline-grid motif:** How it works, Principles, and the Progress stat row use a shared seamless grid — a bordered container with 1px gaps (`bg-white/[0.06]` over `bg-background` cells) reading as dividers, rather than individually bordered/rounded cards. Mono (`font-mono`) eyebrows and step/item numbering (`01`, `02`, …) throughout, in place of sans-serif uppercase labels.
- Secondary CTAs ("Sign in" beside "Get started" in Hero and Final CTA) are a bordered outline button, not a plain text link
- No cards in the hero; section cards only where interaction needs a container (e.g. `/faq`'s accordion)
- Respect `prefers-reduced-motion`

Do **not** turn M3 into a visual identity overhaul or new illustration system — no new palette, no new fonts, no new hue.

---

## 4. Routes in scope

| Route | M3 role |
|---|---|
| `/` | Primary surface — rewrite + mobile fixes |
| `/login` | Keep CTA targets; ensure mode=signup/signin copy doesn’t contradict homepage |
| `/faq` | Claim consistency + token migration (`bg-black` → shared tokens) |
| `/privacy`, `/terms` | Claim consistency only if they still imply optional auth; not a redesign |

---

## 5. Homepage — what to feature

### Locked section stack

Keep six beats unless implementation proves a merge is clearer. Each section has **one job**.

| # | Section | Job | Must include | Must not |
|---|---|---|---|---|
| 1 | **Hero** | Name the product and the ask | Eyebrow; brand (in nav); one headline; one line that states signed-in study command center; Get started → `/login?mode=signup`; Sign in → `/login` (bordered secondary button); risk-reversal line; product visual (dashboard-style mock OK) | Competitive bake-off; offline lead; feature laundry list |
| 2 | **How it works** (`#how-it-works`) | Show the loop | Four steps in a 2×2 hairline grid, each with its own visual: Capture (Board) → Schedule (Calendar) → Focus (Pomodoro tied to objective) → Review (**Leitner / due study**, not vague “mastery only”) | Kanban jargon if Board is the product name; review step that ignores spaced repetition |
| 3 | **Progress** (`#progress`) | Explain motivation honestly | Fixed stat grid (objectives completed, focus sessions, streak, rank) + a focus-time/subject breakdown panel; unlockable quiet dark palettes (manual equip) shown as real catalog swatches, one-liner only | City/skyline; “personal goals you set”; ambient background unlocks; invented palette colors |
| 4 | **Principles** (`#trust`) | Build trust | 2×2 hairline grid: one connected system; account required + sync across devices; no AI; deep work / no engagement theater | “Local-first” as if no account needed |
| 5 | **FAQ preview** (`#faq`) | Clear signup objections | Account / free / no-AI (or equivalent) as a plain always-visible list (not an accordion — short enough to just read); **visible link to `/faq`** | Orphan “see full FAQ” with no link |
| 6 | **Final CTA** | Convert | Same primary + secondary CTA pairing and risk-reversal as hero | New claims not introduced above |

### Hero copy direction (requirements, not final wordsmithing)

- Headline: quiet, product-true; current “Study without the noise.” may stay if the lead sentence is fixed.
- Lead must communicate: **one place to plan, focus, and review — free account required; syncs when you’re signed in.**
- Competitive “vs Notion / Quizlet / …” belongs later (Principles footnote, FAQ, or a single short proof line) — not the H1.

### How it works — behavior requirements

- All four steps are always visible in a 2×2 hairline grid (1 column below `sm`, 2 columns at `sm`+) — each tile carries its own real product visual, so there is no active/expanded state and nothing to keep in sync across breakpoints.
- Step copy must match post-M2 product names (Board not “Kanban”; Review = spaced flashcards / due study).

### Progress — content requirements

- Replace or rewrite any “Personal goals” bullet that implies user-tuned study targets.
- Rank/XP stay; palette swatches shown must be the real catalog entries (`src/lib/palettes/catalog.ts`) with real hex previews — starter vs. level-gated shown visually (e.g. a lock mark), not invented colors. Palettes remain a quiet one-liner, not the section hero.

### Principles — content requirements

- Four tiles, not three: one connected system (Board/Calendar/Focus/Flashcards share objectives) is new; the other three carry forward the required must-say facts — free account + sync, no AI, and deep work / no engagement theater.
- Reframe storage: fast on-device use **with** an account and cloud sync — not optional sync.

### Nav & footer

| Surface | Requirements |
|---|---|
| Desktop nav | Section anchors + Sign in + Get started (signup) |
| Mobile nav | All section links + Sign in reachable below `md`; Get started always available (header and/or drawer) |
| Footer | Account-required + sync blurb; Product anchors; Account links including `/faq`; Legal |

If `known-issues.md` still says “no mobile nav,” verify against `landing-mobile-nav.tsx` and mark resolved when accurate — don’t re-implement a second menu.

---

## 6. `/faq` requirements

- Migrate off raw `bg-black` / `text-white` / `border-white/10` onto shared marketing/app tokens (same forced-dark look, correct tokens).
- Answers must match §2 must-say / must-not-say (account, sync, free, no AI, what ships).
- Homepage FAQ preview links here.

---

## 7. Explicit non-goals for M3

- Full visual rebrand, new illustration pack, light-mode marketing
- Pricing page, blog, changelog, social proof theater (fake testimonials)
- Implementing M4 deploy/export or M5 calendar/audio
- Dashboard/in-app changes (see `dashboard-improvements.md` if needed later)
- Expanding competitive comparison into a long landing section

---

## 8. M3 implementation order

Build against this spec in order:

1. **Claim audit & copy rewrite** — Hero, How it works, Progress, Principles, FAQ preview, Final CTA, Footer, `/faq` answers (truth first).
2. **How it works mobile behavior** — active step visual co-located with step content.
3. **Nav completeness** — confirm mobile drawer; fix gaps (Sign in visibility, FAQ preview → `/faq`).
4. **`/faq` token migration** — styling only + any claim fixes from step 1.
5. **CTA risk-reversal** — Hero + Final CTA (and align login page microcopy if it contradicts).
6. **Doc hygiene** — update `known-issues.md` (resolve Independent landing items), refresh `current-state.md` only if marketing behavior is documented there, keep this file matching what shipped.

**Skills:** `.cursor/skills/premium-frontend/SKILL.md`, `.cursor/skills/brand/SKILL.md`, `.cursor/skills/product-design-thinking/SKILL.md` — accuracy and hierarchy over novelty.

---

## 9. Definition of done (M3)

- [x] A new visitor reading only `/` understands they need a free account and what the signed-in app actually does (Board, Calendar, Focus, spaced Flashcards, Goals, Rank/palettes at a truthful level)
- [x] No must-not-say claims remain on `/`, `/faq`, footer, or login chrome
- [x] Hero and Final CTA include risk-reversal microcopy
- [x] FAQ preview links to `/faq`
- [x] Nav section links work at 375 / 768 / 1024px
- [x] How it works works at those widths (active step + visual relationship)
- [x] `/faq` uses shared tokens (no raw black/white one-off palette)
- [x] This spec still matches the shipped page
- [x] `known-issues.md` landing Independents updated
- [x] `npm run lint` clean

Matches `development-process.md` M3 DoD: *never surprised by the signup wall or by what the product actually does.*

---

## 10. Open copy choices (decided in M3 ship)

- Hero headline: kept “Study without the noise.” Mono eyebrow (“The study system”) added above it; lead shortened to plan → focus → review, with account/free/sync moved to the mono risk-reversal line beneath the CTAs.
- Unlockable palettes: shown as a real swatch row (from the catalog) under the Progress panel, one quiet line, not the section hero.
- Principles: 2×2 hairline grid — One connected system, Free account/always synced, No AI gimmicks, Designed for focus.
- Palette/hue: unchanged. The redesign is structural (hairline grids, mono labels, restrained heading weight) on top of the existing `axon` color tokens — not a new color identity.
