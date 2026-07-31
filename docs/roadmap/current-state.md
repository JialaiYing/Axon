# Axon — Current State

**Snapshot date:** July 27, 2026
**Purpose:** Factual description of the app as it exists right now — no plans, no opinions. If something here contradicts `CLAUDE.md`, `README.md`, or any other doc, **this file wins**; it was written by re-reading the actual source, not carried forward from older docs.

---

## 1. What Axon is, today

A single-user study productivity web app: Kanban-style objective board, calendar, Pomodoro-style focus timers, flashcards, analytics, goals, and an XP/rank progression system. Runs as a Next.js app with `localStorage` as the primary data store and Supabase for auth + cross-device sync.

**Not yet deployed publicly.** Version `0.1.0`. No live URL exists yet (per `README.md`).

## 2. Tech stack

- Next.js 15.5 (App Router), React 18, TypeScript 5.6
- Tailwind CSS v4, Radix UI primitives, CVA, clsx/tailwind-merge
- Framer Motion, GSAP, Lenis (scroll)
- Three.js, OGL, react-parallax-tilt (3D/ambient visuals)
- @dnd-kit (drag-and-drop for Kanban + Calendar)
- React Hook Form + Zod
- Recharts
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- lucide-react icons

Path alias: `@/*` → `./src/*`.

## 3. Routes

**App routes (9, all behind auth):** `/dashboard`, `/kanban`, `/calendar`, `/flashcards`, `/pomodoro`, `/analytics`, `/goals`, `/rank`, `/settings`.

**Marketing/legal (5, public):** `/` (landing, always dark regardless of stored theme), `/login`, `/faq`, `/privacy`, `/terms`.

## 4. Auth & persistence model — corrected

**Supabase auth is mandatory, not optional.** `src/components/auth/require-auth.tsx` wraps every `(app)` route and does this unconditionally:

```11:28:src/components/auth/require-auth.tsx
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  ...
    if (!configured || !user) {
      setAllowed(false);
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
      return;
    }
```

If Supabase env vars are missing (`configured === false`) **or** the visitor isn't signed in, they are redirected to `/login` — there is no offline-only/guest mode today. This was introduced in commit `cc60fad "acc now required to use dashboard"`. Older docs (`CLAUDE.md`, parts of `README.md`) describing "offline by default, optional sync" describe a state the app no longer has.

Once signed in, data still lives primarily in `localStorage` (via `useLocalStorage`, `src/hooks/use-local-storage.ts`), with a debounced push (1.2s) to Supabase and a periodic pull (60s) reconciled last-write-wins on `updatedAt` (`src/lib/sync/engine.ts`).

**Store keys (localStorage):**
- `axon:kanban:objectives` — Kanban + Calendar objectives
- `axon:flashcards:folders`, `axon:flashcards:sets`
- `axon:pomodoro:timers`, `axon:pomodoro:sessions`
- `axon:goals`, `axon:goals:history`, `axon:goals:meta`
- `axon:progress:v1` — XP/level/rank/streaks/productivity
- `axon:onboarding:seen` (device-local, not synced)
- Device-local, not synced: calendar view mode, Pomodoro display mode, onboarding tour state.

## 5. Design system

Two visual scopes sharing one token set, switched via `html[data-scope]`:

- **Marketing** (`/`, `/login`, `/faq`, `/privacy`, `/terms`): Instrument Sans (UI/body), Sansation (display), Fragment Mono (data). Radii 8–20px, pill = full.
- **Dashboard** (`(app)/*`): Inter (UI + display), JetBrains Mono (data). Radii flattened to 3–8px, pill = 3px. Sharper, denser, Linear-adjacent.

Color system: near-black neutral scale (not blue-tinted), single steel-blue accent (`#5b8def` dark / `#4a7fd4` light), semantic success/warning/danger tokens. Full token table lives in `src/app/globals.css` — treat that file as the source of truth for exact hex values, not this doc.

Dark is default; light mode is a Settings toggle for the `(app)` shell only — the landing page always forces dark.

## 6. Feature inventory (as built today)

| Domain | What exists now |
|---|---|
| **Dashboard** | Greeting header, "Today" agenda (overdue/due/scheduled/in-progress/on-board fallback — no inline goal bars), a stats strip (streak/focus-today/intervals/productivity with focus-vs-yesterday trend when non-zero), and a Rank strip that links to `/rank`. Up next, Focus this week chart, and Personal/Recent bottom trio removed (M1 trim). |
| **Board** | Page titled "Board" in header and nav (route remains `/kanban`). Three columns (To Go Queue / In Progress / Finished). Cards support subtasks, attachments, dependencies, recurrence (daily/weekly/monthly), a free-text "subject" field (suggestions only, no color binding), an independent optional per-objective color swatch (renders as a left accent bar), and a priority level (low/medium/high/urgent) shown as a colored dot. 7-day soft-delete recycle bin. |
| **Calendar** | Month/week/day views, Agenda + Unscheduled side rail, drag-and-drop scheduling (drop always lands at 9:00, no pointer-time snapping), ICS export. No external calendar sync (Google/Outlook) exists. |
| **Flashcards** | Folders → Sets → Cards. Plain grid library only (no Visual gallery / 3D dome tab; no duplicate Home left rail). No spaced-repetition scheduling — cards track a manual "mastery" value only. |
| **Pomodoro** | **One timer at a time** — large centered display with work/short-break/long-break phases (Settings defaults 25/5/15, long break every 4). Start panel (objective / personal) shows only when no timer is active; during a session only the timer + controls are visible. Interval end opens a prompt (Start break / Skip break / Start next work). Starting a new session from Calendar or elsewhere replaces any existing timer. Focus Mode overlay available from the active timer. |
| **Analytics** | Focus trend, completion, streak-heatmap-style charts; a "More insights" toggle reveals extra charts. Focus-time trend chip compares the selected range to the prior equal window. No generated advice text lives here. |
| **Goals** | Fixed system targets: complete **3 objectives today** and **15 this week** (auto-updated from real completions). Optional personal goals remain for manual tracking, auto-reset at midnight/Monday with a real consecutive-period streak (not progress-as-streak). No user-editable study targets; no insight blurb. |
| **Rank / Progress** | 10 named ranks × 3 tiers each (Novice → Polymath), 30 levels total. XP from: completing an objective (priority-weighted 25/50/85/130, up to +25% early-completion bonus, up to +50% streak bonus), a focus session (`max(8, minutes × 1.2)`), and a flat +15/day activity bonus. Settings also exposes level-gated "unlockable ambient backgrounds" (CSS/WebGL effects — Aurora, Floating Lines, Liquid Ether, Lightfall, Mesh — not AI-generated images) that apply to the Dashboard's canvas. |
| **Settings** | Single-file page: Profile, Appearance (theme), Dashboard backgrounds, Data & privacy (sync status, delete account), Focus Mode toggle, Notifications, Feature tips reset, Homepage link. Explanatory body copy under blocks cut to essentials (M1). |

## 7. Security & deploy posture

Already documented and current — see `docs/security-audit.md` (rate limiting, sanitization, RLS, CSP/security headers — last updated July 21, 2026) and `docs/deploy-checklist.md` (what must happen before a real production deploy) and `docs/supabase-setup.md` (schema + RLS setup walkthrough). Nothing in this roadmap folder changes those; they're kept as-is.

## 8. Git history context

The project has been through many internal polish passes (dark/light theme sweeps, aesthetics passes, the mandatory-auth change, security hardening) but **has never been deployed to a public URL**. This matters for how the plan in `product-requirements.md` should be read — see `opinions.md`.
