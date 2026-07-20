"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useFlashcards } from "@/hooks/use-flashcards";
import { useUserStats } from "@/hooks/use-user-stats";
import type { Objective, PomodoroSession } from "@/types";
import { cn } from "@/lib/utils";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

const RANGES = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
] as const;

const PRIORITY_COLORS: Record<Objective["priority"], string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#22c55e",
};

const SUBJECT_COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function workSessions(sessions: PomodoroSession[]) {
  return sessions.filter((s) => s.type === "work" && s.durationMinutes > 0);
}

function inRange(iso: string, days: number) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return new Date(iso).getTime() >= cutoff.getTime();
}

/** Per-day focus minutes for the trend chart. Buckets by week when the range is long. */
function buildTrend(sessions: PomodoroSession[], days: number) {
  const byDay = new Map<string, number>();
  for (const s of workSessions(sessions)) {
    const key = dayKey(new Date(s.date));
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationMinutes);
  }
  const points: { label: string; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({
      label:
        days <= 7
          ? d.toLocaleDateString(undefined, { weekday: "short" })
          : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      minutes: byDay.get(dayKey(d)) ?? 0,
    });
  }
  return points;
}

function buildHourDistribution(sessions: PomodoroSession[], days: number) {
  const buckets = new Array(24).fill(0);
  for (const s of workSessions(sessions)) {
    if (!inRange(s.date, days)) continue;
    buckets[new Date(s.date).getHours()] += s.durationMinutes;
  }
  return buckets.map((minutes, h) => ({
    label: `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`,
    minutes,
  }));
}

function buildWeekdayDistribution(sessions: PomodoroSession[], days: number) {
  const buckets = new Array(7).fill(0);
  for (const s of workSessions(sessions)) {
    if (!inRange(s.date, days)) continue;
    buckets[new Date(s.date).getDay()] += s.durationMinutes;
  }
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Start the week on Monday.
  return [1, 2, 3, 4, 5, 6, 0].map((i) => ({ label: labels[i], minutes: buckets[i] }));
}

function buildSubjectBreakdown(
  sessions: PomodoroSession[],
  objectives: Objective[],
  days: number
) {
  const subjectById = new Map(objectives.map((o) => [o.id, o.subject]));
  const knownSubjects = [...new Set(objectives.map((o) => o.subject).filter(Boolean))];
  const bySubject = new Map<string, number>(
    (knownSubjects.length > 0 ? knownSubjects : ["Personal"]).map((subject) => [subject, 0])
  );
  for (const s of workSessions(sessions)) {
    if (!inRange(s.date, days)) continue;
    const subject = (s.objectiveId && subjectById.get(s.objectiveId)) || "Personal";
    bySubject.set(subject, (bySubject.get(subject) ?? 0) + s.durationMinutes);
  }
  return [...bySubject.entries()]
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6);
}

function buildPriorityDonut(objectives: Objective[], days: number) {
  const counts = new Map<Objective["priority"], number>();
  for (const o of objectives) {
    if (o.status !== "done" && !o.completedAt) continue;
    if (!o.completedAt || !inRange(o.completedAt, days)) continue;
    counts.set(o.priority, (counts.get(o.priority) ?? 0) + 1);
  }
  return (["urgent", "high", "medium", "low"] as const).map((p) => ({
    name: p,
    value: counts.get(p) ?? 0,
    color: PRIORITY_COLORS[p],
  }));
}

/** Last 12 weeks of focus activity for a GitHub-style streak heatmap. */
function buildStreakHeatmap(sessions: PomodoroSession[]) {
  const byDay = new Map<string, number>();
  for (const s of workSessions(sessions)) {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    byDay.set(key, (byDay.get(key) ?? 0) + s.durationMinutes);
  }
  const days: { key: string; minutes: number; date: Date }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    days.push({ key, minutes: byDay.get(key) ?? 0, date: d });
  }
  return days;
}

