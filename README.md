# Axon

A **local-first study productivity dashboard** for students who want a premium, distraction-free command center for tasks, flashcards, focus sessions, and progress tracking — with zero backend, zero accounts, and zero AI API costs. Everything runs and persists entirely in your browser.

> **Live Demo:** _Not yet deployed._ Once hosted (e.g. on Vercel), add the link here: `https://your-deployment-url.vercel.app`

---

## Key Features

* **Kanban Task Board:** Full CRUD with drag-and-drop, priority sorting, and a recycle bin (7-day auto-move, 30-day permanent delete) — complete with a confetti celebration on task completion.
* **Pomodoro Focus Timer:** Single-timer system supporting both objective-linked and personal focus sessions, with digital ring and blob visual display modes.
* **Dashboard & Stats:** XP and productivity calculations with at-a-glance charts *(in progress)*.
* **Flashcards:** Deck creation, review/practice modes, and mastery tracking *(planned)*.
* **Analytics:** Study heatmaps, trend lines, and consistency metrics *(planned)*.
* **Goals:** Daily and weekly targets with progress tracking *(planned)*.
* **Premium UI/UX:** Dark/light/system theming, glassmorphism, soft gradients, and motion throughout — built to feel like Linear, Notion, or Arc Browser rather than a typical student project.
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
- [Framer Motion](https://www.framer.com/motion/)

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

1. **Land on the dashboard** — the app shell loads with the persistent sidebar and header (`(app)` route group).
2. **Create a task** — go to the Kanban board, add a task, and assign a priority. Drag it across columns to update its status.
3. **Delete & recover a task** — delete a task to send it to the recycle bin; it auto-moves after 7 days and is permanently removed after 30. Complete a task to see the confetti celebration.
4. **Run a focus session** — open the Pomodoro timer, start either an objective-linked or personal session, and toggle between the ring and blob display modes.
5. **Switch themes** — toggle between dark, light, and system theme from the header to see the glassmorphism and gradient styling.
6. **(Upcoming)** Review dashboard stats, flashcard decks, analytics heatmaps, and goal tracking as those phases ship.

---

## Architecture

- `src/app` — routes. `(app)` is a route group sharing the persistent sidebar/header shell; the landing page at `/` sits outside it.
- `src/components/ui` — reusable primitives (Button, Card, Badge, Dialog, ProgressBar).
- `src/components/layout` — shell, sidebar, header, page scaffolding.
- `src/components/landing` — marketing page sections.
- `src/components/{kanban,flashcards,pomodoro,analytics,goals,dashboard}` — feature-specific components, populated phase by phase.
- `src/hooks/use-local-storage.ts` — single persistence abstraction. Swapping in a real backend later means replacing this hook, not feature code.
- `src/types` — shared domain types, already modeling fields future phases need (subtasks, attachments, study sessions, dependencies, etc.).

---

## Roadmap

- [x] **Architecture** — shell, routing, theme, nav, UI foundation
- [x] **Kanban** — full CRUD, drag-and-drop, localStorage persistence
- [ ] **Dashboard** — stats, XP/productivity calculations, charts
- [ ] **Flashcards** — sets, review/practice modes, mastery tracking
- [x] **Pomodoro** — timer, auto-switching, session history, notifications
- [ ] **Analytics** — heatmaps, trends, consistency metrics
- [ ] **Goals** — daily/weekly targets and progress tracking

---

## Contributing

Issues and pull requests are welcome. This project is being built incrementally, phase by phase — check the Roadmap above for what's currently in progress before opening a PR.