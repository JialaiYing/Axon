# Axon

A **local-first study productivity dashboard** for students who want a premium, distraction-free command center for tasks, flashcards, focus sessions, and progress tracking — with zero backend, zero accounts, and zero AI API costs. Everything runs and persists entirely in your browser.

> **Live Demo:** _Not yet deployed._ Once hosted (e.g. on Vercel), add the link here: `https://your-deployment-url.vercel.app`

---

## Demo

![Axon product tour — dashboard, kanban, calendar, flashcards, pomodoro, analytics, and goals](docs/demo/axon-demo.gif)

A quick tour of every feature page, captured straight from the running app: **Dashboard → Kanban → Calendar → Flashcards → Pomodoro → Analytics → Goals**.

A higher-quality version is available at [`docs/demo/axon-demo.mp4`](docs/demo/axon-demo.mp4). The capture pipeline (a seeded, throwaway browser profile + ffmpeg) lives in [`scripts/demo`](scripts/demo) and can be re-run anytime with `npm run demo:capture` against a local dev server.

---

## Key Features

* **Dashboard:** A single command-center view — today's focus/agenda items, an "up next" queue pulled straight from the board, streak/focus/interval/productivity stats, live goal pace, and current rank/XP progress.
* **Kanban Task Board:** Full CRUD with drag-and-drop, priority sorting, and a recycle bin (7-day auto-move, 30-day permanent delete) — complete with a confetti celebration on task completion.
* **Calendar:** Month/week/day views with drag-and-drop scheduling, a live "now playing" focus session indicator, an agenda panel (live, today, tomorrow, upcoming deadlines), and calendar-only events that never clutter the kanban board.
* **Pomodoro Focus Timer:** Run multiple concurrent timers — objective-linked or personal — with digital ring and ambient "blob" display modes, session history, and toast/notification-bell alerts when a timer finishes.
* **Flashcards:** Folders and decks with a default set grid, optional visual dome gallery, focused study/practice mode, and per-card mastery tracking based on your actual review history.
* **Analytics:** Focus-time trend lines, weekly rhythm and peak-hours charts, completions-by-priority breakdown, and day-streak consistency — all computed from your real sessions and objectives.
* **Goals:** Daily and weekly targets with live pace tracking (on track / behind / done), goal streaks, and a rolling history of every closed period.
* **XP & Rank Progression:** Deterministic, rule-based XP for completed focus sessions and objectives, with levels, ranks, streaks, and a daily bonus — no server, no AI, just local math.
* **Premium UI/UX:** A single tuned dark theme, glassmorphism, soft gradients, and motion throughout (respecting `prefers-reduced-motion`) — built to feel like Linear, Notion, or Arc Browser rather than a typical student project.
* **Privacy by Design:** No AI APIs, no database, no login, no cloud sync — all data and logic (including recommendations) are computed locally with rule-based algorithms.

---

## Tech Stack

**Frontend Framework**
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)

