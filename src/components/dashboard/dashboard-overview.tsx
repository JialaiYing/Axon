"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Circle,
  Flame,
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
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { TiltCard } from "@/components/ui/tilt-card";
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
  isToday,
  weekElapsedFraction,
} from "@/lib/goals-utils";
import { isOverdue, isScheduleOverdue, priorityDotClass, priorityTextClass } from "@/lib/kanban-utils";
import { getScheduledEvent, isSameDay } from "@/lib/calendar-utils";
import { DURATION, EASE, enterVariants, staggerContainer } from "@/lib/motion";
import { computeCurrentStreak } from "@/lib/progress/streak";
import { formatRelativeTime } from "@/lib/time";
import type { Goal, Objective, PomodoroSession } from "@/types";
import { cn } from "@/lib/utils";

// House motion language — see src/lib/motion.ts. Every entrance on this page
// pulls from there so it stays in lockstep with the rest of the app.
const container = {
  hidden: {},
  visible: { transition: staggerContainer() },
};

const enter = enterVariants(8);
const item = {
  hidden: enter.hidden,
  visible: { ...enter.visible, transition: { duration: DURATION.section, ease: EASE } },
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

const PRIORITY_ORDER: Record<Objective["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** True when an objective is already surfaced by the Agenda panel above
 *  (overdue, due today, or scheduled today) — kept in sync with the same
 *  predicates `today-agenda-panel.tsx` uses, so nothing shows up twice. */
function isShownInAgendaToday(o: Objective, now: Date) {
  if (isOverdue(o.dueDate, o.status) || isScheduleOverdue(o)) return true;
  if (o.dueDate && isToday(o.dueDate)) return true;
  const event = getScheduledEvent(o);
  if (event && isSameDay(event.start, now)) return true;
  return false;
}

function upNext(objectives: Objective[]) {
  const now = new Date();
  return objectives
    .filter(
      (o) =>
        (o.status === "todo" || o.status === "in-progress") &&
        o.showOnKanban !== false &&
        !isShownInAgendaToday(o, now)
    )
    .sort((a, b) => {
      const aTime = a.scheduledStart ?? a.dueDate;
      const bTime = b.scheduledStart ?? b.dueDate;
      if (aTime && bTime) return new Date(aTime).getTime() - new Date(bTime).getTime();
      if (aTime) return -1;
      if (bTime) return 1;
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    })
    .slice(0, 5);
}

interface RecentEntry {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  timestamp: string;
  href: string;
}

/** Most recently touched flashcard set, focus session, and objective — one "resume" list across features. */
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
      subtitle: `${lastStudiedSet.cards.length} card${lastStudiedSet.cards.length === 1 ? "" : "s"}`,
      timestamp: lastStudiedSet.lastOpenedAt,
      href: "/flashcards",
    });
  }

  const lastSession = sessions
    .filter((s) => s.type === "work" && s.durationMinutes > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  if (lastSession) {
    entries.push({
      key: `session-${lastSession.id}`,
      icon: Timer,
      title: lastSession.label || "Focus session",
      subtitle: `${lastSession.durationMinutes} min focused`,
      timestamp: lastSession.date,
      href: "/pomodoro",
    });
  }

  const lastObjective = objectives
    .filter((o) => o.status !== "recycled")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  if (lastObjective) {
    entries.push({
      key: `objective-${lastObjective.id}`,
      icon: ListTodo,
      title: lastObjective.title,
      subtitle: lastObjective.status === "done" ? "Completed" : lastObjective.subject,
      timestamp: lastObjective.updatedAt,
      href: "/kanban",
    });
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

interface Trend {
  direction: "up" | "down" | "flat";
  label: string;
}

/** Small trend chip for stat cards — a bare number is the weakest way to show
 *  a metric, so every card that can be compared against a prior period gets
 *  one of these next to the value (Vercel/Stripe analytics convention). */
const TrendBadge = React.memo(function TrendBadge({ direction, label }: Trend) {
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
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
 *  mobile (col divider on odd cells, row divider on the bottom row) that
 *  collapses to a single divided row of 4 at `md`. One shared `Panel`
 *  border frames the whole strip; this is only the internal dividers, so
 *  it reads as one stats bar (Vercel's analytics-row pattern), not four
 *  separate boxed cards. */
function statCellBorderClass(index: number) {
  return cn(
    index % 2 === 1 && "border-l border-border",
    index >= 2 && "border-t border-border",
    "md:border-t-0",
    index > 0 && "md:border-l md:border-border"
  );
}

const StatCell = React.memo(function StatCell({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
  iconClassName,
  trend,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  iconClassName: string;
  trend?: Trend;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/60">
          {label}
        </p>
        {/* Icon sits directly in its semantic color — no bordered chip
            behind it. A box around every single icon on the page is what
            reads as "bubbles"; the color alone is enough to distinguish it. */}
        <Icon className={cn("h-4 w-4", iconClassName)} />
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          {trend && <TrendBadge {...trend} />}
        </div>
        <p className="mt-1 text-xs text-foreground/60">{hint}</p>
      </div>
    </div>
  );
});

const PersonalGoalRow = React.memo(function PersonalGoalRow({ goal }: { goal: Goal }) {
  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-foreground/55">
        <span className="truncate">{goal.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.08em]",
              goal.completed ? "text-success" : "text-foreground/50"
            )}
          >
            {goal.completed ? "Done" : "Personal"}
          </span>
          <span className="tabular-nums text-foreground/70">
            {goal.progress}/{goal.target}
            {goal.unit ? ` ${goal.unit}` : ""}
          </span>
        </span>
      </div>
      <ProgressBar value={percent} size="sm" className="mt-1.5" />
    </div>
  );
});

/**
 * Personal-goals surface for the dashboard. Daily/weekly focus-time and
 * objective-count progress already live in the Agenda panel above — this
 * card intentionally does NOT repeat those bars, it only shows the goals
 * that have nowhere else to live, plus a contextual nudge when the
 * daily/weekly pace (computed, not re-rendered) is slipping.
 */
function PersonalGoalsCard({
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
    <TiltCard maxTilt={5} className="h-full">
      <Panel variant="glass" className="flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/55">
            Personal goals
          </p>
          <Target className="h-4 w-4 text-success" />
        </div>
        <div className="mt-4 flex-1 space-y-3">
          {visiblePersonalGoals.length > 0 ? (
            <>
              {visiblePersonalGoals.map((goal) => (
                <PersonalGoalRow key={goal.id} goal={goal} />
              ))}
              {remainingPersonalGoals > 0 && (
                <Link
                  href="/goals"
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-foreground/60 transition-colors duration-200 hover:text-foreground"
                >
                  +{remainingPersonalGoals} more personal goal{remainingPersonalGoals === 1 ? "" : "s"}
                </Link>
              )}
            </>
          ) : (
            <p className="text-xs text-foreground/60">
              No personal goals yet — add one to track something outside daily/weekly focus time.
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
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
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-foreground/60 transition-colors duration-200 hover:text-foreground"
          >
            {personalGoals.length === 0 ? "Add a personal goal" : "Manage goals"} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Panel>
    </TiltCard>
  );
}

function RankHero({
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
    <Panel variant="glass" className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <Trophy className="h-8 w-8 shrink-0 text-foreground/70" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/60">
              Current rank
            </p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{rankLabel}</p>
          </div>
        </div>
        {/* One neutral chip instead of two competing colored pills — same
            pattern as the Agenda header's streak/rank chip. */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1">
          {todayXp > 0 && (
            <>
              <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                +{todayXp} XP today
              </span>
              <span className="h-3 w-px bg-border" aria-hidden />
            </>
          )}
          <span className="text-xs font-medium text-muted-foreground">Level {level} / 30</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-foreground/55">
          <span>{isMaxLevel ? "Max level reached" : "XP to next level"}</span>
          {!isMaxLevel && (
            <span className="tabular-nums text-foreground/70">
              {xpIntoLevel.toLocaleString()} / {xpForNextLevel?.toLocaleString()}
            </span>
          )}
        </div>
        <ProgressBar value={progressPercent} />
      </div>
    </Panel>
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
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-[var(--shadow-elevation-2)]">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground">{payload[0]?.value ?? 0} min focused</p>
    </div>
  );
});

function LoadingState() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
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
  const queue = React.useMemo(() => upNext(objectives), [objectives]);
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
      variants={container}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      className="space-y-5"
    >
      {/* Greeting + quick actions */}
      <motion.div
        variants={item}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/60">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild size="sm" variant="outline" className="cursor-pointer">
            <Link href="/kanban" className="inline-flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New objective
            </Link>
          </Button>
          <Button asChild size="sm" className="cursor-pointer">
            <Link href="/pomodoro" className="inline-flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" /> Start focus
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Glance-and-go agenda — primary dashboard surface */}
      <motion.div variants={item}>
        <TodayAgendaPanel
          objectives={objectives}
          dailyGoal={dailyGoal}
          weeklyGoal={weeklyGoal}
          streak={streak}
          rankLabel={rank.label}
        />
      </motion.div>

      {/* Compact up-next queue — a flat divided list, not another grid of
          boxed mini-cards competing with the agenda panel above it. */}
      <motion.div variants={item}>
        <div className="flex flex-col gap-2">
          <p className="mb-0.5 text-[10px] uppercase tracking-wide text-foreground/60">Up next</p>
          {queue.length === 0 ? (
            <Link
              href="/kanban"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/60 p-6 text-center transition-colors duration-200 hover:border-border-strong hover:bg-card-hover"
            >
              <Circle className="h-4 w-4 text-foreground/40" />
              <p className="text-xs text-foreground/55">No objectives yet</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-foreground/60">
                Create one on the board <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ) : (
            <ul className="overflow-hidden rounded-xl border border-border bg-card">
              {queue.map((objective, index) => (
                <li
                  key={objective.id}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 transition-colors duration-150 hover:bg-card-hover",
                    index > 0 && "border-t border-border"
                  )}
                >
                  <Link
                    href="/kanban"
                    className="min-w-0 flex-1 cursor-pointer truncate text-sm font-medium text-foreground"
                  >
                    {objective.title}
                  </Link>
                  {/* A colored dot + plain text label carries the same
                      priority signal as a bordered pill, without adding
                      another bubble to a five-row list. */}
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium capitalize">
                    <span className={cn("h-1.5 w-1.5 rounded-full", priorityDotClass(objective.priority))} />
                    <span className={priorityTextClass(objective.priority)}>{objective.priority}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Mark "${objective.title}" done`}
                    onClick={() => completeObjective(objective.id)}
                    className="shrink-0 cursor-pointer rounded-md p-0.5 text-foreground/40 transition-colors duration-150 hover:text-success"
                  >
                    <Circle className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>

      {/* Stats strip — one bordered bar with internal dividers (Vercel's
          analytics-row pattern), not four separate boxed cards. */}
      <motion.div variants={item}>
        <Panel variant="standard" className="grid grid-cols-2 md:grid-cols-4">
          {[
            {
              icon: Flame,
              label: "Streak",
              value: streak,
              suffix: streak === 1 ? " day" : " days",
              hint: streak > 0 ? "Keep it going" : "Finish a session to start one",
              iconClassName: "text-warning",
            },
            {
              icon: Timer,
              label: "Focus today",
              value: todayFocusMinutes,
              suffix: " min",
              hint: `${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} today · vs yesterday`,
              iconClassName: "text-accent",
              trend: focusTrend,
            },
            {
              icon: Repeat,
              label: "Intervals",
              value: stats.intervalsCompleted,
              hint: "All-time completed",
              iconClassName: "text-foreground/60",
            },
            {
              icon: Gauge,
              label: "Productivity",
              value: stats.productivityIndex,
              suffix: "%",
              hint: "Last 7 days",
              iconClassName: "text-foreground/60",
            },
          ].map((cell, index) => (
            <StatCell key={cell.label} {...cell} className={statCellBorderClass(index)} />
          ))}
        </Panel>
      </motion.div>

      {/* Daily goal + Current rank / XP — mirrors the homepage pair */}
      <motion.div variants={item}>
        <FeatureIntro feature="gamification" />
      </motion.div>
      <motion.div variants={item} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PersonalGoalsCard dailyGoal={dailyGoal} weeklyGoal={weeklyGoal} personalGoals={personalGoals} />
        <RankHero
          rankLabel={rank.label}
          level={progression.level}
          xpIntoLevel={progression.xpIntoLevel}
          xpForNextLevel={progression.xpForNextLevel}
          progressPercent={progression.progressPercent}
          isMaxLevel={progression.isMaxLevel}
          todayXp={todayXp}
        />
      </motion.div>

      <motion.div variants={item}>
        <Panel variant="glass" className="flex h-full flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent</h2>
            <History className="h-3.5 w-3.5 text-foreground/40" />
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <History className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nothing to resume yet</p>
            </div>
          ) : (
            <ul className="-mx-1 divide-y divide-border">
              {recent.map((entry) => {
                const Icon = entry.icon;
                return (
                  <li key={entry.key}>
                    <Link
                      href={entry.href}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2.5 transition-colors duration-200 hover:bg-card-hover"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-foreground/70" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
                        <p className="mt-0.5 text-[11px] text-foreground/60">{entry.subtitle}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-foreground/60">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </motion.div>

      {/* Focus this week */}
      <motion.div variants={item}>
        <Panel variant="glass" className="flex flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Focus this week</h2>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-xs text-foreground/60">
                  {weekTotal} minutes across the last 7 days
                </p>
                {weekTrend && <TrendBadge {...weekTrend} />}
              </div>
            </div>
            <p className="text-xl font-semibold tabular-nums text-accent">
              <AnimatedCounter value={weekTotal} suffix=" min" />
            </p>
          </div>
          {weekTotal === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <Timer className="h-8 w-8 text-foreground/70" />
              <p className="text-sm text-foreground/60">No focus sessions yet this week</p>
              <Button asChild size="sm" variant="outline" className="cursor-pointer">
                <Link href="/pomodoro" className="inline-flex items-center gap-1.5">
                  Start your first session <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={46}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "var(--color-border-strong)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      fill="url(#focusFill)"
                      isAnimationActive={!prefersReducedMotion}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <Link
                href="/analytics"
                className="inline-flex cursor-pointer items-center gap-1 self-end text-[11px] text-foreground/60 transition-colors duration-200 hover:text-foreground"
              >
                View analytics <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </Panel>
      </motion.div>
    </motion.div>
    </>
  );
}
