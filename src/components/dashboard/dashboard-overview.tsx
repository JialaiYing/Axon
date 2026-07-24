"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Circle,
  Gauge,
  History,
  ListTodo,
  Minus,
  Plus,
  Repeat,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakFlame } from "@/components/ui/streak-flame";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import { TodayAgendaPanel } from "@/components/dashboard/today-agenda-panel";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useFlashcards } from "@/hooks/use-flashcards";
import { useUserStats } from "@/hooks/use-user-stats";
import { useGoals } from "@/hooks/use-goals";
import { useDisplayName } from "@/hooks/use-display-name";
import {
  dayElapsedFraction,
  goalPaceStatus,
  weekElapsedFraction,
} from "@/lib/goals-utils";
import { canMarkObjectiveDone } from "@/lib/kanban-utils";
import { buildUpNextQueue } from "@/lib/dashboard-agenda";
import { DURATION, EASE } from "@/lib/motion";
import { computeCurrentStreak } from "@/lib/progress/streak";
import { formatRelativeTime } from "@/lib/time";
import type { Goal, Objective, PomodoroSession } from "@/types";
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

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildWeekData(sessions: PomodoroSession[]) {
  const days: { label: string; minutes: number }[] = [];
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    if (s.type !== "work" || s.durationMinutes <= 0) continue;
    const key = dayKey(new Date(s.date));
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationMinutes);
  }
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      minutes: byDay.get(dayKey(d)) ?? 0,
    });
  }
  return days;
}

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


interface RecentEntry {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  timestamp: string;
  href: string;
}

/** Top three most recently touched items across flashcards, focus, and objectives. */
function buildRecentEntries(
  objectives: Objective[],
  sessions: PomodoroSession[],
  lastStudiedSet: ReturnType<typeof useFlashcards>["lastStudiedSet"]
): RecentEntry[] {
  const entries: RecentEntry[] = [];

  if (lastStudiedSet?.lastOpenedAt) {
    entries.push({
      key: `set-${lastStudiedSet.id}`,
      icon: BookOpen,
      title: lastStudiedSet.title,
      timestamp: lastStudiedSet.lastOpenedAt,
      href: "/flashcards",
    });
  }

  sessions
    .filter((s) => s.type === "work" && s.durationMinutes > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .forEach((lastSession) => {
      entries.push({
        key: `session-${lastSession.id}`,
        icon: Timer,
        title: lastSession.label || "Focus session",
        timestamp: lastSession.date,
        href: "/pomodoro",
      });
    });

  objectives
    .filter((o) => o.status !== "recycled")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)
    .forEach((lastObjective) => {
      entries.push({
        key: `objective-${lastObjective.id}`,
        icon: ListTodo,
        title: lastObjective.title,
        timestamp: lastObjective.updatedAt,
        href: "/kanban",
      });
    });

  return entries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);
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
        "inline-flex items-center gap-0.5 font-mono text-[11px] font-medium tabular-nums",
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
        <p className="text-[11px] font-medium text-muted">
          {label}
        </p>
        {iconNode ?? (Icon ? <Icon className={cn("h-3.5 w-3.5", iconClassName ?? "text-muted")} /> : null)}
      </div>
      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-xl font-semibold tabular-nums text-foreground">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          {trend && <TrendBadge {...trend} />}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
});

const PersonalGoalRow = React.memo(function PersonalGoalRow({ goal }: { goal: Goal }) {
  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate">{goal.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-medium",
              goal.completed ? "text-success" : "text-muted-foreground"
            )}
          >
            {goal.completed ? "Done" : "Personal"}
          </span>
          <span className="font-mono tabular-nums text-foreground/70">
            {goal.progress}/{goal.target}
            {goal.unit ? ` ${goal.unit}` : ""}
          </span>
        </span>
      </div>
      <ProgressBar
        value={percent}
        size="sm"
        className="mt-1.5"
        barClassName={goal.completed ? "bg-success" : undefined}
      />
    </div>
  );
});

/**
 * Supporting personal-goals block — flat rows under a label, not a peer
 * glass card. Daily/weekly bars live in Agenda; this only shows personal goals.
 * Structure: header → body (flex-1) → footer — matches Rank / Recent in the trio band.
 */
