# Axon

A local-first study productivity dashboard. No AI APIs — all recommendations
and stats are computed from local data using rule-based logic.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Radix primitives ·
Lucide Icons · Framer Motion · Recharts · React Hook Form · Zod

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Architecture

- `src/app` — routes. `(app)` is a route group sharing the persistent
  sidebar/header shell; the landing page at `/` sits outside it.
- `src/components/ui` — reusable primitives (Button, Card, Badge, Dialog,
  ProgressBar).
- `src/components/layout` — shell, sidebar, header, page scaffolding.
- `src/components/landing` — marketing page sections.
- `src/components/{kanban,flashcards,pomodoro,analytics,goals,dashboard}` —
  feature-specific components, populated phase by phase.
- `src/hooks/use-local-storage.ts` — single persistence abstraction. Swapping
  in a real backend later means replacing this hook, not feature code.
- `src/types` — shared domain types, already modeling fields future phases
  need (subtasks, attachments, study sessions, dependencies, etc.).

## Roadmap

1. **Architecture** — done. Shell, routing, theme, nav, UI foundation.
2. **Kanban** — full CRUD, drag-and-drop, localStorage persistence.
3. **Dashboard** — stats, XP/productivity calculations, charts.
4. **Flashcards** — sets, review/practice modes, mastery tracking.
5. **Pomodoro** — timer, auto-switching, session history, notifications.
6. **Analytics** — heatmaps, trends, consistency metrics.
7. **Goals** — daily/weekly targets and progress tracking.
