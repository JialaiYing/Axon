import {
  Gauge,
  History,
  Layers,
  Minimize2,
  Pause,
  Pin,
  Plus,
  Repeat,
  Search,
  ShieldAlert,
  Sparkles,
  Square,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StreakFlame } from "@/components/ui/streak-flame";
import { cn } from "@/lib/utils";

/** Fills the chrome frame; tight padding so content fills the frame. */
const FRAME =
  "flex h-full w-full flex-col justify-start bg-background p-1.5 sm:p-2 overflow-hidden";

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "border-danger/40 bg-danger-muted text-danger",
  high: "border-warning/40 bg-warning-muted text-warning",
  medium: "border-border bg-card text-muted-foreground",
  low: "border-border bg-card text-muted-foreground",
};

/** Mirrors the real Kanban board: toolbar + 3 glass columns + objective cards. */
function KanbanCaptureVisual() {
  const columns = [
    {
      title: "To Go Queue",
      description: "Not started yet",
      cards: [
        {
          title: "Lab report",
          subject: "Chemistry",
          priority: "high",
          progress: 0,
          color: "#3b82f6",
        },
        {
          title: "Read ch. 6",
          subject: "Physics",
          priority: "medium",
          progress: 15,
          color: "#22c55e",
        },
      ],
    },
    {
      title: "In Progress",
      description: "Currently working",
      cards: [
        {
          title: "Calc II problem set",
          subject: "Math",
          priority: "urgent",
          progress: 45,
          color: "#f59e0b",
        },
      ],
    },
    {
      title: "Finished",
      description: "Completed objectives",
      cards: [
        {
          title: "Office hours prep",
          subject: "Biology",
          priority: "low",
          progress: 100,
          color: "#a855f7",
        },
      ],
    },
  ];

  return (
    <div className={cn(FRAME, "gap-1.5")}>
      {/* Toolbar — matches KanbanToolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative min-w-0 flex-1 max-w-[10rem]">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <div className="h-7 rounded-md border border-border bg-card/60 pl-7 pr-2 text-[10px] leading-7 text-muted-foreground">
              Search objectives...
            </div>
          </div>
          <div className="hidden h-7 items-center rounded-md border border-border bg-card/60 px-2 text-[10px] text-muted-foreground sm:flex">
            All priorities
          </div>
        </div>
        <div className="flex h-7 shrink-0 items-center gap-1 rounded-md bg-accent px-2 text-[10px] font-medium text-accent-foreground">
          <Plus className="h-3 w-3" aria-hidden />
          New objective
        </div>
      </div>

      {/* Board columns */}
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
        {columns.map((col) => (
          <div
            key={col.title}
            className="flex min-w-0 flex-col rounded-[var(--radius-md)] border border-border/60 bg-card/40 p-2 shadow-[var(--shadow-elevation-1)] backdrop-blur-sm"
          >
            <div className="mb-2 flex items-start justify-between gap-1 px-0.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[11px] font-semibold tracking-tight text-foreground">
                    {col.title}
                  </p>
                  <span className="rounded-full border border-border bg-card px-1.5 py-px text-[9px] font-medium text-muted-foreground">
                    {col.cards.length}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                  {col.description}
                </p>
              </div>
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground"
                aria-hidden
              >
                <Plus className="h-3 w-3" />
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              {col.cards.map((card) => (
                <div
                  key={card.title}
                  className="relative overflow-hidden rounded-[var(--radius-sm)] border border-border bg-card/80 p-2 shadow-[var(--shadow-elevation-1)]"
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-2 h-[calc(100%-16px)] w-0.5 rounded-full"
                    style={{ backgroundColor: card.color }}
                  />
                  <p className="pl-1.5 text-[11px] font-medium leading-snug text-foreground">
                    {card.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-1.5">
                    <span
                      className={cn(
                        "rounded-full border px-1.5 py-px text-[8px] font-medium capitalize",
                        PRIORITY_BADGE[card.priority]
                      )}
                    >
                      {card.priority}
                    </span>
                    <span className="rounded-full border border-border px-1.5 py-px text-[8px] font-medium text-muted-foreground">
                      {card.subject}
                    </span>
                  </div>
                  <div className="mt-1.5 pl-1.5">
                    <ProgressBar value={card.progress} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PomodoroVisual() {
  const r = 44;
  const c = 2 * Math.PI * r;
  const progress = 0.62;
  const offset = c * (1 - progress);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background/95 p-3">
      {/* Mirrors TimerFullscreenOverlay — Focus Mode */}
      <span
        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground"
        aria-hidden
      >
        <Minimize2 className="h-3.5 w-3.5" />
      </span>

      <div className="flex w-full flex-col items-center gap-3 sm:gap-4">
        <h3 className="max-w-[16rem] text-center font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Calc II problem set
        </h3>

        <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-muted px-2.5 py-0.5 text-[10px] font-medium text-accent">
          <Target className="h-3 w-3" aria-hidden />
          Focus Mode
        </span>

        <div className="relative flex aspect-square w-[55%] max-w-[11.5rem] items-center justify-center sm:max-w-[13rem]">
          <div
            aria-hidden
            className="absolute rounded-full blur-2xl"
            style={{
              width: "85%",
              height: "85%",
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 20%, transparent), transparent 70%)",
            }}
          />
          <svg className="relative h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <defs>
              <linearGradient id="focus-mode-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="var(--color-secondary)" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="4"
              opacity={0.6}
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="url(#focus-mode-ring-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
              18:42
            </p>
            <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Remaining
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-secondary/90 px-3 text-xs font-medium text-secondary-foreground">
            <Pause className="h-3.5 w-3.5" aria-hidden />
            Pause
          </span>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground">
            <Square className="h-3.5 w-3.5" aria-hidden />
            Stop
          </span>
        </div>

        <div className="mt-1 flex max-w-sm items-start gap-2 rounded-lg border border-border/60 bg-surface/50 px-2.5 py-2 text-left">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Leaving this tab pauses your session. Close distractions before you start.
          </p>
        </div>
      </div>
    </div>
  );
}

function FlashcardsVisual() {
  const glance = [
    { label: "Folders", value: "4" },
    { label: "Sets", value: "11" },
    { label: "Cards", value: "86" },
    { label: "Mastery", value: "72%" },
  ];
  const libraryItems = [
    { kind: "folder" as const, title: "Organic Chem", meta: "3 sets", color: "#3b82f6" },
    { kind: "folder" as const, title: "Calc II", meta: "2 sets", color: "#22c55e" },
    {
      kind: "set" as const,
      title: "Thermodynamics",
      meta: "24 cards",
      mastery: 68,
    },
    {
      kind: "set" as const,
      title: "Derivatives",
      meta: "18 cards",
      mastery: 81,
    },
  ];

  return (
    <div className={cn(FRAME, "gap-2")}>
      {/* Mirrors FlashcardsSection — Home column + library grid */}
      <div className="grid min-h-0 flex-1 grid-cols-[0.9fr_1.4fr] gap-2">
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden px-0.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground">
            Home
          </p>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Gauge className="h-3 w-3 text-muted-foreground" aria-hidden />
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/50">
                At a glance
              </p>
            </div>
            <ul className="divide-y divide-border/60">
              {glance.map((stat) => (
                <li
                  key={stat.label}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                  <span className="font-mono text-[10px] font-semibold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <History className="h-3 w-3 text-muted-foreground" aria-hidden />
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/50">
                Recent
              </p>
            </div>
            <div className="py-1.5">
              <p className="truncate text-xs font-medium text-foreground">Organic Chem · Deck A</p>
              <p className="mt-0.5 text-[10px] text-foreground/45">Opened just now</p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-foreground/8 bg-background/40">
          <div className="flex items-center justify-between border-b border-foreground/8 bg-foreground/[0.02] px-2.5 py-1.5">
            <p className="text-[10px] font-medium text-foreground/70">Library</p>
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Layers className="h-3 w-3" aria-hidden />
              Icons
            </span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-hidden p-2">
            {libraryItems.map((item) => (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-xl border border-foreground/8 bg-card/80 p-2.5 shadow-[var(--shadow-elevation-1)]"
              >
                <div className="flex items-start justify-between gap-1">
                  {item.kind === "folder" ? (
                    <span
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                  ) : (
                    <Layers className="h-3.5 w-3.5 shrink-0 text-foreground/50" aria-hidden />
                  )}
                  <Pin className="h-3 w-3 shrink-0 text-foreground/25" aria-hidden />
                </div>
                <div className="mt-2 min-w-0">
                  <p className="truncate text-[11px] font-semibold tracking-tight text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">{item.meta}</p>
                  {item.kind === "set" && (
                    <span
                      className={cn(
                        "mt-1.5 inline-flex rounded-full border px-1.5 py-px text-[8px] font-medium",
                        item.mastery >= 70
                          ? "border-success/40 bg-success-muted text-success"
                          : "border-warning/40 bg-warning-muted text-warning"
                      )}
                    >
                      {item.mastery}% mastery
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [38, 62, 45, 78, 70, 88, 74];
  const stats = [
    {
      label: "Streak",
      value: "12 days",
      iconNode: <StreakFlame days={12} size="xs" animated={false} />,
    },
    { label: "Focus today", value: "96 min", icon: Timer, iconClass: "text-accent" },
    { label: "Intervals", value: "34", icon: Repeat, iconClass: "text-foreground/60" },
    { label: "Productivity", value: "82%", icon: Gauge, iconClass: "text-foreground/60" },
  ];

  return (
    <div className={cn(FRAME, "gap-2")}>
      {/* Mirrors dashboard stats strip + focus week + rank */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-md)] border border-border bg-card md:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col justify-between p-2.5",
              index % 2 === 1 && "border-l border-border",
              index >= 2 && "border-t border-border md:border-t-0",
              index === 2 && "md:border-l"
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/60">
                {stat.label}
              </p>
              {"iconNode" in stat && stat.iconNode
                ? stat.iconNode
                : "icon" in stat && stat.icon
                  ? (
                      <stat.icon
                        className={cn("h-3 w-3 shrink-0", "iconClass" in stat ? stat.iconClass : undefined)}
                        aria-hidden
                      />
                    )
                  : null}
            </div>
            <p className="mt-2 text-sm font-semibold tabular-nums tracking-tight text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 rounded-[var(--radius-md)] border border-border bg-card p-2.5 shadow-[var(--shadow-elevation-1)]">
        <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/55">
          Focus this week
        </p>
        <div className="flex h-[4.5rem] items-end gap-1 sm:h-[5.5rem]" aria-hidden>
          {bars.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t-[2px]",
                i === bars.length - 1 ? "bg-accent" : "bg-accent/40"
              )}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div
          className="mt-1 flex justify-between font-mono text-[8px] tracking-wide text-muted-foreground"
          aria-hidden
        >
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
          <span>S</span>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-card p-2.5 shadow-[var(--shadow-elevation-1)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Trophy className="h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/60">
                Current rank
              </p>
              <p className="text-sm font-semibold tracking-tight text-foreground">Scholar II</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-1.5 py-0.5">
            <span className="flex items-center gap-0.5 text-[9px] font-medium text-accent">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              +42 XP
            </span>
            <span className="h-2.5 w-px bg-border" aria-hidden />
            <span className="text-[9px] font-medium text-muted-foreground">Lvl 8</span>
          </div>
        </div>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[9px] text-foreground/55">
            <span>XP to next level</span>
            <span className="tabular-nums text-foreground/70">640 / 940</span>
          </div>
          <ProgressBar value={68} size="sm" />
        </div>
      </div>
    </div>
  );
}

const VISUALS = [
  KanbanCaptureVisual,
  PomodoroVisual,
  FlashcardsVisual,
  AnalyticsVisual,
] as const;

export function HowItWorksVisual({ index }: { index: number }) {
  const Visual = VISUALS[index] ?? KanbanCaptureVisual;
  return (
    <div data-theme="dark" className="h-full w-full">
      <Visual />
    </div>
  );
}
