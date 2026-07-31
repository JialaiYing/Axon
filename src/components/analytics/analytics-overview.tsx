"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
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
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { StreakFlame } from "@/components/ui/streak-flame";
import { TrendBadge } from "@/components/ui/trend-badge";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useFlashcards } from "@/hooks/use-flashcards";
import { useUserStats } from "@/hooks/use-user-stats";
import { DURATION, EASE, STAGGER, enterVariants, staggerContainer } from "@/lib/motion";
import { percentTrend, type Trend } from "@/lib/percent-trend";
import type { Objective, PomodoroSession } from "@/types";
import { cn } from "@/lib/utils";

const container = { hidden: {}, visible: { transition: staggerContainer(STAGGER.base) } };
const enter = enterVariants(8);
const item = {
  hidden: enter.hidden,
  visible: { ...enter.visible, transition: { duration: DURATION.section, ease: EASE } },
};

const RANGES = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
] as const;

const PRIORITY_COLORS: Record<Objective["priority"], string> = {
  urgent: "var(--color-danger)",
  high: "var(--color-warning)",
  medium: "var(--color-accent)",
  low: "var(--color-success)",
};

/**
 * Subject bars stay monochrome so the page accent lives on chrome/targets,
 * not categorical paint.
 */
const SUBJECT_BAR = "var(--color-foreground)";

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

/** Sum of work-session minutes in an inclusive [startDaysAgo, endDaysAgo] window. */
function focusMinutesInRange(
  sessions: PomodoroSession[],
  startDaysAgo: number,
  endDaysAgo: number
) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - startDaysAgo);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() - endDaysAgo);
  end.setHours(23, 59, 59, 999);
  return workSessions(sessions)
    .filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start.getTime() && t <= end.getTime();
    })
    .reduce((sum, s) => sum + s.durationMinutes, 0);
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
    .filter((row) => row.minutes > 0)
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
  "bg-surface",
  "bg-success/20",
  "bg-success/40",
  "bg-success/65",
  "bg-success",
];

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
    <div className="rounded-md border border-border/50 bg-card px-3 py-2 text-xs shadow-none light:border-border">
      <p className="font-medium text-foreground">{label ?? payload[0]?.name}</p>
      <p className="mt-0.5 font-mono tabular-nums text-muted-foreground">
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
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  iconClassName?: string;
  trend?: Trend;
}) {
  return (
    <div className="flex h-full flex-col justify-between px-4 py-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-muted-foreground">
          {label}
        </p>
        <Icon className={cn("h-4 w-4", iconClassName ?? "text-muted-foreground")} />
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-xl font-semibold tabular-nums text-foreground">{value}</p>
          {trend ? <TrendBadge {...trend} /> : null}
        </div>
        <p className="mt-1 text-[14px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
});