function heatmapLevel(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes < 25) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

const HEAT_COLORS = [
  "bg-foreground/[0.06]",
  "bg-accent/30",
  "bg-accent/50",
  "bg-accent/75",
  "bg-accent",
];

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function GlassPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("glass-panel glass-panel-hover rounded-2xl", className)}>{children}</div>
  );
}

const ChartTooltip = React.memo(function ChartTooltip({
  active,
  payload,
  label,
  unit = "min",
}: {
  active?: boolean;
  payload?: { value?: number; name?: string }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-foreground">{label ?? payload[0]?.name}</p>
      <p className="mt-0.5 text-foreground/60">
        {payload[0]?.value ?? 0} {unit}
      </p>
    </div>
  );
});

const StatCard = React.memo(function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  iconClassName: string;
}) {
  return (
    <GlassPanel className="flex h-full flex-col justify-between p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/55">
          {label}
        </p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10",
            iconClassName
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="mt-1 text-xs text-foreground/45">{hint}</p>
      </div>
    </GlassPanel>
  );
});

function ChartPanel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassPanel className={cn("flex flex-col p-6", className)}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-foreground/45">{subtitle}</p>}
      </div>
      {children}
    </GlassPanel>
  );
}

const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 11 };
const GRID_STROKE = "var(--color-border)";

function LoadingState() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 rounded-2xl" />
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

