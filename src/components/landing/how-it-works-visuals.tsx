import { Flame, Layers, Plus, Search, Timer } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
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
  const r = 42;
  const c = 2 * Math.PI * r;
  const progress = 0.62;
  const offset = c * (1 - progress);

  return (
    <div className={cn(FRAME, "justify-center gap-3")}>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Focus session
      </p>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
        <div className="relative flex aspect-square h-full max-h-[11rem] w-full max-w-[11rem] shrink-0 items-center justify-center sm:max-h-[13rem] sm:max-w-[13rem]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="5"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Timer className="mb-1 h-4 w-4 text-accent" aria-hidden />
            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              18:42
            </p>
          </div>
        </div>
        <div className="flex w-full max-w-[16rem] flex-col justify-center rounded-[var(--radius-md)] border border-border bg-card p-5 shadow-[var(--shadow-elevation-1)] sm:max-w-none sm:flex-1 sm:self-stretch sm:p-6">
          <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
            Linked objective
          </p>
          <p className="mt-2.5 text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Calc II problem set
          </p>
          <p className="mt-2 text-xs text-muted-foreground">25 min · work interval</p>
        </div>
      </div>
    </div>
  );
}

function FlashcardsVisual() {
  return (
    <div className={cn(FRAME, "justify-center gap-2")}>
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Review set
        </p>
        <Layers className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
      </div>
      <div className="relative mx-auto flex min-h-0 w-full max-w-none flex-1 items-center">
        <div
          aria-hidden
          className="absolute inset-x-3 top-3 bottom-0 rounded-[var(--radius-md)] border border-border/80 bg-card/40"
        />
        <div
          aria-hidden
          className="absolute inset-x-1.5 top-1.5 bottom-0 rounded-[var(--radius-md)] border border-border bg-card/70"
        />
        <div className="relative flex h-full min-h-[10rem] w-full flex-col justify-center rounded-[var(--radius-md)] border border-border bg-card p-5 shadow-[var(--shadow-elevation-2)] sm:min-h-[12rem] sm:p-6">
          <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
            Front
          </p>
          <p className="mt-3 text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
            What is the derivative of ln(x)?
          </p>
          <div className="mt-auto border-t border-border pt-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Organic Chem · Deck A</span>
              <span className="tabular-nums text-foreground/70">72%</span>
            </div>
            <ProgressBar value={72} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [38, 62, 45, 78, 70, 88, 74];

  return (
    <div className={FRAME}>
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        This week
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[var(--radius-sm)] border border-border bg-card p-3 shadow-[var(--shadow-elevation-1)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
              Streak
            </p>
            <Flame className="h-3.5 w-3.5 text-warning" aria-hidden />
          </div>
          <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight text-foreground">
            12 days
          </p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-card p-3 shadow-[var(--shadow-elevation-1)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
              Focus
            </p>
            <Timer className="h-3.5 w-3.5 text-accent" aria-hidden />
          </div>
          <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight text-foreground">
            96 min
          </p>
        </div>
      </div>
      <div className="mt-2.5 rounded-[var(--radius-sm)] border border-border bg-card p-3 shadow-[var(--shadow-elevation-1)]">
        <p className="mb-2.5 text-[10px] font-medium uppercase tracking-wide text-foreground/50">
          Focus minutes
        </p>
        <div className="flex h-14 items-end gap-1.5" aria-hidden>
          {bars.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t-[2px]",
                i === bars.length - 1 ? "bg-accent" : "bg-accent/45"
              )}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div
          className="mt-1.5 flex justify-between font-mono text-[9px] tracking-wide text-muted-foreground"
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
