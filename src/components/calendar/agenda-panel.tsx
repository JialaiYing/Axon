"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  Flag,
  Sparkles,
  Sun,
  Sunrise,
  Timer as TimerIcon,
} from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import { cn } from "@/lib/utils";
import { priorityBadgeVariant, formatDueDate, isOverdue, isScheduleOverdue } from "@/lib/kanban-utils";
import { addDays, formatTimeLabel, getScheduledEvent, isSameDay, type ScheduledEvent } from "@/lib/calendar-utils";
import { formatClock } from "@/lib/pomodoro-utils";
import { remainingSecondsOf } from "@/hooks/use-pomodoro-timers";
import type { Objective, PomodoroTimerInstance } from "@/types";

interface AgendaPanelProps {
  objectives: Objective[];
  timers: PomodoroTimerInstance[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (objective: Objective) => void;
  onPauseTimer: (id: string) => void;
  onResumeTimer: (id: string) => void;
  onStopTimer: (id: string) => void;
}

function useLiveTick(active: boolean, intervalMs = 1000) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);
}

function AgendaRow({
  objective,
  meta,
  tone = "default",
  hovered,
  onHover,
  onSelect,
}: {
  objective: Objective;
  meta: React.ReactNode;
  tone?: "default" | "danger" | "warning";
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (objective: Objective) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(objective)}
      onMouseEnter={() => onHover(objective.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
        hovered
          ? "border-accent/50 bg-accent-muted/30 shadow-[0_0_0_1px_rgba(94,106,210,0.15)]"
          : "border-transparent bg-surface hover:border-border-strong hover:bg-card"
      )}
    >
      <span
        className={cn(
          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-accent"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{objective.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={priorityBadgeVariant(objective.priority)} className="capitalize">
            {objective.priority}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{meta}</span>
        </div>
      </div>
    </button>
  );
}

function SectionHeading({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="mb-2 mt-4 flex items-center gap-1.5 px-1 first:mt-0">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

/**
 * The Calendar's "answer the question" panel: what's overdue, what's today
 * and tomorrow, what's coming due, and what's actively running right now.
 * Reads straight off the same objectives/timers the Kanban and Pomodoro
 * pages use — nothing here is calendar-only state.
 */
export function AgendaPanel({
  objectives,
  timers,
  hoveredId,
  onHover,
  onSelect,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
}: AgendaPanelProps) {
  const runningTimers = React.useMemo(() => timers.filter((t) => t.status !== "finished"), [timers]);
  useLiveTick(runningTimers.some((t) => t.status === "running"));

  const now = new Date();
  const tomorrow = addDays(now, 1);

  const active = objectives.filter((o) => o.status !== "done" && o.status !== "recycled");

  const overdue = React.useMemo(
    () =>
      active.filter((o) => isOverdue(o.dueDate, o.status) || isScheduleOverdue(o)).sort((a, b) => {
        const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return at - bt;
      }),
    [active]
  );

  const eventsByDay = React.useMemo(() => {
    const events: ScheduledEvent[] = [];
    for (const o of active) {
      const event = getScheduledEvent(o);
      if (event) events.push(event);
    }
    return events;
  }, [active]);

  const today = eventsByDay
    .filter((e) => isSameDay(e.start, now) && !isScheduleOverdue(e.objective))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const tomorrowEvents = eventsByDay
    .filter((e) => isSameDay(e.start, tomorrow))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const upcomingDeadlines = React.useMemo(() => {
    const horizon = addDays(new Date(), 7).getTime();
    return active
      .filter((o) => {
        if (!o.dueDate || isOverdue(o.dueDate, o.status)) return false;
        const t = new Date(o.dueDate).getTime();
        return t <= horizon;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [active]);

  const isEmpty =
    runningTimers.length === 0 &&
    overdue.length === 0 &&
    today.length === 0 &&
    tomorrowEvents.length === 0 &&
    upcomingDeadlines.length === 0;

  return (
    <Panel variant="interactive" className="flex max-h-[calc(100vh-9.5rem)] flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Agenda
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">What needs your attention.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {runningTimers.length > 0 && (
          <div className="mb-1">
            <SectionHeading icon={TimerIcon} label="Live now" count={runningTimers.length} />
            <div className="flex flex-col gap-2">
              {runningTimers.map((timer) => (
                <motion.div
                  key={timer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "rounded-lg border p-3",
                    timer.status === "running"
                      ? "border-accent/40 bg-accent-muted/20 shadow-[0_0_0_1px_rgba(94,106,210,0.15),0_0_24px_-8px_rgba(94,106,210,0.35)] light:shadow-[0_0_0_1px_rgba(79,70,229,0.25)]"
                      : "border-border bg-surface"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{timer.label}</p>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-accent">
                      {formatClock(remainingSecondsOf(timer))}
                    </span>
                  </div>
                  <div className="mt-2">
                    <TimerControls
                      status={timer.status}
                      onPause={() => onPauseTimer(timer.id)}
                      onResume={() => onResumeTimer(timer.id)}
                      onStop={() => onStopTimer(timer.id)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <SectionHeading icon={AlertTriangle} label="Overdue" count={overdue.length} />
        <div className="flex flex-col gap-1.5">
          {overdue.map((o) => (
            <AgendaRow
              key={o.id}
              objective={o}
              tone="danger"
              hovered={hoveredId === o.id}
              onHover={onHover}
              onSelect={onSelect}
              meta={
                o.scheduledStart
                  ? `Missed block · ${formatDueDate(o.scheduledStart)}`
                  : `Due ${formatDueDate(o.dueDate)}`
              }
            />
          ))}
        </div>

        <SectionHeading icon={Sun} label="Today" count={today.length} />
        <div className="flex flex-col gap-1.5">
          {today.map(({ objective, start, durationMinutes }) => (
            <AgendaRow
              key={objective.id}
              objective={objective}
              hovered={hoveredId === objective.id}
              onHover={onHover}
              onSelect={onSelect}
              meta={`${formatTimeLabel(start.getHours() * 60 + start.getMinutes())} · ${durationMinutes}m`}
            />
          ))}
        </div>

        <SectionHeading icon={Sunrise} label="Tomorrow" count={tomorrowEvents.length} />
        <div className="flex flex-col gap-1.5">
          {tomorrowEvents.map(({ objective, start, durationMinutes }) => (
            <AgendaRow
              key={objective.id}
              objective={objective}
              hovered={hoveredId === objective.id}
              onHover={onHover}
              onSelect={onSelect}
              meta={`${formatTimeLabel(start.getHours() * 60 + start.getMinutes())} · ${durationMinutes}m`}
            />
          ))}
        </div>

        <SectionHeading icon={Flag} label="Upcoming deadlines" count={upcomingDeadlines.length} />
        <div className="flex flex-col gap-1.5">
          {upcomingDeadlines.map((o) => (
            <AgendaRow
              key={o.id}
              objective={o}
              tone="warning"
              hovered={hoveredId === o.id}
              onHover={onHover}
              onSelect={onSelect}
              meta={`Due ${formatDueDate(o.dueDate)}`}
            />
          ))}
        </div>

        {isEmpty && (
          <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Nothing overdue, scheduled, or due soon. Schedule an objective to see it here.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}
