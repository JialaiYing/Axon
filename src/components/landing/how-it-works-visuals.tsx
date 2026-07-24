import { Gauge, History, Layers, Maximize2, Pause, Plus, Search, Square, Target } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TimerRing } from "@/components/pomodoro/timer-ring";
import { priorityDotClass } from "@/lib/kanban-utils";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types";

/** Fills the chrome frame; mirrors live product density. */
const FRAME =
  "flex h-full w-full flex-col justify-start bg-background p-2 sm:p-2.5 overflow-hidden";

function PreviewCard({
  title,
  priority,
  subject,
  color,
  progress,
}: {
  title: string;
  priority: Priority;
  subject: string;
  color: string;
  progress?: number;
}) {
  return (
    <div className="group relative rounded-md border border-border/50 bg-card px-2.5 py-2">
      <span
        aria-hidden
        className="absolute left-0 top-2 h-[calc(100%-16px)] w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-start gap-2 pl-1.5">
        <span
          className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", priorityDotClass(priority))}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-snug text-foreground">{title}</p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            <span className="capitalize">{priority}</span>
            <span className="mx-1 text-border">·</span>
            {subject}
          </p>
          {progress != null && progress > 0 && (
            <ProgressBar value={progress} size="sm" className="mt-2" />
          )}
        </div>
      </div>
    </div>
  );
}

