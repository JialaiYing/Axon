"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Gauge,
  Minus,
  Plus,
  Repeat,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakFlame } from "@/components/ui/streak-flame";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import { TodayAgendaPanel } from "@/components/dashboard/today-agenda-panel";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useUserStats } from "@/hooks/use-user-stats";
import { useDisplayName } from "@/hooks/use-display-name";
import { DURATION, EASE } from "@/lib/motion";
import { computeCurrentStreak } from "@/lib/progress/streak";
import type { PomodoroSession } from "@/types";
import { cn } from "@/lib/utils";

// Linear-inspired pass (2026-07-23): one quiet page fade, no hero stagger.
// Backup: dashboard-overview.pre-linear.bak — say "revert" to restore.
const pageEnter = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE },
  },
};

/** Sum of focused minutes in an inclusive [startDaysAgo, endDaysAgo] window
 *  (e.g. `(13, 7)` = the 7-day period immediately before the current week). */
function focusMinutesInRange(sessions: PomodoroSession[], startDaysAgo: number, endDaysAgo: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - startDaysAgo);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() - endDaysAgo);
  end.setHours(23, 59, 59, 999);
  return sessions
    .filter((s) => s.type === "work" && s.durationMinutes > 0)
    .filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start.getTime() && t <= end.getTime();
    })
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

/** Percent-change trend chip for a stat card. Returns undefined instead of a
 *  misleading "+9999%" when there's no meaningful prior-period baseline. */
function percentTrend(current: number, previous: number): Trend | undefined {
  if (previous <= 0) return current > 0 ? { direction: "up", label: "New" } : undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { direction: "flat", label: "Same" };
  return { direction: pct > 0 ? "up" : "down", label: `${Math.abs(pct)}%` };
}


interface Trend {
  direction: "up" | "down" | "flat";
  label: string;
}

const TrendBadge = React.memo(function TrendBadge({ direction, label }: Trend) {
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-[14px] font-medium tabular-nums",
        direction === "up" && "text-success",
        direction === "down" && "text-danger",
        direction === "flat" && "text-foreground/60"
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
});

/** Border classes for one cell in the 4-up stats strip — a 2x2 grid on
 *  mobile that collapses to a single divided row of 4 at `md`. */
function statCellBorderClass(index: number) {
  return cn(
    index % 2 === 1 && "border-l border-border/60 light:border-border",
    index >= 2 && "border-t border-border/60 light:border-border",
    "md:border-t-0",
    index > 0 && "md:border-l md:border-border/60 light:md:border-border"
  );
}

