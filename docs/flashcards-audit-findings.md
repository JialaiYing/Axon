# Flashcards audit findings (post-fix)

**Surface:** `/flashcards` — library Home + Grid/Dome + Study/Test  
**Date:** 2026-07-22  
**Passes:** aesthetics-only (folders + Home chrome) → product (edit folder, set overview)

---

## User goal

Organize decks in folders, then study/test. Browse should feel like a quiet cover library; Dome remains the one signature 3D moment.

---

## Strengths (after this pass)

- Folders use flat **cover tiles** ([`folder-cover-tile.tsx`](../src/components/flashcards/folder-cover-tile.tsx)) — same identity in grid, list, breadcrumbs, Home pinned, and create/edit preview.
- `FOLDER_COLORS` tokenized to CSS variables (no purple `#5227FF` defaults).
- Nested interactive FolderIcon removed; reduced-motion-hostile paper-open CSS deleted with `folder.tsx` / `folder.css`.
- Home section icons and badges are muted; Continue / Study remain accent actions.
- Home panels use shared `Panel` (standard) instead of ad-hoc glass.
- `updateFolder` wired via [`FolderDialog`](../src/components/flashcards/folder-dialog.tsx) edit mode (pencil on tiles).
- Opening a set from Grid/Dome/Pinned/Completed opens [`SetOverviewDialog`](../src/components/flashcards/set-overview-dialog.tsx) (mastery + Study / Test / Edit). Home **Continue** still jumps straight to Study.
- Dead [`folder-view-dialog.tsx`](../src/components/flashcards/folder-view-dialog.tsx) deleted.

---

## Findings (remaining)

- **[Nice to have]** Legacy folders in localStorage may still store old purple hex colors — they render fine; users can recolor via Edit.
- **[Nice to have]** Set rename/subject after create still mostly via card dialog only — optional polish.
- **[Nice to have]** Spaced repetition / scheduled review still deferred (product, not polish).
- **[Nice to have]** Dome column headers still color-dot only (not cover thumbs) — acceptable; Dome is the 3D surface.

---

## Explicit non-findings

- Do **not** restore the 3D CSS FolderIcon gadget.
- Do **not** put accent on every Home section icon.
- Dome stays the signature motion moment — folder library stays flat.

---

## Named pattern

**Notion cover cards + Linear chrome** for the library; **Framer restraint** for Dome only.
