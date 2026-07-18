"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Flame,
  Kanban,
  ListTodo,
  Plus,
  Timer,
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
import type { Objective, PomodoroSession } from "@/types";
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

/** Consecutive days (ending today or yesterday) with at least one completed work session. */
function computeStreak(sessions: PomodoroSession[]) {
  const activeDays = new Set(
    sessions
      .filter((s) => s.completed && s.type === "work")
      .map((s) => dayKey(new Date(s.date)))
  );
  let streak = 0;
  const cursor = new Date();
  // A streak survives if today has no activity yet but yesterday does.
  if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
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

  const hydrated = objectivesHydrated && sessionsHydrated;

  const inProgress = objectives.filter((o) => o.status === "in-progress");
  const completed = objectives.filter((o) => o.status === "done");
  const streak = React.useMemo(() => computeStreak(sessions), [sessions]);
  const weekData = React.useMemo(() => buildWeekData(sessions), [sessions]);
  const weekTotal = weekData.reduce((sum, d) => sum + d.minutes, 0);
  const queue = React.useMemo(() => upNext(objectives), [objectives]);

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

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Timer}
          label="Focus today"
          value={todayFocusMinutes}
          suffix=" min"
          hint={`${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} completed`}
          iconClassName="bg-accent-muted text-accent"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={streak}
          suffix={streak === 1 ? " day" : " days"}
          hint={streak > 0 ? "Keep it going" : "Finish a session to start one"}
          iconClassName="bg-warning-muted text-warning"
        />
        <StatCard
          icon={ListTodo}
          label="In progress"
          value={inProgress.length}
          hint={`${objectives.filter((o) => o.status === "todo").length} queued`}
          iconClassName="bg-secondary-muted text-secondary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={completed.length}
          hint="Objectives finished"
          iconClassName="bg-success-muted text-success"
        />
      </motion.div>

      {/* Chart + up next */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <GlassPanel className="flex h-full flex-col p-6">
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
      </div>
    </motion.div>
  );
}
