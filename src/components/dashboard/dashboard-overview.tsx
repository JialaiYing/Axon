"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ListTodo,
  Plus,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakFlame } from "@/components/ui/streak-flame";
import { TrendBadge } from "@/components/ui/trend-badge";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import { TodayAgendaPanel } from "@/components/dashboard/today-agenda-panel";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useUserStats } from "@/hooks/use-user-stats";
import { useDisplayName } from "@/hooks/use-display-name";
import { useFlashcards } from "@/hooks/use-flashcards";
import { useGoals, DAILY_OBJECTIVES_TARGET } from "@/hooks/use-goals";
import {
  remainingSecondsOf,
  usePomodoroTimers,
} from "@/hooks/use-pomodoro-timers";
import { DURATION, EASE } from "@/lib/motion";
import { percentTrend, type Trend } from "@/lib/percent-trend";
import { computeCurrentStreak } from "@/lib/progress/streak";
import { rankTrophyClass } from "@/lib/progress/ranks";
import { buildTodayAgenda } from "@/lib/dashboard-agenda";
import { formatClock } from "@/lib/pomodoro-utils";
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

/** Border classes for one cell in the 3-up stats strip — single divided row. */
function statCellBorderClass(index: number) {
  return cn(
    index > 0 && "border-l border-border/60 light:border-border"
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
    <div className={cn("flex flex-col justify-between p-3.5 sm:p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-muted">
          {label}
        </p>
        {iconNode ?? (Icon ? <Icon className={cn("h-3.5 w-3.5", iconClassName ?? "text-muted")} /> : null)}
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-3xl font-medium tabular-nums tracking-tight text-foreground sm:text-4xl">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          {trend ? <TrendBadge {...trend} /> : null}
        </div>
        <p className="mt-1 text-[14px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
});

/** Rank band + daily goal glance. Separate links — Rank → /rank, Daily → /goals. */
function RankStrip({
  rankLabel,
  rankIndex,
  level,
  xpIntoLevel,
  xpForNextLevel,
  progressPercent,
  isMaxLevel,
  todayXp,
  dailyProgress,
  dailyTarget,
}: {
  rankLabel: string;
  rankIndex: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
  isMaxLevel: boolean;
  todayXp: number;
  dailyProgress: number;
  dailyTarget: number;
}) {
  const metal = rankTrophyClass(rankIndex);
  const dailyDone = dailyProgress >= dailyTarget;
  return (
    <div className="flex overflow-hidden rounded-md border border-border/50 light:border-border light:bg-card">
      <Link
        href="/rank"
        className="min-w-0 flex-1 p-5 transition-colors hover:bg-wash/40 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-wash",
                metal
              )}
            >
              <Trophy className="h-4 w-4 fill-current" aria-hidden />
            </span>
            <div>
              <p className="text-[14px] font-medium text-muted">Rank</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
                  {rankLabel}
                </p>
                <span className="font-mono text-[14px] tabular-nums text-muted-foreground">
                  Level {level}
                </span>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[14px] text-muted-foreground">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>{isMaxLevel ? "Max level" : "XP to next level"}</span>
                {todayXp > 0 && (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    +{todayXp} today
                  </span>
                )}
              </span>
              {!isMaxLevel && (
                <span className="shrink-0 font-mono tabular-nums text-foreground/70">
                  {xpIntoLevel.toLocaleString()} / {xpForNextLevel?.toLocaleString()}
                </span>
              )}
            </div>
            <ProgressBar value={progressPercent} size="sm" />
          </div>
        </div>
      </Link>
      <Link
        href="/goals"
        className="flex w-[5.5rem] shrink-0 flex-col justify-center border-l border-border/50 px-3 py-4 text-center transition-colors hover:bg-wash/40 light:border-border sm:w-28 sm:px-4"
        aria-label={`Daily goal ${dailyProgress} of ${dailyTarget} objectives`}
      >
        <p className="text-[12px] font-medium text-muted sm:text-[14px]">Daily</p>
        <p
          className={cn(
            "mt-1 font-mono text-xl font-medium tabular-nums tracking-tight sm:text-2xl",
            dailyDone ? "text-success" : "text-foreground"
          )}
        >
          {dailyProgress}
          <span className="text-muted-foreground">/{dailyTarget}</span>
        </p>
      </Link>
    </div>
  );
}

