# Axon — Website Spec Sheet

**Version:** v0.1.0  
**Snapshot:** July 2026  
**Product:** Local-first study productivity command center  

Offline by default. Optional Supabase auth + cloud sync when env vars are configured.

| Attribute | Value |
|-----------|--------|
| Theme default | Dark |
| Theme optional | Light (Settings) |
| Design direction | Quiet-luxury SaaS |
| Persistence | Offline-first (localStorage) |
| App routes | 9 |
| Marketing / legal pages | 5 |
| Design scopes | 2 (marketing + dashboard) |

---

## 1. Product overview

Distraction-free command center for students: tasks, calendar, focus timers, flashcards, analytics, goals, and XP/rank progression.

| Surface | Path | Primary job |
|---------|------|-------------|
| Dashboard | `/dashboard` | Today overview — agenda, progress, shortcuts |
| Kanban | `/kanban` | Objective board with DnD columns & recycle bin |
| Calendar | `/calendar` | Month / week / day scheduling of objectives |
| Flashcards | `/flashcards` | Folders → sets → study + 3D gallery |
| Pomodoro | `/pomodoro` | Multi-timer focus sessions (ring / blob) |
| Analytics | `/analytics` | Focus trends & productivity charts |
| Goals | `/goals` | Daily / weekly targets with streaks |
| Rank | `/rank` | XP ladder — Novice I → Polymath III |
| Settings | `/settings` | Theme, sync status, notifications |

---

## 2. Information architecture

### Primary nav

1. Dashboard  
2. Kanban  
3. Calendar  
4. Flashcards  
5. Pomodoro  

### Progress group

Grouped under **Progress** (default href: `/analytics`):

- Analytics  
- Goals  
- Rank  

**Settings** sits outside the group (sidebar footer / flat list for mobile & command palette).

### Marketing & auth

| Page | Path | Notes |
|------|------|--------|
| Landing | `/` | Always dark — ignores stored theme |
| Login | `/login` | Email/password + Google OAuth |
| FAQ | `/faq` | Support content |
| Privacy | `/privacy` | Legal |
| Terms | `/terms` | Legal |

---

## 3. Design scopes

Two visual systems share one token set. Scope is set on `html[data-scope]`. Dashboard scope also reaches portaled Radix overlays.

### Marketing (landing & public pages)

| Role | Font |
|------|------|
| UI / body | Instrument Sans |
| Display / headlines | Sansation |
| Data / mono | Fragment Mono |

**Radii:** sm 8px → md 12px → lg 16px → xl 20px · pill = full (`9999px`)

### Dashboard (`data-scope="dashboard"`)

| Role | Font |
|------|------|
| UI + display | Inter |
| Data / mono | JetBrains Mono |

**Radii (flattened):** sm 3px → md 4px → lg 6px → xl 8px · pill = 3px  

Sharp, dense dashboard chrome (Linear-adjacent).

---

## 4. Color system

Near-black neutral scale (not blue-tinted). One restrained steel-blue accent. Depth from value steps + hairline borders, not heavy glow.

### Dark theme (default)

| Token | Hex | Role |
|-------|-----|------|
| `background` | `#0a0a0a` | Page canvas |
| `surface` | `#111111` | Chrome / sidebar |
| `card` | `#161616` | Panels & cards |
| `card-hover` | `#1c1c1c` | Hover lift |
| `border` | `#232323` | Hairline |
| `border-strong` | `#333333` | Emphasized edge |
| `foreground` | `#f5f5f5` | Primary text |
| `muted` | `#8a8a8f` | Secondary text |
| `muted-foreground` | `#6e6e73` | Tertiary text |
| `accent` | `#5b8def` | Actions / focus |
| `accent-foreground` | `#f0f4fc` | Text on accent |
| `accent-muted` | `#141a28` | Accent wash |
| `secondary` | `#8b7ec8` | Secondary accent |
| `secondary-foreground` | `#f3efff` | Text on secondary |
| `secondary-muted` | `#241f38` | Secondary wash |
| `success` | `#3dba6e` | Positive |
| `success-muted` | `#122d1e` | Success wash |
| `warning` | `#e0a03a` | Caution |
| `warning-muted` | `#33260e` | Warning wash |
| `danger` | `#e05555` | Destructive |
| `danger-muted` | `#331515` | Danger wash |

### Light theme

| Token | Hex | Role |
|-------|-----|------|
| `background` | `#f7f6f2` | Warm near-white page |
| `surface` | `#edebe5` | Chrome (distinct from cards) |
| `card` | `#ffffff` | Floating panels |
| `card-hover` | `#f6f5f1` | Hover lift |
| `border` | `#e1ded6` | Hairline |
| `border-strong` | `#c7c2b8` | Emphasized edge |
| `foreground` | `#17181c` | Primary text |
| `muted` | `#5c6068` | Secondary text |
| `muted-foreground` | `#7b7f88` | Tertiary text |
| `accent` | `#4a7fd4` | Actions (slightly deeper) |
| `accent-foreground` | `#f0f4fc` | Text on accent |
| `accent-muted` | `#e8eef8` | Accent wash |
| `secondary` | `#6d5fad` | Secondary accent |
| `secondary-foreground` | `#f5f3ff` | Text on secondary |
| `secondary-muted` | `#eeeaf8` | Secondary wash |
| `success` | `#16a34a` | Positive |
| `success-muted` | `#dcfce7` | Success wash |
| `warning` | `#d97706` | Caution |
| `warning-muted` | `#fef3c7` | Warning wash |
| `danger` | `#dc2626` | Destructive |
| `danger-muted` | `#fee2e2` | Danger wash |