**Styling & UI**
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/) — page/section transitions and micro-interactions
- [GSAP](https://gsap.com/) + [Lenis](https://lenis.darkroom.engineering/) — landing-page scroll choreography
- [OGL](https://github.com/oframe/ogl) / [Three.js](https://threejs.org/) — WebGL ambient background effects (the flashcard dome gallery is DOM/CSS, not WebGL)
- [@dnd-kit](https://dndkit.com/) — kanban and calendar drag-and-drop

**Data & Forms**
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/) (schema validation)
- Browser `localStorage` (persistence layer — no database)

**Data Visualization**
- [Recharts](https://recharts.org/)

**AI / Backend**
- None. All recommendations, stats, and scheduling logic are computed client-side using deterministic, rule-based logic — no AI API calls, no server, no auth.

---

## Getting Started

### 1. Prerequisites

Make sure you have the following installed:

- **Node.js** `v18.17` or later ([download](https://nodejs.org/))
- **npm** `v9+` (bundled with Node.js) — or `yarn` / `pnpm` if you prefer

Verify your versions:

```bash
node -v
npm -v
```

### 2. Clone & Install

```bash
git clone https://github.com/<your-username>/axon.git
cd axon
npm install
```

### 3. Environment Variables

Axon is fully local-first — **no environment variables are required to run the app.** There are no API keys, database URLs, or auth secrets to configure.

If you later add optional integrations (e.g. analytics or a deployed backend), document them here using a template like:

```env
# .env.local (example — not currently required)
# NEXT_PUBLIC_ANALYTICS_ID=
```

### 4. Run the Dev Server

```bash
npm run dev
```

Then visit **[http://localhost:3000](http://localhost:3000)**.

---

## Core Workflows / Usage Guide

A quick walkthrough for reviewers testing the app locally:

1. **Land on the dashboard** (`/dashboard`) — today's agenda, your up-next queue, streak/focus/productivity stats, goal pace, and rank/XP all in one view.
2. **Create and move a task** — go to the Kanban board, add an objective, assign a priority, and drag it across columns. Complete one to see the confetti celebration; delete one to send it to the recycle bin (auto-moves after 7 days, permanently deletes after 30).
3. **Schedule it on the calendar** — switch to Month/Week/Day view, drag an unscheduled objective onto a slot, or add a calendar-only event that never shows up on the board.
4. **Run a focus session** — open the Pomodoro timer, start an objective-linked or personal session, and toggle between the ring and blob display modes. Run more than one at once if you want.
5. **Build a flashcard deck** — create a folder and a set from the Flashcards page, study from the set grid (or optional visual gallery), and see mastery tracking update per card.
6. **Check your trends** — Analytics turns your real sessions and completions into focus trend lines, peak-hours/weekly-rhythm charts, and a consistency score.
7. **Track your goals** — Goals shows live daily/weekly pace against your targets, with a history of every past period once you have a few days of activity.
8. **Switch themes?** Axon intentionally ships with a single, fixed dark theme — see the Settings page for why.

---

## Architecture

- `src/app` — routes. `(app)` is a route group sharing the persistent sidebar/header shell; the landing page at `/` sits outside it.
- `src/components/ui` — reusable primitives (Button, Card, Badge, Dialog, ProgressBar, Panel, EmptyState, …).
- `src/components/layout` — shell, sidebar, header, page scaffolding, notification bell.
- `src/components/landing` — marketing page sections, kept in sync with the real dashboard.
- `src/components/{kanban,calendar,flashcards,pomodoro,analytics,goals,dashboard}` — feature-specific components.
- `src/hooks` — one hook per domain (`use-objectives`, `use-pomodoro-sessions`, `use-pomodoro-timers`, `use-flashcards`, `use-goals`, `use-calendar-state`) sitting on top of `use-local-storage.ts`, the single persistence abstraction. Swapping in a real backend later means replacing this hook, not feature code.
- `src/lib/progress` — the local XP/level/rank/streak/productivity engine.
- `src/lib/goals-utils.ts`, `src/lib/calendar-utils.ts`, `src/lib/pomodoro-utils.ts` — shared domain logic (pace/date helpers, scheduling, session math) so every feature agrees on what "today" or "on track" means.
- `src/types` — shared domain types.
- `scripts/demo` — the seeded-data + Playwright + ffmpeg pipeline that generates `docs/demo/axon-demo.{gif,mp4}`.

---

## Project Status

Every core phase below has shipped and is exercised by the demo above:

- [x] **Architecture** — shell, routing, theme, nav, UI foundation
- [x] **Kanban** — full CRUD, drag-and-drop, recycle bin, localStorage persistence
- [x] **Dashboard** — live stats, XP/productivity calculations, charts
- [x] **Calendar** — month/week/day views, drag-and-drop scheduling, live agenda
- [x] **Flashcards** — folders, set grid + optional dome gallery, study mode, per-card mastery tracking
- [x] **Pomodoro** — multi-timer, auto-switching, session history, notifications
- [x] **Analytics** — trend lines, peak-hours/weekly-rhythm charts, consistency scoring
- [x] **Goals** — daily/weekly targets, live pace, streaks, period history

### Exploring next

A few directions under consideration for a more complete, professional dashboard — see the project discussion for the full list:

- [ ] Data import/export (JSON backup + restore) so local-first doesn't mean "unrecoverable"
- [ ] A guided first-run/empty-state experience for brand-new installs
- [ ] Optional cross-device sync (e.g. an opt-in, self-hosted or Vercel KV-backed layer) without giving up the local-first default
- [ ] Command palette (`⌘K`) for jumping between objectives, sets, and pages
- [ ] Weekly email/PWA-notification digest of goals and streaks

---

## Contributing

Issues and pull requests are welcome. Check [Project Status](#project-status) above for what's shipped and the discussion in each PR for what's in flight.
