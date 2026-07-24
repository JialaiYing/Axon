"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  Flag,
  Sun,
  Sunrise,
  Timer as TimerIcon,
} from "lucide-react";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import { cn } from "@/lib/utils";
import { formatDueDate, isOverdue, isScheduleOverdue } from "@/lib/kanban-utils";
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
  className?: string;
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
        "flex w-full items-start gap-2.5 px-1 py-1.5 text-left transition-colors duration-150",
        hovered
          ? "bg-wash"
          : "hover:bg-wash"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "danger"
            ? "bg-danger"
            : tone === "warning"
              ? "bg-warning"
              : "bg-muted-foreground"
        )}
        style={
          tone === "default" && objective.color
            ? { backgroundColor: objective.color }
            : undefined
        }
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{objective.title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{meta}</p>
      </div>
    </button>
  );
}

function SectionHeading({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="mb-1 mt-3 flex items-center gap-1.5 first:mt-0">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <span className="font-mono text-[10px] font-medium text-muted-foreground">· {count}</span>
    </div>
  );
}

/**
 * The Calendar's "answer the question" panel: what's overdue, what's today
 * and tomorrow, what's coming due, and what's actively running right now.
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
  className,
}: AgendaPanelProps) {
  const prefersReducedMotion = useReducedMotion();
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
    <div
      className={cn(
        "flex max-h-[calc(100vh-9.5rem)] flex-col overflow-hidden rounded-md border border-border/50 light:border-border light:bg-card",
        className
      )}
    >
      <div className="border-b border-border/50 px-3 py-2.5 light:border-border">
        <p className="text-[13px] font-semibold text-foreground">Agenda</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">What needs attention</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {runningTimers.length > 0 && (
          <div className="mb-1">
            <SectionHeading icon={TimerIcon} label="Live now" count={runningTimers.length} />
            <div className="flex flex-col gap-1.5">
              {runningTimers.map((timer) => (
                <motion.div
                  key={timer.id}
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                  className={cn(
                    "rounded-md border border-border/50 px-2.5 py-2 light:border-border",
                    timer.status === "running" && "border-accent/30 bg-accent-muted/15"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-foreground">{timer.label}</p>
                    <span className="shrink-0 font-mono text-[13px] tabular-nums text-foreground">
                      {formatClock(remainingSecondsOf(timer))}
                    </span>
                  </div>
                  <div className="mt-1.5">
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
        <div className="divide-y divide-border/60 border-y border-border/50 light:divide-border light:border-border">
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
        <div className="divide-y divide-border/60 border-y border-border/50 light:divide-border light:border-border">
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
        <div className="divide-y divide-border/60 border-y border-border/50 light:divide-border light:border-border">
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
        <div className="divide-y divide-border/60 border-y border-border/50 light:divide-border light:border-border">
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
    </div>
  );
}