/** Real Kanban: bare columns, mono counts, flat cards with priority dots. */
function KanbanCaptureVisual() {
  const columns: {
    title: string;
    count: number;
    cards: {
      title: string;
      subject: string;
      priority: Priority;
      color: string;
      progress?: number;
    }[];
  }[] = [
    {
      title: "To Go Queue",
      count: 2,
      cards: [
        {
          title: "Lab report",
          subject: "Chemistry",
          priority: "high",
          color: "#3b82f6",
        },
        {
          title: "Read ch. 6",
          subject: "Physics",
          priority: "medium",
          color: "#22c55e",
          progress: 15,
        },
      ],
    },
    {
      title: "In Progress",
      count: 1,
      cards: [
        {
          title: "Calc II problem set",
          subject: "Math",
          priority: "urgent",
          color: "#f59e0b",
          progress: 45,
        },
      ],
    },
    {
      title: "Finished",
      count: 1,
      cards: [
        {
          title: "Office hours prep",
          subject: "Biology",
          priority: "low",
          color: "#8b7ec8",
          progress: 100,
        },
      ],
    },
  ];

  return (
    <div className={cn(FRAME, "gap-2")}>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 max-w-[11rem]">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <div className="h-7 rounded-md border border-border/50 bg-transparent pl-7 pr-2 text-[10px] leading-7 text-muted-foreground">
            Search objectives…
          </div>
        </div>
        <span className="inline-flex h-7 items-center gap-1 rounded-md bg-accent px-2 text-[10px] font-medium text-accent-foreground">
          <Plus className="h-3 w-3" /> New
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
        {columns.map((col) => (
          <div key={col.title} className="flex min-w-0 flex-col">
            <div className="mb-1.5 flex items-center justify-between gap-1 px-0.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <p className="truncate text-[13px] font-medium text-foreground">{col.title}</p>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {col.count}
                </span>
              </div>
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="flex flex-1 flex-col gap-1 rounded-md p-0.5">
              {col.cards.map((card) => (
                <PreviewCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Real calendar week grid: border-border/50, left-accent events, wash fills. */
function CalendarScheduleVisual() {
  const days = [
    { label: "Mon", date: "20" },
    { label: "Tue", date: "21" },
    { label: "Wed", date: "22", today: true },
    { label: "Thu", date: "23" },
    { label: "Fri", date: "24" },
  ];
  const hours = ["8 AM", "9 AM", "10 AM", "11 AM"];
  const hourPx = 40;

  return (
    <div className={cn(FRAME, "gap-0")}>
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="grid grid-cols-[36px_repeat(5,minmax(0,1fr))] border-b border-border/50 sm:grid-cols-[44px_repeat(5,minmax(0,1fr))]">
          <div />
          {days.map((day) => (
            <div key={day.label} className="border-l border-border/50 px-0.5 py-2 text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {day.label}
              </p>
              <span
                className={cn(
                  "mt-1 inline-flex h-5 w-5 items-center justify-center text-[11px] font-semibold tabular-nums sm:h-6 sm:w-6",
                  day.today
                    ? "rounded-full bg-foreground text-background"
                    : "text-foreground"
                )}
              >
                {day.date}
              </span>
            </div>
          ))}
        </div>

        <div
          className="relative grid grid-cols-[36px_repeat(5,minmax(0,1fr))] sm:grid-cols-[44px_repeat(5,minmax(0,1fr))]"
          style={{ height: hours.length * hourPx }}
        >
          <div className="relative">
            {hours.map((label, i) => (
              <div
                key={label}
                className="absolute right-1 -translate-y-1/2 font-mono text-[9px] text-muted-foreground sm:right-1.5 sm:text-[10px]"
                style={{ top: i * hourPx }}
              >
                {label}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day.label} className="relative border-l border-border/50">
              {hours.map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t border-border/50"
                  style={{ top: i * hourPx }}
                />
              ))}
            </div>
          ))}

          <div
            className="absolute z-[1] overflow-hidden rounded-md border border-border/60 border-l-[2px] border-l-warning bg-wash px-1 py-0.5"
            style={{
              left: "calc((100% - 36px) * 0.4 + 36px + 2px)",
              width: "calc((100% - 36px) * 0.2 - 6px)",
              top: hourPx,
              height: hourPx * 1.45 - 4,
            }}
          >
            <p className="truncate text-[10px] font-semibold text-foreground">Calc II focus</p>
            <p className="hidden font-mono text-[9px] text-muted-foreground sm:mt-0.5 sm:block">
              9:00–10:30
            </p>
          </div>

          <div
            className="absolute z-[1] overflow-hidden rounded-md border border-border/60 border-l-[2px] border-l-accent bg-wash px-1 py-0.5"
            style={{
              left: "calc((100% - 36px) * 0.4 + 36px + 2px)",
              width: "calc((100% - 36px) * 0.2 - 6px)",
              top: hourPx * 2.55,
              height: hourPx * 0.7,
            }}
          >
            <p className="truncate text-[10px] font-semibold text-foreground">Lab report</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Real timer card: wash chip, TimerRing, flat controls. */
function PomodoroVisual() {
  const remaining = 18 * 60 + 42;
  const total = 25 * 60;

  return (
    <div className={cn(FRAME, "items-center justify-center")}>
      <div className="relative flex w-full max-w-[240px] flex-col items-center gap-3 rounded-md border border-border/50 bg-card p-4 shadow-none">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-wash px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Target className="h-3 w-3" />
            Objective
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
        </div>

        <p className="w-full truncate text-center text-[13px] font-medium tracking-tight text-foreground">
          Calc II problem set
        </p>

        <div className="w-full max-w-[170px]">
          <TimerRing remainingSeconds={remaining} totalSeconds={total} />
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-[12px] font-medium text-secondary-foreground">
            <Pause className="h-3.5 w-3.5" />
            Pause
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/50 px-3 py-1.5 text-[12px] font-medium text-foreground">
            <Square className="h-3.5 w-3.5" />
            Stop
          </span>
        </div>
      </div>
    </div>
  );
}

/** Real flashcards home: sidebar stats + rounded-md library tiles. */
function FlashcardsVisual() {
  const glance = [
    { label: "Sets", value: "8" },
    { label: "Cards", value: "142" },
    { label: "Mastery", value: "64%" },
  ];
  const libraryItems = [
    { kind: "folder" as const, title: "Organic Chem", meta: "3 sets", color: "#3b82f6" },
    { kind: "folder" as const, title: "Calc II", meta: "2 sets", color: "#22c55e" },
    { kind: "set" as const, title: "Thermodynamics", meta: "24 cards · 68%" },
    { kind: "set" as const, title: "Derivatives", meta: "18 cards · 81%" },
  ];

  return (
    <div className={cn(FRAME, "gap-2")}>
      <div className="grid min-h-0 flex-1 grid-cols-[0.9fr_1.4fr] gap-2">
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Home
          </p>
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Gauge className="h-3 w-3 text-muted-foreground" aria-hidden />
              <p className="text-[11px] font-medium text-muted">At a glance</p>
            </div>
            <ul className="divide-y divide-border/50">
              {glance.map((stat) => (
                <li
                  key={stat.label}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <History className="h-3 w-3 text-muted-foreground" aria-hidden />
              <p className="text-[11px] font-medium text-muted">Recent</p>
            </div>
            <div className="py-1.5">
              <p className="truncate text-[13px] font-medium text-foreground">
                Organic Chem · Deck A
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Opened just now</p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border/50">
          <div className="flex items-center justify-between border-b border-border/50 px-2.5 py-1.5">
            <p className="text-[11px] font-medium text-muted">Library</p>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Layers className="h-3 w-3" aria-hidden />
              Icons
            </span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 overflow-hidden p-2">
            {libraryItems.map((item) => (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-md border border-border/50 bg-card p-2.5"
              >
                <div className="flex items-start justify-between gap-1">
                  {item.kind === "folder" ? (
                    <span
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-[2px] border border-border/50"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                  ) : (
                    <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                </div>
                <div className="mt-2 min-w-0">
                  <p className="truncate text-[12px] font-semibold tracking-tight text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const VISUALS = [
  KanbanCaptureVisual,
  CalendarScheduleVisual,
  PomodoroVisual,
  FlashcardsVisual,
] as const;

export function HowItWorksVisual({ index }: { index: number }) {
  const Visual = VISUALS[index] ?? KanbanCaptureVisual;
  return (
    <div data-theme="dark" className="h-full w-full">
      <Visual />
    </div>
  );
}
