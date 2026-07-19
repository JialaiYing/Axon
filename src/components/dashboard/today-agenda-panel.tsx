"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Flame,
  ListTodo,
  Sun,
  Target,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  dayElapsedFraction,
  goalPaceStatus,
  isToday as isTodayDate,
  PACE_LABEL,
  weekElapsedFraction,
} from "@/lib/goals-utils";
import { formatDueDate, isOverdue, isScheduleOverdue, priorityBadgeVariant } from "@/lib/kanban-utils";
import { formatTimeLabel, getScheduledEvent, isSameDay } from "@/lib/calendar-utils";
import type { Goal, Objective } from "@/types";
import { cn } from "@/lib/utils";

interface TodayAgendaPanelProps {
  objectives: Objective[];
  dailyGoal: Goal | null;
  weeklyGoal: Goal | null;
  streak: number;
  rankLabel: string;
}

/**
 * Glance-and-go "Today" panel for the Dashboard — overdue work, due/scheduled
 * today, calendar-only events, and goal progress in one place.
 */
export function TodayAgendaPanel({
  objectives,
  dailyGoal,
  weeklyGoal,
  streak,
  rankLabel,
}: TodayAgendaPanelProps) {
  const now = React.useMemo(() => new Date(), []);

  const active = React.useMemo(
    () => objectives.filter((o) => o.status !== "done" && o.status !== "recycled"),
    [objectives]
  );

  const overdue = React.useMemo(
    () =>
      active
        .filter((o) => isOverdue(o.dueDate, o.status) || isScheduleOverdue(o))
        .sort((a, b) => {
          const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return at - bt;
        })
        .slice(0, 5),
    [active]
  );

  const dueToday = React.useMemo(
    () =>
      active
        .filter(
          (o) =>
            o.dueDate &&
            isTodayDate(o.dueDate) &&
            !isOverdue(o.dueDate, o.status) &&
            !overdue.some((x) => x.id === o.id)
        )
        .slice(0, 6),
    [active, overdue]
  );

  const scheduledToday = React.useMemo(() => {
    const items = active
      .map((o) => {
        const event = getScheduledEvent(o);
        if (!event || !isSameDay(event.start, now) || isScheduleOverdue(o)) return null;
        return event;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    return items.slice(0, 8);
  }, [active, now]);

  const focusBlocks = scheduledToday.filter((e) => e.objective.showOnKanban !== false);
  const calendarEvents = scheduledToday.filter((e) => e.objective.showOnKanban === false);

  const dailyStatus = dailyGoal ? goalPaceStatus(dailyGoal, dayElapsedFraction(now)) : null;
  const weeklyStatus = weeklyGoal ? goalPaceStatus(weeklyGoal, weekElapsedFraction(now)) : null;

  const isEmpty =
    overdue.length === 0 &&
    dueToday.length === 0 &&
    focusBlocks.length === 0 &&
    calendarEvents.length === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">Today</p>
          <h2 className="mt-0.5 text-base font-semibold text-white">Your agenda</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-muted/25 px-2.5 py-1">
            <Flame className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-medium text-white">
              {streak > 0 ? `${streak}-day streak` : "No streak yet"}
            </span>
          </div>
          <Badge variant="accent">{rankLabel}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-3">
          {overdue.length > 0 && (
            <AgendaSection icon={AlertTriangle} label="Overdue" count={overdue.length} tone="danger">
              {overdue.map((o) => (
                <AgendaLink
                  key={o.id}
                  href="/kanban"
                  title={o.title}
                  meta={
                    o.scheduledStart
                      ? `Missed block · ${formatDueDate(o.scheduledStart)}`
                      : `Due ${formatDueDate(o.dueDate)}`
                  }
                  priority={o.priority}
                  tone="danger"
                />
              ))}
            </AgendaSection>
          )}

          {dueToday.length > 0 && (
            <AgendaSection icon={ListTodo} label="Due today" count={dueToday.length}>
              {dueToday.map((o) => (
                <AgendaLink
                  key={o.id}
                  href="/kanban"
                  title={o.title}
                  meta="Due today"
                  priority={o.priority}
                />
              ))}
            </AgendaSection>
          )}

          <AgendaSection icon={Timer} label="Scheduled focus" count={focusBlocks.length}>
            {focusBlocks.length === 0 ? (
              <EmptyHint href="/pomodoro" label="Schedule a focus block or start a Pomodoro" />
            ) : (
              focusBlocks.map(({ objective, start, durationMinutes }) => (
                <AgendaLink
                  key={objective.id}
                  href="/pomodoro"
                  title={objective.title}
                  meta={`${formatTimeLabel(start.getHours() * 60 + start.getMinutes())} · ${durationMinutes}m`}
                  priority={objective.priority}
                  done={objective.status === "done"}
                />
              ))
            )}
          </AgendaSection>

          <AgendaSection icon={CalendarClock} label="Calendar events" count={calendarEvents.length}>
            {calendarEvents.length === 0 ? (
              <EmptyHint href="/calendar" label="Add a calendar-only event" />
            ) : (
              calendarEvents.map(({ objective, start, durationMinutes }) => (
                <AgendaLink
                  key={objective.id}
                  href="/calendar"
                  title={objective.title}
                  meta={`${formatTimeLabel(start.getHours() * 60 + start.getMinutes())} · ${durationMinutes}m`}
                  priority={objective.priority}
                  done={objective.status === "done"}
                />
              ))
            )}
          </AgendaSection>

          {isEmpty && overdue.length === 0 && dueToday.length === 0 && (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-white/12 px-3 py-4 text-xs text-white/45">
              <Sun className="h-3.5 w-3.5 shrink-0" />
              Clear day — add an objective or schedule a focus block to fill this view.
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/45">
            <Target className="h-3.5 w-3.5" />
            Goal progress
          </p>
          {dailyGoal && dailyStatus && (
            <GoalMini goal={dailyGoal} status={dailyStatus} />
          )}
          {weeklyGoal && weeklyStatus && (
            <GoalMini goal={weeklyGoal} status={weeklyStatus} />
          )}
          <Link
            href="/goals"
            className="inline-flex items-center gap-1 text-[11px] text-white/45 transition-colors hover:text-white"
          >
            Manage goals <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function AgendaSection({
  icon: Icon,
  label,
  count,
  tone,
  children,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 px-0.5">
        <Icon
          className={cn("h-3.5 w-3.5", tone === "danger" ? "text-danger" : "text-white/45")}
        />
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wide",
            tone === "danger" ? "text-danger" : "text-white/45"
          )}
        >
          {label}
        </p>
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/55">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function AgendaLink({
  href,
  title,
  meta,
  priority,
  tone,
  done,
}: {
  href: string;
  title: string;
  meta: string;
  priority: Objective["priority"];
  tone?: "danger";
  done?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors duration-200",
        done
          ? "border-success/25 bg-success-muted/15 hover:border-success/40"
          : tone === "danger"
            ? "border-danger/25 bg-danger-muted/10 hover:border-danger/40"
            : "border-white/8 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.07]"
      )}
    >
      {done ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <span
          className={cn(
            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
            tone === "danger" ? "bg-danger" : "bg-accent"
          )}
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-white",
            done && "text-white/70 line-through"
          )}
        >
          {title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={priorityBadgeVariant(priority)} className="capitalize">
            {priority}
          </Badge>
          <span className="text-[11px] text-white/45">{meta}</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyHint({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-dashed border-white/12 px-3 py-2.5 text-xs text-white/40 transition-colors hover:border-white/20 hover:text-white/60"
    >
      {label} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

function GoalMini({
  goal,
  status,
}: {
  goal: Goal;
  status: ReturnType<typeof goalPaceStatus>;
}) {
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
