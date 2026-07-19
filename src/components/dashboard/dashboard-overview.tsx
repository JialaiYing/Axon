"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Circle,
  Flame,
  Gauge,
  History,
  ListTodo,
  Plus,
  Repeat,
  Sparkles,
  Target,
  Timer,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { TiltCard } from "@/components/ui/tilt-card";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useFlashcards } from "@/hooks/use-flashcards";
import { useUserStats } from "@/hooks/use-user-stats";
import { useGoals } from "@/hooks/use-goals";
import {
  dayElapsedFraction,
  goalPaceStatus,
  isToday as isTodayDate,
  PACE_LABEL,
  weekElapsedFraction,
  type GoalPaceStatus,
} from "@/lib/goals-utils";
import { computeCurrentStreak } from "@/lib/progress/streak";
import { formatRelativeTime } from "@/lib/time";
import type { Goal, Objective, PomodoroSession } from "@/types";
import { cn } from "@/lib/utils";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const item = {
  hidden: { opacity: 0, y: 26, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE } },
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

const PRIORITY_ORDER: Record<Objective["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function upNext(objectives: Objective[]) {
  return objectives
    .filter(
      (o) =>
        (o.status === "todo" || o.status === "in-progress") && o.showOnKanban !== false
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

interface TodayBarEntry {
  label: string;
  time: string;
  href: string;
  /** True when this scheduled item was already completed today. */
  done: boolean;
  /** Count of other items scheduled today in this same bucket, not shown. */
  extraCount: number;
}

interface TodayBars {
  focus: TodayBarEntry | null;
  calendarEvent: TodayBarEntry | null;
}

/**
 * Always three Today bars: focus session, calendar-only event, streak. A
 * completed item stays visible (marked done) rather than disappearing —
 * finishing today's only scheduled thing shouldn't make the dashboard look
 * like nothing was ever planned. If more than one thing is scheduled in a
 * bucket, the soonest surfaces and the rest count toward "+N more" so a
 * busy day doesn't look identical to a day with exactly one thing on it.
 */
function buildTodayBars(objectives: Objective[]): TodayBars {
  const todayScheduled = objectives
    .filter((o) => o.status !== "recycled" && o.scheduledStart && isTodayDate(o.scheduledStart))
    .sort(
      (a, b) =>
        new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime()
    );

  const focusItems = todayScheduled.filter((o) => o.showOnKanban !== false);
  const calendarItems = todayScheduled.filter((o) => o.showOnKanban === false);

  function pickPrimary(items: Objective[], labelFor: (o: Objective) => string, href: string): TodayBarEntry | null {
    if (items.length === 0) return null;
    const primary = items.find((o) => o.status !== "done") ?? items[0]!;
    const time = new Date(primary.scheduledStart!).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return {
      label: labelFor(primary),
      time,
      href,
      done: primary.status === "done",
      extraCount: items.length - 1,
    };
  }

  return {
    focus: pickPrimary(focusItems, (o) => `Focus session — ${o.title}`, "/pomodoro"),
    calendarEvent: pickPrimary(calendarItems, (o) => o.title, "/calendar"),
  };
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

function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass-panel glass-panel-hover rounded-2xl", className)}>{children}</div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  iconClassName: string;
}) {
  return (
    <TiltCard maxTilt={5} className="h-full">
      <GlassPanel className="flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
            {label}
          </p>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10",
              iconClassName
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-semibold tabular-nums text-white">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          <p className="mt-1 text-xs text-white/45">{hint}</p>
        </div>
      </GlassPanel>
    </TiltCard>
  );
}

function GoalRow({ goal, status }: { goal: Goal; status: GoalPaceStatus }) {
  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-white/55">
        <span className="truncate">{goal.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.08em]",
              status === "done" && "text-success",
              status === "on-track" && "text-white/50",
              status === "behind" && "text-warning"
            )}
          >
            {PACE_LABEL[status]}
          </span>
          <span className="tabular-nums text-white/70">
            {goal.progress}/{goal.target}
            {goal.unit ? ` ${goal.unit}` : ""}
          </span>
        </span>
      </div>
      <ProgressBar value={percent} size="sm" className="mt-1.5" />
    </div>
  );
}

