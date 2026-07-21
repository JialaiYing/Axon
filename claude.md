# Axon Project Reference

> A local-first study productivity dashboard with optional cloud sync. This file helps AI assistants understand the project structure without deep exploration.

## Project Overview

**Axon** is a distraction-free command center for students to manage their study productivity:
- Task/objective management (Kanban board)
- Calendar scheduling with drag-and-drop
- Pomodoro focus timers
- Flashcard study with 3D gallery
- Analytics and goal tracking
- XP/rank gamification system

**Key principle:** Offline-first by default. Optional Supabase integration for auth and cloud sync when env vars are configured.

**Current version:** v0.1.0

**Note:** The README is outdated—it describes a fully offline app. The codebase now includes full Supabase auth + sync capabilities (still optional).

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout + AppProviders
│   ├── page.tsx                 # Landing page (/)
│   └── (app)/                   # Route group with DashboardShell
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── kanban/page.tsx
│       ├── calendar/page.tsx
│       ├── flashcards/page.tsx
│       ├── pomodoro/page.tsx
│       ├── analytics/page.tsx
│       ├── goals/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/                      # Radix-based primitives (Button, Card, Dialog, Panel, etc.)
│   ├── layout/                  # DashboardShell, sidebar, header, notifications
│   ├── auth/                    # AuthProvider, AuthDialog, ProfileMenu
│   ├── sync/                    # SyncProvider for cloud sync
│   ├── providers/               # AppProviders (Auth + Sync stack)
│   ├── onboarding/              # Feature intro tours
│   ├── dashboard/               # Dashboard overview component
│   ├── kanban/                  # Objective board, cards, dialogs
│   ├── calendar/                # Month/week/day views
│   ├── flashcards/              # Folders, sets, 3D gallery
│   ├── pomodoro/                # Timers, session history, blob display
│   ├── analytics/               # Focus trends, productivity charts
│   ├── goals/                   # Daily/weekly targets with streak tracking
│   └── landing/                 # Marketing page sections
├── hooks/
│   ├── use-local-storage.ts     # Core persistence abstraction (pub/sub, cross-tab)
│   ├── use-objectives.ts        # Kanban + calendar objectives (key: axon:kanban:objectives)
│   ├── use-flashcards.ts        # Flashcard folders/sets
│   ├── use-goals.ts             # Goals with history and metadata
│   ├── use-pomodoro-timers.ts   # Active timers (key: axon:pomodoro:timers)
│   ├── use-pomodoro-sessions.ts # Session history (key: axon:pomodoro:sessions)
│   ├── use-calendar-state.ts    # Calendar view prefs (device-local only)
│   ├── use-notifications.ts     # Browser notifications
│   ├── use-onboarding.ts        # Tour state (key: axon:onboarding:seen)
│   ├── use-user-stats.ts        # Computed stats (XP, streaks, rank)
│   └── use-objectives.ts        # ← Core data hook (used by Kanban + Calendar)
├── lib/
│   ├── progress/                # XP system
│   │   ├── xp-rules.ts          # Deterministic XP rewards
│   │   ├── xp-curve.ts          # Level curve math
│   │   ├── ranks.ts             # Rank thresholds
│   │   ├── streak.ts            # Streak logic
│   │   ├── productivity.ts       # Productivity index
│   │   ├── store.ts             # Singleton XP store (key: axon:progress:v1)
│   │   └── today.ts             # Today's XP data
│   ├── sync/                    # Cloud sync engine
│   │   ├── collections.ts       # localStorage ↔ Supabase table mappings
│   │   ├── engine.ts            # Push/pull/merge logic (last-write-wins)
│   │   └── sync-provider.tsx    # React context with debounced push, periodic pull
│   ├── supabase/
│   │   ├── client.ts            # Singleton browser client, isSupabaseConfigured()
│   │   └── storage.ts           # Flashcard image upload
│   ├── calendar/
│   │   ├── ics.ts               # ICS export
│   │   └── calendar-utils.ts    # Date/time helpers
│   ├── kanban-utils.ts
│   ├── pomodoro-utils.ts
│   ├── goals-utils.ts
│   ├── time.ts                  # Duration, formatting
│   └── constants/
│       └── kanban-constants.ts  # Column order, default values
├── types/
│   └── index.ts                 # All domain types (Objective, FlashcardSet, Goal, etc.)
└── constants/
    └── navigation.ts            # 8-route navigation config