function PersonalGoalsSection({
  dailyGoal,
  weeklyGoal,
  personalGoals,
}: {
  dailyGoal: Goal | null;
  weeklyGoal: Goal | null;
  personalGoals: Goal[];
}) {
  const now = new Date();
  const dailyStatus = dailyGoal ? goalPaceStatus(dailyGoal, dayElapsedFraction(now)) : null;
  const weeklyStatus = weeklyGoal ? goalPaceStatus(weeklyGoal, weekElapsedFraction(now)) : null;
  const visiblePersonalGoals = personalGoals.slice(0, 3);
  const remainingPersonalGoals = personalGoals.length - visiblePersonalGoals.length;

  const contextualCta =
    dailyStatus === "behind"
      ? { href: "/pomodoro" as const, label: "Start focus" }
      : weeklyStatus === "behind"
        ? { href: "/kanban" as const, label: "Open board" }
        : null;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted">
          Personal goals
        </p>
        <Target className="h-3.5 w-3.5 text-muted" />
      </div>
      <div className="min-h-0 flex-1 space-y-3">
        {visiblePersonalGoals.length > 0 ? (
          <>
            {visiblePersonalGoals.map((goal) => (
              <PersonalGoalRow key={goal.id} goal={goal} />
            ))}
            {remainingPersonalGoals > 0 && (
              <Link
                href="/goals"
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                +{remainingPersonalGoals} more personal goal{remainingPersonalGoals === 1 ? "" : "s"}
              </Link>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            No personal goals yet — add one to track something outside daily/weekly focus time.
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/50 pt-3 light:border-border">
        {contextualCta && (
          <Link
            href={contextualCta.href}
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-foreground/70 transition-colors duration-200 hover:text-foreground"
          >
            {contextualCta.label} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
        <Link
          href="/goals"
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          {personalGoals.length === 0 ? "Add a personal goal" : "Manage goals"}{" "}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

/** Rank column — same header / body / footer rhythm as siblings so the trio band aligns. */
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
    <section className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted">
          Rank
        </p>
        <Trophy className="h-3.5 w-3.5 text-warning" />
      </div>
      <div className="min-h-0 flex-1">
        <p className="text-sm font-semibold tracking-tight text-foreground">{rankLabel}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">Level {level}</span>
          {todayXp > 0 && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Sparkles className="h-3 w-3" />
              +{todayXp} today
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 border-t border-border/50 pt-3 light:border-border">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{isMaxLevel ? "Max level" : "XP to next level"}</span>
          {!isMaxLevel && (
            <span className="font-mono tabular-nums text-foreground/70">
              {xpIntoLevel.toLocaleString()} / {xpForNextLevel?.toLocaleString()}
            </span>
          )}
        </div>
        <ProgressBar value={progressPercent} size="sm" />
      </div>
    </section>
  );
}

function RecentSection({ recent }: { recent: RecentEntry[] }) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted">
          Recent
        </p>
        <History className="h-3.5 w-3.5 text-muted" />
      </div>
      <div className="min-h-0 flex-1">
        {recent.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-2 text-center">
            <History className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Nothing to resume yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50 border-y border-border/50 light:divide-border light:border-border">
            {recent.map((entry) => {
              const Icon = entry.icon;
              return (
                <li key={entry.key}>
                  <Link
                    href={entry.href}
                    className="flex cursor-pointer items-center gap-2.5 py-2 transition-colors duration-150 hover:bg-wash"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {entry.title}
                    </p>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="mt-3 border-t border-border/50 pt-3 light:border-border">
        <Link
          href="/analytics"
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          View activity <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

const ChartTooltip = React.memo(function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border/50 bg-card px-3 py-2 text-[12px] shadow-none light:border-border">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground">{payload[0]?.value ?? 0} min focused</p>
    </div>
  );
});

/** Skeleton mirrors live hierarchy: hero agenda → flat up-next → one stats
 *  strip → week chart → three light supporting columns. */
function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      <Skeleton className="h-56 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <div className="space-y-0 divide-y divide-border/50 border-y border-border/50 light:divide-border light:border-border">
          <Skeleton className="h-10 rounded-none" />
          <Skeleton className="h-10 rounded-none" />
          <Skeleton className="h-10 rounded-none" />
        </div>
      </div>
      <Skeleton className="h-28 rounded-md" />
      <Skeleton className="h-72 rounded-md" />
      <Skeleton className="h-40 rounded-md" />
    </div>
  );
}

export function DashboardOverview() {
  const prefersReducedMotion = useReducedMotion();
  const { objectives, hydrated: objectivesHydrated, completeObjective } = useObjectives();
  const { sessions, todaySessions, todayFocusMinutes, hydrated: sessionsHydrated } =
    usePomodoroSessions();
  const { lastStudiedSet, hydrated: flashcardsHydrated } = useFlashcards();
  const { stats, progression, rank, todayXp, hydrated: statsHydrated } = useUserStats();
  const { dailyGoal, weeklyGoal, personalGoals, hydrated: goalsHydrated } = useGoals();
  const { displayName } = useDisplayName();

  const hydrated =
    objectivesHydrated && sessionsHydrated && flashcardsHydrated && statsHydrated && goalsHydrated;

  const streak = React.useMemo(() => computeCurrentStreak(sessions), [sessions]);
  const weekData = React.useMemo(() => buildWeekData(sessions), [sessions]);
  const weekTotal = weekData.reduce((sum, d) => sum + d.minutes, 0);
  const previousWeekTotal = React.useMemo(
    () => focusMinutesInRange(sessions, 13, 7),
    [sessions]
  );
  const weekTrend = React.useMemo(
    () => percentTrend(weekTotal, previousWeekTotal),
    [weekTotal, previousWeekTotal]
  );
  const yesterdayFocusMinutes = React.useMemo(
    () => focusMinutesInRange(sessions, 1, 1),
    [sessions]
  );
  const focusTrend = React.useMemo(
    () => percentTrend(todayFocusMinutes, yesterdayFocusMinutes),
    [todayFocusMinutes, yesterdayFocusMinutes]
  );
  const queue = React.useMemo(() => buildUpNextQueue(objectives), [objectives]);
  const hasOpenBoard = React.useMemo(
    () =>
      objectives.some(
        (o) =>
          (o.status === "todo" || o.status === "in-progress") && o.showOnKanban !== false
      ),
    [objectives]
  );
  const recent = React.useMemo(
    () => buildRecentEntries(objectives, sessions, lastStudiedSet),
    [objectives, sessions, lastStudiedSet]
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
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
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

        <TodayAgendaPanel
          objectives={objectives}
          dailyGoal={dailyGoal}
          weeklyGoal={weeklyGoal}
        />

        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-medium text-muted">Up next</p>
          {queue.length === 0 ? (
            <Link
              href="/kanban"
              className="flex cursor-pointer items-center gap-2 border-y border-dashed border-border/50 py-3 text-[12px] text-muted-foreground transition-colors duration-150 hover:text-foreground light:border-border"
            >
              <Circle className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1">
                {hasOpenBoard
                  ? "Queue clear — everything open is in Today above"
                  : "No objectives yet"}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px]">
                {hasOpenBoard ? "Open board" : "Create one on the board"}{" "}
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ) : (
            <ul className="-mx-1 divide-y divide-border/50 light:divide-border">
              {queue.map((objective) => (
                <li
                  key={objective.id}
                  className="flex items-center gap-2.5 px-1 py-1.5 transition-colors duration-150 hover:bg-wash sm:px-1.5"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground"
                    style={
                      objective.color
                        ? { backgroundColor: objective.color }
                        : undefined
                    }
                  />
                  <Link
                    href="/kanban"
                    className="min-w-0 flex-1 cursor-pointer truncate text-[13px] font-medium text-foreground"
                  >
                    {objective.title}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Mark "${objective.title}" done`}
                    disabled={!canMarkObjectiveDone(objective)}
                    title={
                      canMarkObjectiveDone(objective)
                        ? "Mark done"
                        : "Complete estimated study time (and any subtasks) first"
                    }
                    onClick={() => {
                      if (!canMarkObjectiveDone(objective)) return;
                      completeObjective(objective.id);
                    }}
                    className="shrink-0 cursor-pointer rounded-md p-0.5 text-muted-foreground transition-colors duration-150 hover:text-success focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted-foreground"
                  >
                    <Circle className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

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

        <section className="flex flex-col">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold text-foreground">Focus this week</h2>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-[11px] text-muted">
                  {weekTotal} minutes across the last 7 days
                </p>
                {weekTrend && <TrendBadge {...weekTrend} />}
              </div>
            </div>
            <p className="font-mono text-base font-semibold tabular-nums text-foreground">
              <AnimatedCounter value={weekTotal} suffix=" min" />
            </p>
          </div>
          {weekTotal === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">No focus sessions yet this week</p>
              <Link
                href="/pomodoro"
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Start your first session <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--color-border)"
                      strokeOpacity={1}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "var(--color-border-strong)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="var(--color-foreground)"
                      strokeWidth={1.5}
                      fill="url(#focusFill)"
                      isAnimationActive={!prefersReducedMotion}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Link
                href="/analytics"
                className="inline-flex cursor-pointer items-center gap-1 self-end text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                View analytics <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </section>

        <FeatureIntro feature="gamification" />
        <div className="grid grid-cols-1 divide-y divide-border/60 border-y border-border/50 md:grid-cols-3 md:divide-x md:divide-y-0 light:divide-border light:border-border">
          <div className="py-4 md:pr-4">
            <PersonalGoalsSection
              dailyGoal={dailyGoal}
              weeklyGoal={weeklyGoal}
              personalGoals={personalGoals}
            />
          </div>
          <div className="py-4 md:px-4">
            <RankStrip
              rankLabel={rank.label}
              level={progression.level}
              xpIntoLevel={progression.xpIntoLevel}
              xpForNextLevel={progression.xpForNextLevel}
              progressPercent={progression.progressPercent}
              isMaxLevel={progression.isMaxLevel}
              todayXp={todayXp}
            />
          </div>
          <div className="py-4 md:pl-4">
            <RecentSection recent={recent} />
          </div>
        </div>
      </motion.div>
    </>
  );
}