function GoalsPulseCard({
  dailyGoal,
  weeklyGoal,
}: {
  dailyGoal: Goal | null;
  weeklyGoal: Goal | null;
}) {
  const now = new Date();
  const dailyStatus = dailyGoal ? goalPaceStatus(dailyGoal, dayElapsedFraction(now)) : null;
  const weeklyStatus = weeklyGoal ? goalPaceStatus(weeklyGoal, weekElapsedFraction(now)) : null;

  const contextualCta =
    dailyStatus === "behind"
      ? { href: "/pomodoro" as const, label: "Start focus" }
      : weeklyStatus === "behind"
        ? { href: "/kanban" as const, label: "Open board" }
        : null;

  return (
    <TiltCard maxTilt={5} className="h-full">
      <GlassPanel className="flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">Goals</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-success-muted text-success">
            <Target className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {dailyGoal && dailyStatus && <GoalRow goal={dailyGoal} status={dailyStatus} />}
          {weeklyGoal && weeklyStatus && <GoalRow goal={weeklyGoal} status={weeklyStatus} />}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {contextualCta && (
            <Link
              href={contextualCta.href}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-white/70 transition-colors duration-200 hover:text-white"
            >
              {contextualCta.label} <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          <Link
            href="/goals"
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-white/45 transition-colors duration-200 hover:text-white"
          >
            Manage goals <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </GlassPanel>
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
    <GlassPanel className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-accent-muted to-secondary-muted text-accent">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
              Current rank
            </p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight text-white">{rankLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {todayXp > 0 && (
            <Badge variant="accent" className="gap-1">
              <Sparkles className="h-3 w-3" /> +{todayXp} XP today
            </Badge>
          )}
          <Badge variant="secondary">Level {level} / 30</Badge>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-white/55">
          <span>{isMaxLevel ? "Max level reached" : "XP to next level"}</span>
          {!isMaxLevel && (
            <span className="tabular-nums text-white/70">
              {xpIntoLevel.toLocaleString()} / {xpForNextLevel?.toLocaleString()}
            </span>
          )}
        </div>
        <ProgressBar value={progressPercent} />
      </div>
    </GlassPanel>
  );
}