```

---

## Core Architecture Patterns

### 1. Local-First Persistence Boundary

**`useLocalStorage`** (`src/hooks/use-local-storage.ts`) is the single persistence abstraction:
- Pub/sub for in-tab component sync
- `storage` event listener for cross-tab sync
- Imperative `writeLocalStorage` / `readLocalStorage` for module access
- Sync engine subscribes to `subscribeLocalStorageWrites` for debounced push

**Key stores:**
- `axon:kanban:objectives` — Core objective data (Kanban + Calendar)
- `axon:flashcards:folders` — Folder list
- `axon:flashcards:sets` — Card sets with mastery
- `axon:pomodoro:timers` — Active timer instances
- `axon:pomodoro:sessions` — Historical sessions
- `axon:goals` — Daily/weekly goal targets
- `axon:goals:history` — Closed-period goal data
- `axon:goals:meta` — Singleton: current period keys
- `axon:progress:v1` — Singleton: XP, level, rank, streaks, productivity
- `axon:onboarding:seen` — Tour state (device-local, not synced)

### 2. Domain Hooks Pattern

One hook per domain sitting on `useLocalStorage`:
```typescript
// Example: use-objectives.ts
const [objectives, setObjectives] = useState<Objective[]>(() => 
  readLocalStorage('axon:kanban:objectives', [])
);

// Returns: {objectives, addObjective, updateObjective, deleteObjective, ...}
```

These hooks are the **API** for feature components. Business logic lives here, not in components.

### 3. Single Source of Truth

- **Objectives store serves both Kanban and Calendar** — `showOnKanban` flag filters visibility
- **Progress/XP reads from pomodoro sessions + objective completions** — computed deterministically
- **Goals auto-update from real session/completion data** — no mock data

### 4. Auth + Sync Provider Tree

```
<html data-theme="dark">
  <body>
    <AppProviders>               (src/components/providers/app-providers.tsx)
      <AuthProvider>             (Auth context: session, signIn, signUp, signOut)
        <SyncProvider>           (Cloud sync: push on writes, pull periodically)
          {children}
        </SyncProvider>
      </AuthProvider>
    </AppProviders>
  </body>