const StatCell = React.memo(function StatCell({
  icon: Icon,
  iconNode,
  label,
  value,
  suffix,
  hint,
  iconClassName,
  trend,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  iconNode?: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  iconClassName?: string;
  trend?: Trend;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between p-2.5 sm:p-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-muted">
          {label}
        </p>
        {iconNode ?? (Icon ? <Icon className={cn("h-3.5 w-3.5", iconClassName ?? "text-muted")} /> : null)}
      </div>
      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-3xl font-medium tabular-nums tracking-tight text-foreground sm:text-4xl">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          {trend && <TrendBadge {...trend} />}
        </div>
        <p className="mt-0.5 text-[14px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
});

/** Rank band — spans the full page width as a single horizontal bar. */
function RankStrip({
  rankLabel,
  level,
  xpIntoLevel,
  xpForNextLevel,
  progressPercent,
  isMaxLevel,
  todayXp,
}: {
  rankLabel: string;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
  isMaxLevel: boolean;
  todayXp: number;
}) {
  return (
    <section className="rounded-md border border-border/50 p-4 light:border-border light:bg-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-warning/10">
            <Trophy className="h-4 w-4 text-warning" />
          </span>
          <div>
            <p className="text-[14px] font-medium text-muted">Rank</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">{rankLabel}</p>
              <span className="font-mono text-[15px] tabular-nums text-muted-foreground">
                Level {level}
              </span>
              {todayXp > 0 && (
                <span className="flex items-center gap-1 text-[15px] font-medium text-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  +{todayXp} today
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="w-full sm:max-w-xs sm:min-w-[220px]">
          <div className="mb-1.5 flex items-center justify-between text-[14px] text-muted-foreground">
            <span>{isMaxLevel ? "Max level" : "XP to next level"}</span>
            {!isMaxLevel && (
              <span className="font-mono tabular-nums text-foreground/70">
                {xpIntoLevel.toLocaleString()} / {xpForNextLevel?.toLocaleString()}
              </span>
            )}
          </div>
          <ProgressBar value={progressPercent} size="sm" />
        </div>
      </div>
    </section>
  );
}

/** Skeleton mirrors live hierarchy: hero agenda → one stats strip → rank band. */
function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      <Skeleton className="h-56 rounded-md" />
      <Skeleton className="h-28 rounded-md" />
      <Skeleton className="h-24 rounded-md" />
    </div>
  );
}

export function DashboardOverview() {
  const prefersReducedMotion = useReducedMotion();
  const { objectives, hydrated: objectivesHydrated } = useObjectives();
  const { sessions, todaySessions, todayFocusMinutes, hydrated: sessionsHydrated } =
    usePomodoroSessions();
  const { stats, progression, rank, todayXp, hydrated: statsHydrated } = useUserStats();
  const { displayName } = useDisplayName();

  const hydrated = objectivesHydrated && sessionsHydrated && statsHydrated;

  const streak = React.useMemo(() => computeCurrentStreak(sessions), [sessions]);
  const yesterdayFocusMinutes = React.useMemo(
    () => focusMinutesInRange(sessions, 1, 1),
    [sessions]
  );
  const focusTrend = React.useMemo(
    () => percentTrend(todayFocusMinutes, yesterdayFocusMinutes),
    [todayFocusMinutes, yesterdayFocusMinutes]
  );

  const greetingBase =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";
  const greeting = displayName ? `${greetingBase}, ${displayName}` : greetingBase;

  if (!hydrated) return <LoadingState />;

  return (
    <>
      <FeatureIntro feature="dashboard" />
      <motion.div
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        variants={pageEnter}
        className="space-y-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {greeting}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/kanban"
              className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-foreground transition-colors hover:text-muted"
            >
              <Plus className="h-3.5 w-3.5" /> New objective
            </Link>
            <Button asChild size="sm" className="cursor-pointer shadow-none">
              <Link href="/pomodoro" className="inline-flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" /> Start focus
              </Link>
            </Button>
          </div>
        </div>

        <TodayAgendaPanel objectives={objectives} />

        <div className="grid grid-cols-2 border-y border-border/50 md:grid-cols-4 light:border-border">
          {[
            {
              label: "Streak",
              value: streak,
              suffix: streak === 1 ? " day" : " days",
              hint: streak > 0 ? "Keep it going" : "Finish a session to start one",
              iconNode: <StreakFlame days={streak} size="sm" />,
            },
            {
              icon: Timer,
              label: "Focus today",
              value: todayFocusMinutes,
              suffix: " min",
              hint: `${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} today · vs yesterday`,
              iconClassName: "text-muted",
              trend: focusTrend,
            },
            {
              icon: Repeat,
              label: "Intervals",
              value: stats.intervalsCompleted,
              hint: "All-time completed",
              iconClassName: "text-muted",
            },
            {
              icon: Gauge,
              label: "Productivity",
              value: stats.productivityIndex,
              suffix: "%",
              hint: "Last 7 days",
              iconClassName: "text-muted",
            },
          ].map((cell, index) => (
            <StatCell key={cell.label} {...cell} className={statCellBorderClass(index)} />
          ))}
        </div>

        <FeatureIntro feature="gamification" />
        <RankStrip
          rankLabel={rank.label}
          level={progression.level}
          xpIntoLevel={progression.xpIntoLevel}
          xpForNextLevel={progression.xpForNextLevel}
          progressPercent={progression.progressPercent}
          isMaxLevel={progression.isMaxLevel}
          todayXp={todayXp}
        />
      </motion.div>
    </>
  );
}