export function AnalyticsOverview() {
  const prefersReducedMotion = useReducedMotion();
  const [rangeDays, setRangeDays] = React.useState<7 | 30 | 90>(7);
  const [showMore, setShowMore] = React.useState(false);

  const { objectives, hydrated: objectivesHydrated } = useObjectives();
  const { sessions, hydrated: sessionsHydrated } = usePomodoroSessions();
  const { sets, totalCards, hydrated: flashcardsHydrated } = useFlashcards();
  const { stats, hydrated: statsHydrated } = useUserStats();

  const hydrated = objectivesHydrated && sessionsHydrated && flashcardsHydrated && statsHydrated;

  const rangeSessions = React.useMemo(
    () => workSessions(sessions).filter((s) => inRange(s.date, rangeDays)),
    [sessions, rangeDays]
  );
  const rangeFocusMinutes = rangeSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const activeDays = React.useMemo(
    () => new Set(rangeSessions.map((s) => dayKey(new Date(s.date)))).size,
    [rangeSessions]
  );
  const objectivesDone = React.useMemo(
    () =>
      objectives.filter((o) => o.completedAt && inRange(o.completedAt, rangeDays)).length,
    [objectives, rangeDays]
  );
  const objectivesTouched = React.useMemo(
    () =>
      objectives.filter(
        (o) =>
          o.status !== "recycled" &&
          (inRange(o.updatedAt, rangeDays) ||
            (o.completedAt ? inRange(o.completedAt, rangeDays) : false))
      ).length,
    [objectives, rangeDays]
  );
  const completionRate =
    objectivesTouched > 0 ? Math.round((objectivesDone / objectivesTouched) * 100) : 0;

  const trend = React.useMemo(() => buildTrend(sessions, rangeDays), [sessions, rangeDays]);
  const heatmap = React.useMemo(() => buildStreakHeatmap(sessions), [sessions]);
  const hours = React.useMemo(
    () => buildHourDistribution(sessions, rangeDays),
    [sessions, rangeDays]
  );
  const weekdays = React.useMemo(
    () => buildWeekdayDistribution(sessions, rangeDays),
    [sessions, rangeDays]
  );
  const subjects = React.useMemo(
    () => buildSubjectBreakdown(sessions, objectives, rangeDays),
    [sessions, objectives, rangeDays]
  );
  const donut = React.useMemo(
    () => buildPriorityDonut(objectives, rangeDays),
    [objectives, rangeDays]
  );

  const cardStats = React.useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let mastered = 0;
    for (const set of sets) {
      for (const card of set.cards) {
        correct += card.correctCount;
        incorrect += card.incorrectCount;
        if (card.masteryPercent >= 80 && card.correctCount + card.incorrectCount >= 3) mastered++;
      }
    }
    const attempts = correct + incorrect;
    return {
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      attempts,
      mastered,
    };
  }, [sets]);

  if (!hydrated) return <LoadingState />;

  return (
    <>
    <FeatureIntro feature="analytics" />
    <motion.div
      variants={container}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      className="space-y-5"
    >
      {/* Header + range selector */}
      <motion.div
        variants={item}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/45">
            Long-term trends
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Analytics
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-foreground/10 bg-foreground/[0.04] p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                rangeDays === r.days
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/50 hover:text-foreground/80"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Range-scoped stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Timer}
          label="Focus time"
          value={formatHours(rangeFocusMinutes)}
          hint={`Last ${rangeDays} days`}
          iconClassName="bg-accent-muted text-accent"
        />
        <StatCard
          icon={Clock}
          label="Sessions"
          value={String(rangeSessions.length)}
          hint={
            rangeSessions.length > 0
              ? `~${Math.round(rangeFocusMinutes / rangeSessions.length)} min average`
              : "No sessions yet"
          }
          iconClassName="bg-secondary-muted text-secondary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Objectives done"
          value={String(objectivesDone)}
          hint={`Last ${rangeDays} days`}
          iconClassName="bg-success-muted text-success"
        />
        <StatCard
          icon={Target}
          label="Completion rate"
          value={`${completionRate}%`}
          hint={`${objectivesDone} of ${objectivesTouched || 0} touched`}
          iconClassName="bg-warning-muted text-warning"
        />
      </motion.div>

      {/* High-signal charts only */}
      <motion.div variants={item}>
        <ChartPanel
          title="Focus time trend"
          subtitle={`${formatHours(rangeFocusMinutes)} across the last ${rangeDays} days`}
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={46} />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "var(--color-border-strong)" }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  isAnimationActive={!prefersReducedMotion}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div variants={item}>
          <ChartPanel
            title="Completion by priority"
            subtitle={`${objectivesDone} finished · ${completionRate}% of touched`}
            className="h-full"
          >
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: 1 }]}
                    dataKey="value"
                    innerRadius="62%"
                    outerRadius="90%"
                    strokeWidth={0}
                    fill="var(--color-border)"
                    isAnimationActive={false}
                  />
                  <Pie
                    data={donut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="90%"
                    paddingAngle={3}
                    strokeWidth={0}
                    isAnimationActive={!prefersReducedMotion}
                  >
                    {donut.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip unit="done" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1.5">
              {donut.map((entry) => (
                <li key={entry.name} className="flex items-center gap-2 text-xs text-foreground/60">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="capitalize">{entry.name}</span>
                  <span className="ml-auto tabular-nums text-foreground/45">{entry.value}</span>
                </li>
              ))}
            </ul>
          </ChartPanel>
        </motion.div>

        <motion.div variants={item}>
          <ChartPanel
            title="Streak calendar"
            subtitle={`${stats.currentStreak}-day streak · last 12 weeks`}
            className="h-full"
          >
            <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
              {heatmap.map((day) => {
                const level = heatmapLevel(day.minutes);
                return (
                  <div
                    key={day.key}
                    title={`${day.date.toLocaleDateString()}: ${day.minutes} min`}
                    className={cn("h-3 w-3 rounded-[3px]", HEAT_COLORS[level])}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-foreground/40">
              <span>Less</span>
              {HEAT_COLORS.map((c, i) => (
                <span key={i} className={cn("h-2.5 w-2.5 rounded-[2px]", c)} />
              ))}
              <span>More</span>
              <span className="ml-auto tabular-nums text-foreground/50">
                {activeDays} active day{activeDays === 1 ? "" : "s"} in range
              </span>
            </div>
          </ChartPanel>
        </motion.div>
      </div>

      <motion.div variants={item} className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="cursor-pointer rounded-lg border border-foreground/10 bg-foreground/[0.04] px-4 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          {showMore ? "Hide extra insights" : "More insights"}
        </button>
      </motion.div>

      {showMore && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div variants={item}>
              <ChartPanel title="Peak hours" subtitle="When you focus, by time of day" className="h-full">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hours} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={2} />
                      <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={46} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-card-hover)" }} />
                      <Bar dataKey="minutes" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartPanel>
            </motion.div>
            <motion.div variants={item}>
              <ChartPanel title="Weekly rhythm" subtitle="Focus minutes by day of week" className="h-full">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdays} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={46} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-card-hover)" }} />
                      <Bar dataKey="minutes" fill="var(--color-accent)" radius={[4, 4, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartPanel>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div variants={item}>
              <ChartPanel title="Focus by subject" subtitle="Where your study time goes" className="h-full">
                <ul className="space-y-3">
                  {subjects.map((s, i) => {
                    const max = Math.max(1, subjects[0]?.minutes ?? 0);
                    return (
                      <li key={s.subject}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="truncate text-foreground/70">{s.subject}</span>
                          <span className="tabular-nums text-foreground/45">{formatHours(s.minutes)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
                          <motion.div
                            initial={prefersReducedMotion ? false : { width: 0 }}
                            animate={{ width: `${(s.minutes / max) * 100}%` }}
                            transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ChartPanel>
            </motion.div>
            <motion.div variants={item}>
              <ChartPanel title="Flashcard performance" subtitle="All-time recall across your sets" className="h-full">
                <div className="grid flex-1 grid-cols-2 gap-3">
                  {[
                    { icon: Target, label: "Accuracy", value: `${cardStats.accuracy}%`, hint: `${cardStats.attempts} total reviews`, color: "text-success" },
                    { icon: Sparkles, label: "Mastered", value: String(cardStats.mastered), hint: "80%+ with 3+ reviews", color: "text-accent" },
                    { icon: Layers, label: "Cards", value: String(totalCards), hint: `Across ${sets.length} set${sets.length === 1 ? "" : "s"}`, color: "text-secondary" },
                    { icon: BookOpen, label: "Sets", value: String(sets.length), hint: "Total created", color: "text-warning" },
                  ].map((entry) => (
                    <div key={entry.label} className="rounded-xl border border-foreground/8 bg-foreground/[0.04] p-4">
                      <div className="flex items-center gap-2">
                        <entry.icon className={cn("h-3.5 w-3.5", entry.color)} />
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/55">{entry.label}</p>
                      </div>
                      <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{entry.value}</p>
                      <p className="mt-0.5 text-[11px] text-foreground/45">{entry.hint}</p>
                    </div>
                  ))}
                </div>
              </ChartPanel>
            </motion.div>
          </div>

          <motion.div variants={item}>
            <GlassPanel className="p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/55">All time</p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: Sparkles, label: "Total XP", value: stats.xp, suffix: " XP" },
                  { icon: Flame, label: "Longest streak", value: stats.longestStreak, suffix: stats.longestStreak === 1 ? " day" : " days" },
                  { icon: Timer, label: "Intervals", value: stats.intervalsCompleted, suffix: "" },
                  {
                    icon: CheckCircle2,
                    label: "Objectives done",
                    value: objectives.filter((o) => o.status === "done" || o.completedAt).length,
                    suffix: "",
                  },
                ].map((entry) => (
                  <div key={entry.label} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5 text-foreground/60">
                      <entry.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-base font-semibold tabular-nums text-foreground">
                        <AnimatedCounter value={entry.value} suffix={entry.suffix} />
                      </p>
                      <p className="text-[11px] text-foreground/45">{entry.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </motion.div>
    </>
  );
}
