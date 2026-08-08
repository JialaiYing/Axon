"use client";

import { AlertTriangle, ListTodo, Plus, Sparkles, Timer, Trophy } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StreakFlame } from "@/components/ui/streak-flame";
import {
  landingPreviewHaloStyle,
  ProductChrome,
} from "@/components/landing/landing-primitives";
import { colorForSubject } from "@/lib/subject-colors";
import { cn } from "@/lib/utils";

/**
 * Hero product shot — mirrors the live Dashboard composition:
 * greeting → Today agenda → stats (streak / focus / open today) → Rank + daily n/3.
 */

const DEMO_STREAK = 12;

const AGENDA = {
  overdue: [
    { title: "Org chem problem set", meta: "Due Jul 19", subject: "Chemistry" },
  ],
  dueToday: [
    { title: "Read ch. 6 thermodynamics", meta: "Due today", subject: "Physics" },
  ],
  focus: [
    {
      title: "Calc II problem set",
      meta: "9:30 · 30m",
      subject: "Math",
    },
  ],
} as const;

function AgendaRow({
  title,
  meta,
  subject,
  tone,
}: {
  title: string;
  meta: string;
  subject: string;
  tone?: "danger";
}) {
  return (
    <div className="flex items-center gap-2.5 px-1 py-1.5">
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "danger" && "bg-danger"
        )}
        style={
          tone === "danger" ? undefined : { backgroundColor: colorForSubject(subject) }
        }
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] font-medium",
            tone === "danger" ? "text-danger" : "text-foreground"
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[11px]",
            tone === "danger" ? "text-danger/80" : "text-muted-foreground"
          )}
        >
          {meta}
        </p>
      </div>
    </div>
  );
}

function PreviewBody() {
  return (
    <div className="flex flex-col gap-5 bg-background p-3 sm:gap-6 sm:p-5">
      {/* Greeting + CTAs — matches dashboard-overview header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-muted sm:text-[13px]">
            Tuesday, July 21
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Good morning, Alex
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground">
            <Plus className="h-3.5 w-3.5" aria-hidden /> New objective
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-foreground">
            <Timer className="h-3.5 w-3.5" aria-hidden /> Start focus
          </span>
        </div>
      </div>

      {/* Today agenda — matches TodayAgendaPanel */}
      <section className="rounded-md border border-border/50 p-3.5 sm:p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-muted sm:text-[13px]">Today</p>
            <p className="mt-0.5 text-lg font-medium tracking-tight text-foreground sm:text-xl">
              Your agenda
            </p>
          </div>
          <span className="mt-1 shrink-0 text-[12px] font-medium text-muted-foreground sm:text-[13px]">
            5 cards due
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-danger" aria-hidden />
              <p className="text-[12px] font-medium text-danger">Overdue</p>
              <span className="font-mono text-[12px] tabular-nums text-danger">
                · {AGENDA.overdue.length}
              </span>
            </div>
            <div className="-mx-1 divide-y divide-border/50">
              {AGENDA.overdue.map((row) => (
                <AgendaRow key={row.title} {...row} tone="danger" />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5 text-muted" aria-hidden />
              <p className="text-[12px] font-medium text-muted">Due today</p>
              <span className="font-mono text-[12px] tabular-nums text-muted">
                · {AGENDA.dueToday.length}
              </span>
            </div>
            <div className="-mx-1 divide-y divide-border/50">
              {AGENDA.dueToday.map((row) => (
                <AgendaRow key={row.title} {...row} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-muted" aria-hidden />
              <p className="text-[12px] font-medium text-muted">Scheduled focus</p>
              <span className="font-mono text-[12px] tabular-nums text-muted">
                · {AGENDA.focus.length}
              </span>
            </div>
            <div className="-mx-1 divide-y divide-border/50">
              {AGENDA.focus.map((row) => (
                <AgendaRow key={row.title} {...row} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats — streak / focus today / open today */}
      <div className="grid grid-cols-3 border-y border-border/50">
        {[
          {
            label: "Streak",
            value: `${DEMO_STREAK}`,
            suffix: " days",
            hint: "Keep it going",
            icon: <StreakFlame days={DEMO_STREAK} size="sm" animated={false} />,
          },
          {
            label: "Focus today",
            value: "96",
            suffix: " min",
            hint: "2 sessions · vs yesterday",
            icon: <Timer className="h-3.5 w-3.5 text-muted" aria-hidden />,
          },
          {
            label: "Open today",
            value: "2",
            suffix: "",
            hint: "Overdue + due today",
            icon: <ListTodo className="h-3.5 w-3.5 text-muted" aria-hidden />,
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={cn("flex flex-col justify-between p-3", i > 0 && "border-l border-border/50")}
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-[12px] font-medium text-muted">{stat.label}</p>
              {stat.icon}
            </div>
            <div className="mt-2">
              <p className="font-mono text-xl font-medium tabular-nums tracking-tight text-foreground sm:text-2xl">
                {stat.value}
                <span className="text-sm font-medium text-muted-foreground">{stat.suffix}</span>
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{stat.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rank strip + daily goal glance */}
      <div className="flex overflow-hidden rounded-md border border-border/50">
        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-wash text-warning">
                <Trophy className="h-3.5 w-3.5 fill-current" aria-hidden />
              </span>
              <div>
                <p className="text-[12px] font-medium text-muted">Rank</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
                  <p className="text-lg font-medium tracking-tight text-foreground sm:text-xl">
                    Scholar II
                  </p>
                  <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                    Level 8
                  </span>
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  XP to next level
                  <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    +42 today
                  </span>
                </span>
                <span className="font-mono tabular-nums text-foreground/70">640 / 940</span>
              </div>
              <ProgressBar value={68} size="sm" />
            </div>
          </div>
        </div>
        <div className="flex w-[4.75rem] shrink-0 flex-col justify-center border-l border-border/50 px-2 py-3 text-center sm:w-24 sm:px-3">
          <p className="text-[11px] font-medium text-muted sm:text-[12px]">Daily</p>
          <p className="mt-1 font-mono text-lg font-medium tabular-nums tracking-tight text-foreground sm:text-xl">
            2<span className="text-muted-foreground">/3</span>
          </p>
        </div>
      </div>
    </div>
  );
}

interface DashboardPreviewProps {
  className?: string;
}

/** Static product frame for the hero — motion lives on the page, not the chrome. */
export function DashboardPreview({ className }: DashboardPreviewProps) {
  return (
    <div className={cn("relative rounded-md", className)} style={landingPreviewHaloStyle}>
      <ProductChrome title="Dashboard" className="shadow-none">
        <PreviewBody />
      </ProductChrome>
    </div>
  );
}