function ChartTooltip({
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
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-white">{label}</p>
      <p className="mt-0.5 text-white/60">{payload[0]?.value ?? 0} min focused</p>
    </div>
  );
}

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
  const { dailyGoal, weeklyGoal, hydrated: goalsHydrated } = useGoals();

  const hydrated =
    objectivesHydrated && sessionsHydrated && flashcardsHydrated && statsHydrated && goalsHydrated;

  const streak = React.useMemo(() => computeCurrentStreak(sessions), [sessions]);
  const weekData = React.useMemo(() => buildWeekData(sessions), [sessions]);
  const weekTotal = weekData.reduce((sum, d) => sum + d.minutes, 0);
  const queue = React.useMemo(() => upNext(objectives), [objectives]);
  const todayBars = React.useMemo(() => buildTodayBars(objectives), [objectives]);
  const recent = React.useMemo(
    () => buildRecentEntries(objectives, sessions, lastStudiedSet),
    [objectives, sessions, lastStudiedSet]
  );

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  if (!hydrated) return <LoadingState />;

  return (
    <motion.div
      variants={container}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      className="glass-panel overflow-hidden rounded-2xl p-2 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_20px_60px_-16px_rgba(59,130,246,0.25)]"
    >
      {/* Product-window framing mirrors the live preview on the homepage. */}
      <div className="rounded-xl bg-surface/60 p-4 sm:p-6 md:p-8">
      <div className="mb-5 flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
      </div>
      <div className="space-y-5">
      {/* Greeting + quick actions */}
      <motion.div
        variants={item}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white md:text-3xl">
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

      {/* Up next (top 5 open objectives by date/priority — not week-scoped) + Today — matches the homepage preview until Current rank. */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div variants={item}>
          <div className="flex h-full flex-col gap-2">
            <p className="mb-0.5 text-[10px] uppercase tracking-wide text-white/45">
              Up next
            </p>
            {queue.length === 0 ? (
              <Link
                href="/kanban"
                className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/12 bg-white/[0.03] p-6 text-center transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <Circle className="h-4 w-4 text-white/40" />
                <p className="text-xs text-white/55">No objectives yet</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                  Create one on the board <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ) : (
              queue.map((objective) => (
                <div
                  key={objective.id}
                  className="flex items-center gap-2.5 rounded-lg border border-white/8 bg-white/[0.04] p-3 transition-colors duration-200 hover:border-white/16 hover:bg-white/[0.07]"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      objective.priority === "urgent" || objective.priority === "high"
                        ? "bg-danger"
                        : objective.priority === "medium"
                          ? "bg-warning"
                          : "bg-success"
                    )}
                  />
                  <Link
                    href="/kanban"
                    className="min-w-0 flex-1 cursor-pointer truncate text-xs font-medium text-white"
                  >
                    {objective.title}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Mark "${objective.title}" done`}
                    onClick={() => completeObjective(objective.id)}
                    className="shrink-0 cursor-pointer rounded-md p-0.5 text-white/40 transition-colors duration-150 hover:text-success"
                  >
                    <Circle className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="flex h-full flex-col gap-2">
            <p className="mb-0.5 text-[10px] uppercase tracking-wide text-white/45">Today</p>

            {/* Focus session — always present */}
            <Link
              href={todayBars.focus?.href ?? "/pomodoro"}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors duration-200",
                todayBars.focus?.done
                  ? "border-success/25 bg-success-muted/15 hover:border-success/40 hover:bg-success-muted/25"
                  : todayBars.focus
                    ? "border-white/8 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.07]"
                    : "border-dashed border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
              )}
            >
              {todayBars.focus?.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
              ) : (
                <Timer className="h-3.5 w-3.5 shrink-0 text-accent" />
              )}
              <p
                className={cn(
                  "min-w-0 flex-1 truncate text-xs font-medium",
                  todayBars.focus?.done
                    ? "text-white/70 line-through"
                    : todayBars.focus
                      ? "text-white"
                      : "text-white/40"
                )}
              >
                {todayBars.focus?.label ?? "Focus session — schedule one"}
              </p>
              {!!todayBars.focus?.extraCount && (
                <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/55">
                  +{todayBars.focus.extraCount} more
                </span>
              )}
              <span className="shrink-0 font-mono text-[11px] text-white/40">
                {todayBars.focus?.time ?? "—"}
              </span>
            </Link>

            {/* Calendar-only event — always present */}
            <Link
              href={todayBars.calendarEvent?.href ?? "/calendar"}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors duration-200",
                todayBars.calendarEvent?.done
                  ? "border-success/25 bg-success-muted/15 hover:border-success/40 hover:bg-success-muted/25"
                  : todayBars.calendarEvent
                    ? "border-white/8 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.07]"
                    : "border-dashed border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
              )}
            >
              {todayBars.calendarEvent?.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-accent" />
              )}
              <p
                className={cn(
                  "min-w-0 flex-1 truncate text-xs font-medium",
                  todayBars.calendarEvent?.done
                    ? "text-white/70 line-through"
                    : todayBars.calendarEvent
                      ? "text-white"
                      : "text-white/40"
                )}
              >
                {todayBars.calendarEvent?.label ?? "Calendar event — add one"}
              </p>
              {!!todayBars.calendarEvent?.extraCount && (
                <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/55">
                  +{todayBars.calendarEvent.extraCount} more
                </span>
              )}
              <span className="shrink-0 font-mono text-[11px] text-white/40">
                {todayBars.calendarEvent?.time ?? "—"}
              </span>
            </Link>

            {/* Streak — always present */}
            <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-muted/25 p-3">
              <Flame className="h-3.5 w-3.5 shrink-0 text-warning" />
              <p className="text-xs font-medium text-white">
                {streak > 0 ? `${streak}-day streak` : "No streak yet"}
              </p>
              <Badge variant="accent" className="ml-auto shrink-0">
                {rank.label}
              </Badge>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats row — same set as the homepage preview */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Streak"
          value={streak}
          suffix={streak === 1 ? " day" : " days"}
          hint={streak > 0 ? "Keep it going" : "Finish a session to start one"}
          iconClassName="bg-warning-muted text-warning"
        />
        <StatCard
          icon={Timer}
          label="Focus today"
          value={todayFocusMinutes}
          suffix=" min"
          hint={`${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} today`}
          iconClassName="bg-accent-muted text-accent"
        />
        <StatCard
          icon={Repeat}
          label="Intervals"
          value={stats.intervalsCompleted}
          hint="All-time completed"
          iconClassName="bg-accent-muted text-accent"
        />
        <StatCard
          icon={Gauge}
          label="Productivity"
          value={stats.productivityIndex}
          suffix="%"
          hint="Last 7 days"
          iconClassName="bg-secondary-muted text-secondary"
        />
      </motion.div>

      {/* Daily goal + Current rank / XP — mirrors the homepage pair */}
      <motion.div variants={item} className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <GoalsPulseCard dailyGoal={dailyGoal} weeklyGoal={weeklyGoal} />
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
        <GlassPanel className="flex h-full flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent</h2>
            <History className="h-3.5 w-3.5 text-white/40" />
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <History className="h-5 w-5 text-white/50" />
              </span>
              <p className="text-sm text-white/60">Nothing to resume yet</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((entry) => {
                const Icon = entry.icon;
                return (
                  <li key={entry.key}>
                    <Link
                      href={entry.href}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/[0.04] p-3.5 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.07]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{entry.title}</p>
                        <p className="mt-0.5 text-[11px] text-white/45">{entry.subtitle}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-white/40">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassPanel>
      </motion.div>

      {/* Focus this week */}
      <motion.div variants={item}>
        <GlassPanel className="flex flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Focus this week</h2>
              <p className="mt-0.5 text-xs text-white/45">
                {weekTotal} minutes across the last 7 days
              </p>
            </div>
            <Badge variant="accent">
              <AnimatedCounter value={weekTotal} suffix=" min" />
            </Badge>
          </div>
          {weekTotal === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Timer className="h-5 w-5 text-white/50" />
              </span>
              <p className="text-sm text-white/60">No focus sessions yet this week</p>
              <Button asChild size="sm" variant="outline" className="cursor-pointer">
                <Link href="/pomodoro" className="inline-flex items-center gap-1.5">
                  Start your first session <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#focusFill)"
                    isAnimationActive={!prefersReducedMotion}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassPanel>
      </motion.div>
      </div>
      </div>
    </motion.div>
  );
}