/** Skeleton mirrors live hierarchy: hero agenda → one stats strip → rank band. */
function LoadingState() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      <Skeleton className="min-h-[16rem] flex-1 rounded-md" />
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
  const { progression, rank, todayXp, hydrated: statsHydrated } = useUserStats();
  const { displayName } = useDisplayName();
  const { dueCount, hydrated: flashcardsHydrated } = useFlashcards();
  const { dailyGoal } = useGoals();
  const { timers } = usePomodoroTimers();

  const hydrated = objectivesHydrated && sessionsHydrated && statsHydrated;

  const activeTimer = React.useMemo(
    () => timers.find((t) => t.status === "running" || t.status === "paused") ?? null,
    [timers]
  );

  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!activeTimer || activeTimer.status !== "running") return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [activeTimer]);

  const [dayKey, setDayKey] = React.useState(() => new Date().toDateString());
  React.useEffect(() => {
    const refreshDay = () => setDayKey(new Date().toDateString());
    const id = window.setInterval(refreshDay, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refreshDay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const streak = React.useMemo(() => computeCurrentStreak(sessions), [sessions]);
  const yesterdayFocusMinutes = React.useMemo(
    () => focusMinutesInRange(sessions, 1, 1),
    [sessions]
  );
  const focusTrend = React.useMemo(
    () => percentTrend(todayFocusMinutes, yesterdayFocusMinutes),
    [todayFocusMinutes, yesterdayFocusMinutes]
  );

  const openTodayCount = React.useMemo(() => {
    void dayKey; // refresh buckets after midnight while the tab stays open
    return buildTodayAgenda(objectives, new Date()).openTodayCount;
  }, [objectives, dayKey]);

  const greetingBase =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";
  const greeting = displayName ? `${greetingBase}, ${displayName}` : greetingBase;

  const timerRemaining = activeTimer ? remainingSecondsOf(activeTimer) : 0;
  const timerLabel = activeTimer?.label?.trim() || "Focus";

  if (!hydrated) return <LoadingState />;

  return (
    <>
      <FeatureIntro feature="dashboard" />
      <motion.div
        initial={prefersReducedMotion ? false : "hidden"}
        animate="visible"
        variants={pageEnter}
        className="flex min-h-[calc(100dvh-8rem)] flex-col gap-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[14px] font-medium text-muted">
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
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/kanban?new=1"
              className="inline-flex cursor-pointer items-center gap-1 text-[14px] font-medium text-foreground transition-colors hover:text-muted"
            >
              <Plus className="h-3.5 w-3.5" /> New objective
            </Link>
            <Button asChild size="sm" className="cursor-pointer shadow-none">
              <Link href="/pomodoro" className="inline-flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" />
                {activeTimer ? "Open timer" : "Start focus"}
              </Link>
            </Button>
          </div>
        </div>

        {activeTimer && (
          <Link
            href="/pomodoro"
            aria-label={`${activeTimer.status === "paused" ? "Paused" : "Running"} timer: ${timerLabel}, ${formatClock(timerRemaining)} remaining`}
            className="inline-flex max-w-full items-center gap-2.5 self-start rounded-md border border-border/50 bg-wash/40 px-3 py-2 text-[14px] transition-colors hover:border-border hover:bg-wash light:border-border light:bg-card"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                activeTimer.status === "running" ? "bg-success" : "bg-warning"
              )}
              aria-hidden
            />
            <span className="min-w-0 truncate font-medium text-foreground">{timerLabel}</span>
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              {formatClock(timerRemaining)}
            </span>
            {activeTimer.status === "paused" && (
              <span className="shrink-0 text-muted-foreground">Paused</span>
            )}
          </Link>
        )}

        <TodayAgendaPanel
          objectives={objectives}
          dueCount={flashcardsHydrated ? dueCount : 0}
          timerActive={Boolean(activeTimer)}
          className="min-h-0 flex-1"
        />

        <div className="grid grid-cols-3 border-y border-border/50 light:border-border">
          {[
            {
              label: "Streak",
              value: streak,
              suffix: streak === 1 ? " day" : " days",
              hint: streak > 0 ? "Keep it going" : "Finish a session to start one",
              iconNode: <StreakFlame days={streak} size="lg" />,
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
              icon: ListTodo,
              label: "Open today",
              value: openTodayCount,
              hint:
                openTodayCount === 0
                  ? "Nothing overdue or due"
                  : "Overdue + due today",
              iconClassName: "text-muted",
            },
          ].map((cell, index) => (
            <StatCell key={cell.label} {...cell} className={statCellBorderClass(index)} />
          ))}
        </div>

        <FeatureIntro feature="gamification" />
        <RankStrip
          rankLabel={rank.label}
          rankIndex={rank.rankIndex}
          level={progression.level}
          xpIntoLevel={progression.xpIntoLevel}
          xpForNextLevel={progression.xpForNextLevel}
          progressPercent={progression.progressPercent}
          isMaxLevel={progression.isMaxLevel}
          todayXp={todayXp}
          dailyProgress={dailyGoal?.progress ?? 0}
          dailyTarget={dailyGoal?.target ?? DAILY_OBJECTIVES_TARGET}
        />
      </motion.div>
    </>
  );
}
