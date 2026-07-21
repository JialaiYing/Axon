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
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
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
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[var(--shadow-elevation-1)] transition-[border-color,box-shadow,background-color] duration-300 hover:border-border-strong hover:bg-card-hover hover:shadow-[var(--shadow-elevation-2)]",
        className
      )}
    >
      {children}
    </div>
  );
}

const StatCard = React.memo(function StatCard({
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
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/55">
            {label}
          </p>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border border-border",
              iconClassName
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          <p className="mt-1 text-xs text-foreground/45">{hint}</p>
        </div>
      </GlassPanel>
    </TiltCard>
  );
});

const GoalRow = React.memo(function GoalRow({
  goal,
  status,
}: {
  goal: Goal;
  status: GoalPaceStatus;
}) {
  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-foreground/55">
        <span className="truncate">{goal.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.08em]",
              status === "done" && "text-success",
              status === "on-track" && "text-foreground/50",
              status === "behind" && "text-warning"
            )}
          >
            {PACE_LABEL[status]}
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

function GoalsPulseCard({
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
  const visiblePersonalGoals = personalGoals.slice(0, 2);
  const remainingPersonalGoals = personalGoals.length - visiblePersonalGoals.length;

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
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/55">Goals</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-foreground/6 text-success">
            <Target className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {dailyGoal && dailyStatus && <GoalRow goal={dailyGoal} status={dailyStatus} />}
          {weeklyGoal && weeklyStatus && <GoalRow goal={weeklyGoal} status={weeklyStatus} />}
          {visiblePersonalGoals.length > 0 && (
            <div className="space-y-3 border-t border-foreground/8 pt-3">
              {visiblePersonalGoals.map((goal) => (
                <PersonalGoalRow key={goal.id} goal={goal} />
              ))}
              {remainingPersonalGoals > 0 && (
                <Link
                  href="/goals"
                  className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-foreground/45 transition-colors duration-200 hover:text-foreground"
                >
                  +{remainingPersonalGoals} more personal goal{remainingPersonalGoals === 1 ? "" : "s"}
                </Link>
              )}
            </div>
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
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-foreground/45 transition-colors duration-200 hover:text-foreground"
          >
            {personalGoals.length === 0 ? "Add a personal goal" : "Manage goals"} <ArrowRight className="h-3 w-3" />
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
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-foreground/6 text-accent">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/45">
              Current rank
            </p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{rankLabel}</p>
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
    </GlassPanel>
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
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/45">
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

      {/* Compact up-next queue */}
      <motion.div variants={item}>
        <div className="flex flex-col gap-2">
          <p className="mb-0.5 text-[10px] uppercase tracking-wide text-foreground/45">Up next</p>
          {queue.length === 0 ? (
            <Link
              href="/kanban"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/60 p-6 text-center transition-colors duration-200 hover:border-border-strong hover:bg-card-hover"
            >
              <Circle className="h-4 w-4 text-foreground/40" />
              <p className="text-xs text-foreground/55">No objectives yet</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-foreground/40">
                Create one on the board <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {queue.map((objective) => (
                <div
                  key={objective.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 transition-colors duration-200 hover:border-border-strong hover:bg-card-hover"
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
                    className="min-w-0 flex-1 cursor-pointer truncate text-xs font-medium text-foreground"
                  >
                    {objective.title}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Mark "${objective.title}" done`}
                    onClick={() => completeObjective(objective.id)}
                    className="shrink-0 cursor-pointer rounded-md p-0.5 text-foreground/40 transition-colors duration-150 hover:text-success"
                  >
                    <Circle className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats row — demoted below the Today agenda */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Streak"
          value={streak}
          suffix={streak === 1 ? " day" : " days"}
          hint={streak > 0 ? "Keep it going" : "Finish a session to start one"}
          iconClassName="bg-foreground/6 text-warning"
        />
        <StatCard
          icon={Timer}
          label="Focus today"
          value={todayFocusMinutes}
          suffix=" min"
          hint={`${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} today`}
          iconClassName="bg-foreground/6 text-accent"
        />
        <StatCard
          icon={Repeat}
          label="Intervals"
          value={stats.intervalsCompleted}
          hint="All-time completed"
          iconClassName="bg-foreground/6 text-foreground/60"
        />
        <StatCard
          icon={Gauge}
          label="Productivity"
          value={stats.productivityIndex}
          suffix="%"
          hint="Last 7 days"
          iconClassName="bg-foreground/6 text-foreground/60"
        />
      </motion.div>

      {/* Daily goal + Current rank / XP — mirrors the homepage pair */}
      <motion.div variants={item}>
        <FeatureIntro feature="gamification" />
      </motion.div>
      <motion.div variants={item} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GoalsPulseCard dailyGoal={dailyGoal} weeklyGoal={weeklyGoal} personalGoals={personalGoals} />
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
            <h2 className="text-sm font-semibold text-foreground">Recent</h2>
            <History className="h-3.5 w-3.5 text-foreground/40" />
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-foreground/6">
                <History className="h-5 w-5 text-muted-foreground" />
              </span>
              <p className="text-sm text-muted-foreground">Nothing to resume yet</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((entry) => {
                const Icon = entry.icon;
                return (
                  <li key={entry.key}>
                    <Link
                      href={entry.href}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:border-border-strong hover:bg-card-hover"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-foreground/6 text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
                        <p className="mt-0.5 text-[11px] text-foreground/45">{entry.subtitle}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-foreground/40">
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
              <h2 className="text-sm font-semibold text-foreground">Focus this week</h2>
              <p className="mt-0.5 text-xs text-foreground/45">
                {weekTotal} minutes across the last 7 days
              </p>
            </div>
            <Badge variant="accent">
              <AnimatedCounter value={weekTotal} suffix=" min" />
            </Badge>
          </div>
          {weekTotal === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-foreground/6">
                <Timer className="h-5 w-5 text-accent" />
              </span>
              <p className="text-sm text-foreground/60">No focus sessions yet this week</p>
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
          )}
        </GlassPanel>
      </motion.div>
    </motion.div>
    </>
  );
}