</html>
```

**Sync behavior:**
- Full sync on sign-in
- Debounced push (1.2s delay) after writes to synced keys
- Pull every 60s when tab is visible
- Full sync on reconnect
- Account switch clears local synced data before pull (prevents cross-account contamination)

**Device-local prefs (not synced):**
- Calendar view mode (month/week/day)
- Pomodoro display mode (ring/blob)
- Onboarding tour state

### 5. Page Structure (Thin Pages, Fat Components)

Each page is a thin wrapper importing one feature component:
```typescript
// app/(app)/kanban/page.tsx
export default function KanbanPage() {
  return <KanbanBoard />;
}
```

Business logic lives in:
- Domain hooks (`use-objectives.ts`)
- Feature components (`KanbanBoard.tsx`)
- Utilities (`kanban-utils.ts`)

### 6. UI Conventions

- **Dark theme by default, light mode optional** — toggle lives in Settings (`useTheme`/`ThemeProvider`); the marketing homepage (`/`) always forces dark regardless of the stored preference
- **Glassmorphism + grain overlay** — backdrop-blur, grainy texture
- **Scaffolding:** `AppPage` wrapper → `PageHeader` + `Panel` cards
- **Accessible primitives:** Radix UI (Button, Dialog, Dropdown, etc.)
- **Animations:** Framer Motion, GSAP, Lenis scroll
- **Respects `prefers-reduced-motion`** in animations

---

## Features Quick Reference

| Feature | Path | Key Files | Store Key |
|---------|------|-----------|-----------|
| **Dashboard** | `/dashboard` | `dashboard-overview.tsx` | N/A (computed) |
| **Kanban** | `/kanban` | `kanban-board.tsx`, `kanban-card.tsx`, `objective-dialog.tsx` | `axon:kanban:objectives` |
| **Calendar** | `/calendar` | `calendar-page.tsx`, `calendar-header.tsx` | `axon:kanban:objectives` (filtered) |
| **Flashcards** | `/flashcards` | `flashcards-section.tsx`, 3D gallery | `axon:flashcards:folders`, `axon:flashcards:sets` |
| **Pomodoro** | `/pomodoro` | `pomodoro-*` components, ambient blob display | `axon:pomodoro:timers`, `axon:pomodoro:sessions` |
| **Analytics** | `/analytics` | `analytics-overview.tsx` | Computed from sessions + objectives |
| **Goals** | `/goals` | `goals-overview.tsx` | `axon:goals`, `axon:goals:history`, `axon:goals:meta` |
| **Settings** | `/settings` | `settings/page.tsx` | Cloud sync status, notification prefs |

### Kanban Objectives

Structure:
```typescript
interface Objective {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  completedAt?: string;
  recurring?: 'daily' | 'weekly' | 'monthly';
  subtasks: Subtask[];
  attachments: Attachment[];
  dependencies: string[];
  showOnKanban: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Features:**
- Drag-and-drop columns (dnd-kit)
- Subtasks with checkbox tracking
- Attachments (links, files via Supabase Storage)
- Dependencies between objectives
- Recurrence rules (daily/weekly/monthly)
- Recycle bin (7-day soft delete, 30-day permanent)
- Confetti animation on completion
- Priority sorting

### Pomodoro

Supports multiple timers linked to objectives or standalone personal timers.

Structures:
```typescript
interface PomodoroTimerInstance {
  id: string;
  objectiveId?: string;
  duration: number;
  remaining: number;
  isRunning: boolean;
  displayMode: 'ring' | 'blob';
}

interface PomodoroSession {
  id: string;
  objectiveId?: string;
  duration: number;
  completedAt: string;
}
```

**Features:**
- Digital ring display + ambient blob mode
- Session history
- Cross-page notifications
- Finish dialogs with notes

### Flashcards

Hierarchical: Folders → Sets → Cards with mastery tracking.

**Features:**
- 3D dome gallery (Three.js / OGL)
- Study mode with spaced-repetition-like tracking
- Optional folder cover image upload (Supabase Storage when signed in)

### XP & Progression System

Deterministic rules in `src/lib/progress/`:
- **Reward rules:** Complete objective = XP, focus session = XP, streak bonus
- **Level curve:** Exponential or custom
- **Ranks:** Unlocked at thresholds (Bronze → Silver → Gold → Diamond)
- **Streaks:** Daily/weekly consecutiveness tracking
- **Productivity index:** Computed from session completion rate

Singleton store: `axon:progress:v1`

---

## Database & Cloud Sync (Optional)

### Supabase Schema

- **`profiles`** — User metadata + `onboarding_seen` JSONB
- **Entity tables:** `objectives`, `flashcard_folders`, `flashcard_sets`, `pomodoro_sessions`, `pomodoro_timers`, `goals`, `goal_history`, `notifications`
  - Composite PK: `(user_id, id)` — browser generates IDs, not globally unique
  - Last-write-wins via `updatedAt` timestamp
- **Singleton tables:** `progress`, `goals_meta` — one row per user
- **Storage bucket:** `flashcard-images` — public read, user-scoped write via RLS

### Sync Engine

**`src/lib/sync/engine.ts`** implements:
1. **Push** — Debounced (1.2s) writes to Supabase after local mutations
2. **Pull** — Periodic (60s) full table pull when tab visible
3. **Merge** — Last-write-wins by `updatedAt`; new local IDs merged with server data

**`collections.ts`** maps:
- `axon:kanban:objectives` ↔ `objectives` table
- `axon:pomodoro:sessions` ↔ `pomodoro_sessions` table
- etc.

### Auth

Supported methods:
- Email/password (sign-up, sign-in)
- Google OAuth (redirects to `/dashboard`)

Client: `src/lib/supabase/client.ts` — Singleton `createBrowserClient()`

`isSupabaseConfigured()` checks for both env vars — app gracefully degrades to offline-only if not set.

---

## Environment Setup

### Optional Supabase Integration

Create `.env.local` (gitignored):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Without these vars:** App runs fully offline, cloud features disabled, no auth.

**With these vars:** Sign-in enabled, cloud sync available, flashcard image storage.

Full setup guide: `docs/supabase-setup.md`

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 15.5 (App Router), React 18, TypeScript 5.6 |
| **Styling** | Tailwind CSS v4, Radix UI, CVA, clsx/tailwind-merge |
| **Animation** | Framer Motion, GSAP, Lenis, Motion |
| **3D/Visual** | Three.js, OGL, react-parallax-tilt |
| **Drag-drop** | @dnd-kit (Kanban + Calendar) |
| **Forms** | React Hook Form, Zod, @hookform/resolvers |
| **Charts** | Recharts |
| **Backend** | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| **Persistence** | Browser localStorage + Supabase (optional) |
| **Fonts** | Instrument Sans (sans/UI), Sansation (display/headlines), Fragment Mono (data/mono) via `next/font/google` |

**No AI APIs, no server-side business logic** — all XP, analytics, recommendations computed client-side deterministically.

---

## Development

### NPM Scripts

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run start      # Run production server
npm run lint       # ESLint check
npm run demo:cinematic  # Generate demo video/gif (Playwright + ffmpeg) — not currently linked from README
```

### TypeScript Path Aliases

`tsconfig.json` defines `@/*` → `./src/*` for clean imports:
```typescript
import { useObjectives } from '@/hooks/use-objectives';
import { Button } from '@/components/ui/button';
```

### Routing

8 main routes (defined in `src/constants/navigation.ts`):
- Dashboard, Kanban, Calendar, Flashcards, Pomodoro, Analytics, Goals, Settings

Landing page (`/`) is separate from `(app)` shell.

---

## Common Tasks & File Locations

| Task | Files to Edit |
|------|---------------|
| Add new page/route | `src/app/(app)/{feature}/page.tsx` + feature component in `src/components/{feature}/` |
| Add domain data/hooks | `src/hooks/use-{domain}.ts` + update `src/types/index.ts` |
| Add UI component | Create in `src/components/ui/` using Radix + Tailwind |
| Modify XP rules | `src/lib/progress/xp-rules.ts`, `xp-curve.ts`, etc. |
| Update Supabase schema | `supabase/schema.sql`, re-deploy to Supabase project |
| Add sync for new table | `src/lib/sync/collections.ts` (map key ↔ table) + `engine.ts` |
| Update navigation | `src/constants/navigation.ts` |
| Modify auth flow | `src/components/auth/auth-provider.tsx`, `auth-dialog.tsx` |

---

## Important Notes

1. **README is outdated** — describes offline-only app. Code now has optional auth + sync.
2. **Offline-first by design** — Supabase is opt-in; app is fully functional without it.
3. **No mock data** — Analytics, goals, and dashboards read from real objectives and sessions.
4. **Dark by default, light mode in Settings** — the `(app)` dashboard supports both via `data-theme`; the `/` homepage is always dark.
5. **Composite user IDs** — Objectives use `(user_id, id)` composite keys in Supabase; browser generates IDs.
6. **Device-local prefs** — Calendar view, pomodoro display mode, onboarding state stay device-local (not synced).
7. **Last-write-wins sync** — Conflict resolution uses `updatedAt` timestamp; later write wins.
8. **Graceful degradation** — Missing Supabase env vars don't break the app; features just stay offline.

---

## When You Need to Explore Further

- **Feature UI/UX:** Check component in `src/components/{feature}/`
- **Data flow:** Trace through the domain hook (`use-*.ts`) → component usage
- **Database/sync logic:** `src/lib/sync/` and `supabase/schema.sql`
- **XP calculations:** `src/lib/progress/`
- **Utilities & constants:** `src/lib/{domain}-utils.ts`, `src/constants/`
- **Type definitions:** `src/types/index.ts`