### Design direction

Quiet-luxury dark SaaS: true neutrals, single steel-blue accent, flat cards, hairline borders, close-in elevation. Avoid purple gradients, heavy glow, and glassy blur — those are legacy language only. Surfaces use flat opaque cards (legacy `.glass` / `.glass-panel` class names — no blur).

---

## 5. Typography & geometry

### Type roles

| Role | Marketing | Dashboard |
|------|-----------|-----------|
| Sans / UI | Instrument Sans | Inter |
| Display | Sansation | Inter |
| Mono | Fragment Mono | JetBrains Mono |

### Radii

| Token | Marketing | Dashboard |
|-------|-----------|-----------|
| `--radius-sm` | 0.5rem (8px) | 0.1875rem (3px) |
| `--radius-md` | 0.75rem (12px) | 0.25rem (4px) |
| `--radius-lg` | 1rem (16px) | 0.375rem (6px) |
| `--radius-xl` | 1.25rem (20px) | 0.5rem (8px) |
| `--radius-pill` | 9999px | 0.1875rem (3px) |

### Elevation

Quiet, close-in depth. Four steps: `--shadow-elevation-1` → `--shadow-elevation-4`, plus `--shadow-soft`.

---

## 6. Feature capabilities

| Domain | Capabilities | Store key(s) |
|--------|--------------|--------------|
| Objectives | Kanban DnD, subtasks, attachments, deps, recurrence, soft-delete | `axon:kanban:objectives` |
| Calendar | Month/week/day, agenda, unscheduled rail, ICS export | Shared objectives + device view prefs |
| Flashcards | Folders, sets, mastery, 3D dome gallery, cover uploads | `axon:flashcards:folders`, `axon:flashcards:sets` |
| Pomodoro | Multi-timer, ring/blob display, session history, notes | `axon:pomodoro:timers`, `axon:pomodoro:sessions` |
| Goals | Daily/weekly targets, auto from real data, history | `axon:goals`, `axon:goals:history`, `axon:goals:meta` |
| Progress / XP | Deterministic XP, levels 1–30, 10 ranks × 3 tiers | `axon:progress:v1` |
| Onboarding | Feature tour state | `axon:onboarding:seen` (device-local) |

**Device-local (not synced):** calendar view mode, pomodoro display mode, onboarding tour state.

---

## 7. Rank ladder

30 levels · 10 named ranks · tiers I / II / III each  
Range: **Novice I** → **Polymath III**

| # | Rank |
|---|------|
| 1 | Novice |
| 2 | Apprentice |
| 3 | Scholar |
| 4 | Adept |
| 5 | Fellow |
| 6 | Mentor |
| 7 | Sage |
| 8 | Luminary |
| 9 | Magister |
| 10 | Polymath |

---

## 8. Architecture

### Persistence

- `useLocalStorage` is the single persistence boundary  
- Pub/sub in-tab + `storage` events for cross-tab sync  
- Domain hooks (`use-objectives`, `use-flashcards`, etc.) are the feature API  

### Auth + sync (optional)

- Supabase when `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set  
- Push debounce: **1.2s** after local writes  
- Pull: every **60s** when tab is visible  
- Conflict resolution: **last-write-wins** on `updatedAt`  
- Full sync on sign-in / reconnect; account switch clears local synced data before pull  

### Page pattern

- Thin pages, fat feature components  
- Scaffolding: `AppPage` → `PageHeader` + `Panel`  
- Radix primitives + CVA variants  

### Provider tree

```
AppProviders
  └─ AuthProvider
       └─ SyncProvider
            └─ {children}
```

---

## 9. Tech stack

| Layer | Choices |
|-------|---------|
| Framework | Next.js 15.5 App Router · React 18 · TypeScript 5.6 |
| Styling | Tailwind CSS v4 · Radix UI · CVA · clsx / tailwind-merge |
| Motion | Framer Motion · GSAP · Lenis |
| 3D / visual | Three.js · OGL · react-parallax-tilt |
| Drag-and-drop | @dnd-kit (Kanban + Calendar) |
| Forms | React Hook Form · Zod |
| Charts | Recharts |
| Backend | Supabase (optional) — auth, sync, flashcard images |
| Icons | lucide-react |
| Fonts | next/font/google |

**Path alias:** `@/*` → `./src/*`

---

## 10. UI kit inventory

Radix-backed primitives under `src/components/ui/`:

| Component | Component | Component |
|-----------|-----------|-----------|
| Button | Card | Panel |
| Dialog | ConfirmDialog | Dropdown |
| Select | Tabs | Accordion |
| Input | Textarea | Label |
| Badge | ProgressBar | Skeleton |
| EmptyState | Stepper | TiltCard |
| Confetti | AnimatedCounter | AnimatedList |
| ScrollReveal | GrainOverlay | |

---

## 11. Motion & accessibility

### Motion principles

- Calm, purposeful — presence, not noise  
- Utilities: accordion, shimmer, ripple, pulse-glow  
- `prefers-reduced-motion`: durations collapsed globally  

### Atmosphere

- Soft grain overlay (opacity `0.035`, overlay blend)  
- Subtle vignette at viewport edges  
- Selection uses `accent-muted` wash  

---

## 12. Environment

Optional (gitignored `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Without these vars, the app runs fully offline — cloud features disabled, no auth.

Dev: `npm run dev` → http://localhost:3000

---

## Sources

- `src/app/globals.css`  
- `src/constants/navigation.ts`  
- `src/lib/progress/ranks.ts`  
- `package.json`  
- `CLAUDE.md`  
