"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Flame,
  Gauge,
  History,
  Kanban,
  ListTodo,
  Plus,
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
    if (!s.completed || s.type !== "work") continue;
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

const PRIORITY_BADGE: Record<Objective["priority"], "danger" | "warning" | "accent" | "default"> = {
  urgent: "danger",
  high: "warning",
  medium: "accent",
  low: "default",
};

function upNext(objectives: Objective[]) {
  return objectives
    .filter((o) => o.status === "todo" || o.status === "in-progress")
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
    .filter((s) => s.completed && s.type === "work")
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

function GoalRow({ goal }: { goal: Goal }) {
  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-white/55">
        <span className="truncate">{goal.title}</span>
        <span className="tabular-nums text-white/70">
          {goal.progress}/{goal.target}
          {goal.unit ? ` ${goal.unit}` : ""}
        </span>
      </div>
      <ProgressBar value={percent} size="sm" className="mt-1.5" />
    </div>
  );
}

function GoalsPulseCard({ dailyGoal, weeklyGoal }: { dailyGoal: Goal | null; weeklyGoal: Goal | null }) {
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
          {dailyGoal && <GoalRow goal={dailyGoal} />}
          {weeklyGoal && <GoalRow goal={weeklyGoal} />}
        </div>
        <Link
          href="/goals"
          className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[11px] text-white/45 transition-colors duration-200 hover:text-white"
        >
          Manage goals <ArrowRight className="h-3 w-3" />
        </Link>
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
  const { objectives, hydrated: objectivesHydrated } = useObjectives();
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
      className="space-y-5"
    >
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

      {/* Rank + XP hero */}
      <motion.div variants={item}>
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

      {/* Today pulse */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          hint={`${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} completed`}
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
        <GoalsPulseCard dailyGoal={dailyGoal} weeklyGoal={weeklyGoal} />
      </motion.div>

      {/* Up next + Recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div variants={item}>
          <GlassPanel className="flex h-full flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Up next</h2>
              <Link
                href="/kanban"
                className="inline-flex cursor-pointer items-center gap-1 text-xs text-white/50 transition-colors duration-200 hover:text-white"
              >
                Board <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {queue.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Kanban className="h-5 w-5 text-white/50" />
                </span>
                <p className="text-sm text-white/60">Nothing queued</p>
                <Button asChild size="sm" variant="outline" className="cursor-pointer">
                  <Link href="/kanban" className="inline-flex items-center gap-1.5">
                    Add an objective <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {queue.map((objective) => (
                  <li key={objective.id}>
                    <Link
                      href="/kanban"
                      className="block cursor-pointer rounded-xl border border-white/8 bg-white/[0.04] p-3.5 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-white">
                          {objective.title}
                        </p>
                        <Badge variant={PRIORITY_BADGE[objective.priority]} className="shrink-0">
                          {objective.priority}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-white/45">
                        <span>{objective.subject}</span>
                        {(objective.scheduledStart ?? objective.dueDate) && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {new Date(
                              (objective.scheduledStart ?? objective.dueDate)!
                            ).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      {objective.progress > 0 && (
                        <ProgressBar value={objective.progress} size="sm" className="mt-2.5" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>
        </motion.div>

        <motion.div variants={item}>
          <GlassPanel className="flex h-full flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Recent</h2>
              <History className="h-3.5 w-3.5 text-white/40" />
            </div>
            {recent.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <History className="h-5 w-5 text-white/50" />
                </span>
                <p className="text-sm text-white/60">Nothing to resume yet</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
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
      </div>

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
    </motion.div>
  );
}
