# Flashcards improvements — implementation brief

**Status:** Implemented (items 1–5)  
**Depends on:** Leitner SR already shipped (`src/lib/flashcards/leitner.ts`); Library is grid-only (Home rail / Dome removed).  
**Out of scope:** SM-2, card images/rich media, Dome/Home revival, Dashboard flashcard widgets, library-wide Test, dead-code cleanup (no user-facing win).

Read `current-state.md` (Flashcards row) first. This file is the executable “what to build next” for Flashcards only — not a full PRD rewrite.

---

## Goal

Make Flashcards feel like a **due-review product**: the student always knows what’s due, why a card appeared, can fix content without recreate/delete, and gets a clear end to a session. Do not add new study algorithms.

## Suggested order

Do in this order — each item is shippable alone; later items assume earlier ones exist.

| # | Item | Why it matters |
|---|---|---|
| 1 | Schedule-visible UI | Trust: mastery % currently overshadows Leitner |
| 2 | Caught-up Study behavior | Job clarity when `dueCount === 0` |
| 3 | Set context in cross-set Study | Due deck is anonymous without it (`DueCardRef` already has `setTitle` / `subject`) |
| 4 | Edit cards + set metadata | Table stakes; typos force delete/recreate today |
| 5 | Session end summary | Closes the loop after Know/Forgot |

---

## 1. Schedule-visible UI

**Problem:** Set overview leads with average mastery. Leitner `box` / `dueAt` drive Study but are mostly invisible, so spaced repetition feels arbitrary.

**Build:**
- On **set overview** (`set-overview-dialog.tsx`): surface **due count** as the primary study signal; show a compact box breakdown or “next due” when useful. Demote average mastery (secondary, or remove if it fights the schedule story).
- In **Study** (`study-view.tsx`): optional quiet cue after flip or in chrome — box or “next review in N days” after grading is enough; don’t clutter the face of the card before flip.
- Copy: prefer “Due” / “Next review” over “Mastery” in primary CTAs.

**Files:** `set-overview-dialog.tsx`, `study-view.tsx`; helpers already in `leitner.ts` / `use-flashcards.ts`.

**Done when:** A user can open a set and explain *from the UI* whether they should Study now and roughly why cards will reappear — without reading code.

---

## 2. Caught-up Study behavior

**Problem:** Library **Study** with zero due cards still enters study mode → “Nothing due right now.” Set-scoped Study with zero due falls back to practicing the whole set (and still grades). The two paths disagree.

**Build:**
- Library Study when `dueCount === 0`: **do not** open an empty session. Disable the button or show a short caught-up state: e.g. “Caught up” + when the next card is due (if any exist).
- Set Study when zero due: same language. If you keep a “practice anyway” path, label it explicitly (e.g. **Practice**) and decide in code whether practice **updates** Leitner or not — default recommendation: practice should still use Know/Forgot *or* be clearly non-scheduling; pick one and label it. Prefer aligning with Library (no silent full-set grind labeled “Study”).
- Badge on Library Study stays meaningful (hide or show 0 only if the control stays enabled for the caught-up explanation).

**Files:** `flashcards-section.tsx`, `set-overview-dialog.tsx`, `study-view.tsx`.

**Done when:** Zero-due never looks like a broken Study session; Library and set paths use the same vocabulary.

---

## 3. Set context in cross-set Study

**Problem:** Library due Study mixes cards from many sets with no on-card context.

**Build:**
- In due-review Study, show a quiet label: **set title** (and subject if non-empty). `DueCardRef` in `leitner.ts` already carries `setId`, `setTitle`, `subject` — wire into `study-view.tsx` chrome, not the card face body.
- Keep it secondary (small muted text); don’t turn Study into a browser.

**Files:** `study-view.tsx`, `flashcards-section.tsx` (how due queue is passed in).

**Done when:** During “Due today” Study, the student can tell which set each card belongs to without leaving the session.

---

## 4. Edit cards + set metadata

**Problem:** After create, card text can’t be edited; set title/subject/description can’t be changed without workarounds. Blocks real use.

**Build:**
- **Cards:** edit front/back in the existing edit surface (`set-view-dialog.tsx` or equivalent); keep delete. Editing text must **not** reset Leitner box/`dueAt` unless you explicitly offer “reset schedule” (default: preserve schedule).
- **Set:** edit title, subject, description after create (overview or edit dialog).
- No new IA (folders stay as they are). No card images.

**Files:** `set-view-dialog.tsx`, `set-overview-dialog.tsx`, `use-flashcards.ts` (update helpers if missing).

**Done when:** Typos and renames are fixable in place; existing due schedules survive text edits.

---

## 5. Session end summary

**Problem:** Session ends with little feedback — weak close for the core loop.

**Build:**
- When the due (or set) queue empties, show a brief summary before returning to Library: cards reviewed, knew / forgot counts, and a one-line next hint if cheap (“N still due later” / “Caught up for today”).
- No celebration chrome on the Dashboard; keep it inside Flashcards Study.

**Files:** `study-view.tsx`, possibly `flashcards-section.tsx` for exit handling.

**Done when:** Finishing Study always shows a short, factual summary — not only an abrupt return to the grid.

---

## Explicitly not in this brief

| Skipped | Reason |
|---|---|
| SM-2 / Anki-grade scheduler | Leitner is enough; won’t fix trust or editing |
| Card images / rich content | High cost; doesn’t fix the review loop |
| Dome / Home rail | Correctly removed |
| Dashboard “continue studying” | Premature until Library study UX is honest |
| Library-wide Test | Test stays set-scoped; low leverage vs Review clarity |
| Dead-code / `.bak` / unused dome hooks | Little to no user-facing impact on the section |

---

## Definition of done (whole brief)

- [x] Items 1–5 shipped
- [x] `npm run lint` clean
- [ ] No new axe-core Critical/Serious on `/flashcards` (keyboard: Study grade keys still work) — manual verify
- [x] `current-state.md` Flashcards row updated to match
- [x] `known-issues.md` — add/resolve entries for these items in the same change

## Skills

`.cursor/skills/premium-frontend/SKILL.md`, `.cursor/skills/product-design-thinking/SKILL.md`, `.cursor/skills/nextjs-react-patterns/SKILL.md` — keep Study chrome quiet; don’t add decorative mastery dashboards.