function ChartSection({
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
    <section className={cn("flex flex-col", className)}>
      <div className="mb-3.5">
        <h2 className="text-[16px] font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-[14px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 12 };
const GRID_STROKE = "var(--color-border)";

function LoadingState() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 rounded-md" />
      <Skeleton className="h-28 rounded-md" />
      <Skeleton className="h-72 rounded-md" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
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
  const previousRangeFocusMinutes = React.useMemo(
    () => focusMinutesInRange(sessions, rangeDays * 2 - 1, rangeDays),
    [sessions, rangeDays]
  );
  const focusRangeTrend = React.useMemo(
    () => percentTrend(rangeFocusMinutes, previousRangeFocusMinutes),
    [rangeFocusMinutes, previousRangeFocusMinutes]
  );
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
  const weekdayPeakMinutes = React.useMemo(
    () => Math.max(...weekdays.map((d) => d.minutes), 1),
    [weekdays]
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

  const rangeToolbar = (
    <div className="flex items-center gap-0.5 rounded-md border border-border/60 p-0.5 light:border-border">
      {RANGES.map((r) => (
        <button
          key={r.days}
          type="button"
          onClick={() => setRangeDays(r.days)}
          className={cn(
            "cursor-pointer rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
            rangeDays === r.days
              ? "bg-wash-strong text-foreground shadow-none"
              : "text-muted-foreground hover:bg-wash hover:text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
    <FeatureIntro feature="analytics" />
    <motion.div
      variants={container}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={item}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Analytics</h1>
        </div>
        {rangeToolbar}
      </motion.div>

      {/* Range-scoped stats — one divided band, no card chrome */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 divide-y divide-border/60 border-y border-border/50 lg:grid-cols-4 lg:divide-x lg:divide-y-0 light:divide-border light:border-border"
      >
          <StatCard
            icon={Timer}
            label="Focus time"
            value={formatHours(rangeFocusMinutes)}
            hint={`Last ${rangeDays} days · vs prior period`}
            trend={focusRangeTrend}
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
          />
          <StatCard
            icon={CheckCircle2}
            label="Objectives done"
            value={String(objectivesDone)}
            hint={`Last ${rangeDays} days`}
          />
          <StatCard
            icon={Target}
            label="Completion rate"
            value={`${completionRate}%`}
            hint={`${objectivesDone} of ${objectivesTouched || 0} touched`}
            iconClassName="text-danger"
          />
      </motion.div>

      {/* Hero chart — on the page, not in a card */}
      <motion.div variants={item}>
        <ChartSection
          title="Focus time trend"
          subtitle={`${formatHours(rangeFocusMinutes)} across the last ${rangeDays} days`}
        >
          {rangeSessions.length === 0 ? (
            <EmptyState
              compact
              icon={<Timer />}
              title="No focus sessions yet"
              description={`Start a Pomodoro in the last ${rangeDays} days to see your trend here.`}
              className="min-h-[200px] p-6"
            />
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0.02} />
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
                    stroke="var(--color-foreground)"
                    strokeWidth={1.25}
                    fill="url(#trendFill)"
                    isAnimationActive={!prefersReducedMotion}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartSection>
      </motion.div>

      {/* Priority + streak — flat like the rest of the page */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <motion.div variants={item}>
          <ChartSection
            title="Completion by priority"
            subtitle={`${objectivesDone} finished · ${completionRate}% of touched`}
          >
            {donut.every((d) => d.value === 0) ? (
              <EmptyState
                compact
                icon={<CheckCircle2 />}
                title="No completions yet"
                description="Finish objectives to see the priority mix."
                className="min-h-[180px] p-4"
              />
            ) : (
              <>
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
                    <li key={entry.name} className="flex items-center gap-2 text-[14px] text-foreground">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="capitalize">{entry.name}</span>
                      <span className="ml-auto font-mono tabular-nums text-muted-foreground">{entry.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </ChartSection>
        </motion.div>

        <motion.div
          variants={item}
          className="lg:border-l lg:border-border/50 lg:pl-10 light:lg:border-border"
        >
          <ChartSection
            title="Streak calendar"
            subtitle={`${stats.currentStreak}-day streak · last 12 weeks`}
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
            <div className="mt-3 flex items-center gap-1.5 text-[14px] text-muted-foreground">
              <span>Less</span>
              {HEAT_COLORS.map((c, i) => (
                <span key={i} className={cn("h-2.5 w-2.5 rounded-[2px]", c)} />
              ))}
              <span>More</span>
              <span className="ml-auto font-mono tabular-nums text-muted-foreground">
                {activeDays} active day{activeDays === 1 ? "" : "s"} in range
              </span>
            </div>
          </ChartSection>
        </motion.div>
      </div>

      <motion.div variants={item} className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-wash hover:text-foreground"
        >
          {showMore ? "Hide extra insights" : "More insights"}
        </button>
      </motion.div>

      {showMore && (
        <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <motion.div variants={item}>
              <ChartSection title="Peak hours" subtitle="When you focus, by time of day">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hours} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={2} />
                      <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={46} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-card-hover)" }} />
                      <Bar dataKey="minutes" fill="var(--color-secondary)" radius={[3, 3, 0, 0]} isAnimationActive={!prefersReducedMotion} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartSection>
            </motion.div>
            <motion.div variants={item}>
              <ChartSection title="Weekly rhythm" subtitle="Focus minutes by day of week">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdays} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={46} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-card-hover)" }} />
                      <Bar
                        dataKey="minutes"
                        radius={[3, 3, 0, 0]}
                        isAnimationActive={!prefersReducedMotion}
                      >
                        {weekdays.map((day) => {
                          const intensity = 0.4 + 0.6 * (day.minutes / weekdayPeakMinutes);
                          return (
                            <Cell
                              key={day.label}
                              fill="var(--color-accent)"
                              fillOpacity={day.minutes <= 0 ? 0.15 : intensity}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartSection>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <motion.div variants={item}>
              <ChartSection title="Focus by subject" subtitle="Where your study time goes">
                {subjects.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<BookOpen />}
                    title="No subject data yet"
                    description="Link timers to objectives with subjects to break down focus time."
                    className="min-h-[160px] p-4"
                  />
                ) : (
                  <ul className="space-y-3.5">
                    {subjects.map((s, i) => {
                      const max = Math.max(1, subjects[0]?.minutes ?? 0);
                      return (
                        <li key={s.subject}>
                          <div className="mb-1.5 flex items-center justify-between text-[14px]">
                            <span className="truncate text-foreground">{s.subject}</span>
                            <span className="font-mono tabular-nums text-muted-foreground">{formatHours(s.minutes)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-md bg-wash">
                            <motion.div
                              initial={prefersReducedMotion ? false : { width: 0 }}
                              animate={{ width: `${(s.minutes / max) * 100}%` }}
                              transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
                              className="h-full rounded-md"
                              style={{ backgroundColor: SUBJECT_BAR, opacity: 0.55 }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ChartSection>
            </motion.div>
            <motion.div variants={item}>
              <ChartSection title="Flashcard performance" subtitle="All-time recall across your sets">
                <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { icon: Target, label: "Accuracy", value: `${cardStats.accuracy}%`, hint: `${cardStats.attempts} total reviews`, tint: true },
                    { icon: Sparkles, label: "Mastered", value: String(cardStats.mastered), hint: "80%+ with 3+ reviews" },
                    { icon: Layers, label: "Cards", value: String(totalCards), hint: `Across ${sets.length} set${sets.length === 1 ? "" : "s"}` },
                    { icon: BookOpen, label: "Sets", value: String(sets.length), hint: "Total created" },
                  ].map((entry) => (
                    <div key={entry.label} className="py-1">
                      <div className="flex items-center gap-2">
                        <entry.icon
                          className={cn(
                            "h-4 w-4",
                            entry.tint ? "text-danger" : "text-muted-foreground"
                          )}
                        />
                        <p className="text-[14px] font-medium text-muted-foreground">{entry.label}</p>
                      </div>
                      <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-foreground">{entry.value}</p>
                      <p className="mt-0.5 text-[14px] text-muted-foreground">{entry.hint}</p>
                    </div>
                  ))}
                </div>
              </ChartSection>
            </motion.div>
          </div>

          <motion.div
            variants={item}
            className="border-t border-border/50 pt-5 light:border-border"
          >
              <p className="text-[14px] font-medium text-muted-foreground">All time</p>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(
                  [
                    { icon: <Sparkles className="h-4 w-4" />, label: "Total XP", value: stats.xp, suffix: " XP" },
                    {
                      icon: <StreakFlame days={stats.longestStreak} size="md" animated={false} />,
                      label: "Longest streak",
                      value: stats.longestStreak,
                      suffix: stats.longestStreak === 1 ? " day" : " days",
                    },
                    { icon: <Timer className="h-4 w-4" />, label: "Intervals", value: stats.intervalsCompleted, suffix: "" },
                    {
                      icon: <CheckCircle2 className="h-4 w-4" />,
                      label: "Objectives done",
                      value: objectives.filter((o) => o.status === "done" || o.completedAt).length,
                      suffix: "",
                    },
                  ] as const
                ).map((entry) => (
                  <div key={entry.label} className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                      {entry.icon}
                    </span>
                    <div>
                      <p className="font-mono text-[14px] font-semibold tabular-nums text-foreground">
                        <AnimatedCounter value={entry.value} suffix={entry.suffix} />
                      </p>
                      <p className="text-[14px] text-muted-foreground">{entry.label}</p>
                    </div>
                  </div>
                ))}
              </div>
          </motion.div>
        </>
      )}
    </motion.div>
    </>
  );
}
