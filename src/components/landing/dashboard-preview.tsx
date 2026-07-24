"use client";

import {
  Circle,
  Gauge,
  Plus,
  Repeat,
  Target,
  Timer,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StreakFlame } from "@/components/ui/streak-flame";
import { ProductChrome } from "@/components/landing/landing-primitives";
import { cn } from "@/lib/utils";

/**
 * Hero product shot — one focused composition, not a full dashboard dump.
 * Mirrors live dashboard density without the clutter that reads as template.
 */

const UP_NEXT = [
  { title: "Read ch. 6 thermodynamics", color: "#5b8def" },
  { title: "Review flashcard deck", color: "#22c55e" },
  { title: "Office hours prep", color: "#f59e0b" },
];

const DEMO_STREAK = 12;

function PreviewBody() {
  return (
    <div className="space-y-4 bg-background p-3 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            Tuesday, July 21
          </p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Good morning, Alex
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
            <Plus className="h-3.5 w-3.5" aria-hidden /> New objective
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground">
            <Timer className="h-3.5 w-3.5" aria-hidden /> Start focus
          </span>
        </div>
      </div>

      <section className="rounded-md border border-border/50 p-3.5 sm:p-4">
        <div className="mb-3.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            Today
          </p>
          <p className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">
            Your agenda
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_minmax(0,0.9fr)] lg:gap-6">
          <div className="space-y-3.5">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-danger">
                Overdue
                <span className="font-mono tabular-nums text-danger/80">1</span>
              </p>
              <div className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5">
                <p className="min-w-0 truncate text-[13px] font-medium text-danger">
                  Org chem problem set
                </p>
                <span className="shrink-0 text-[11px] text-danger/80">Due Jul 19</span>
              </div>
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted">
                <Timer className="h-3 w-3" aria-hidden /> Scheduled focus
                <span className="font-mono tabular-nums">1</span>
              </p>
              <div className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5">
                <p className="min-w-0 truncate text-[13px] font-medium text-foreground">
                  Focus session, Calc II
                </p>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  9:30–10:00
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              <Target className="h-3 w-3" aria-hidden /> Goals
            </p>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Focus time</span>
                <span className="font-mono tabular-nums text-foreground/70">96/120 min</span>
              </div>
              <ProgressBar value={80} size="sm" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Objectives</span>
                <span className="font-mono tabular-nums text-foreground/70">2/5</span>
              </div>
              <ProgressBar value={40} size="sm" />
            </div>
          </div>
        </div>
      </section>

      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
          Up next
        </p>
        <ul className="divide-y divide-border/50 border-y border-border/50">
          {UP_NEXT.map((item) => (
            <li key={item.title} className="flex items-center gap-2.5 px-0.5 py-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                {item.title}
              </p>
              <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 border-y border-border/50 md:grid-cols-4">
        {[
          {
            label: "Streak",
            value: `${DEMO_STREAK}`,
            suffix: " days",
            icon: <StreakFlame days={DEMO_STREAK} size="sm" animated={false} />,
          },
          {
            label: "Focus today",
            value: "96",
            suffix: " min",
            icon: <Timer className="h-3.5 w-3.5 text-accent" aria-hidden />,
          },
          {
            label: "Intervals",
            value: "34",
            suffix: "",
            icon: <Repeat className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />,
          },
          {
            label: "Productivity",
            value: "82",
            suffix: "%",
            icon: <Gauge className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />,
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-1.5 p-3",
              i % 2 === 1 && "border-l border-border/50",
              i >= 2 && "border-t border-border/50 md:border-t-0",
              i === 2 && "md:border-l"
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-[11px] font-medium text-muted">{stat.label}</p>
              {stat.icon}
            </div>
            <p className="font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">
              {stat.value}
              <span className="text-sm font-medium text-muted-foreground">{stat.suffix}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DashboardPreviewProps {
  className?: string;
}

/** Static, tilt-free product frame for the hero — motion lives on the page, not the chrome. */
export function DashboardPreview({ className }: DashboardPreviewProps) {
  return (
    <div className={cn("relative", className)}>
      <ProductChrome title="Dashboard" className="shadow-[var(--shadow-elevation-3)]">
        <PreviewBody />
      </ProductChrome>
    </div>
  );
}
