"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ListTodo,
  Sun,
  Target,
  Timer,
} from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  dayElapsedFraction,
  goalPaceStatus,
  PACE_LABEL,
  weekElapsedFraction,
} from "@/lib/goals-utils";
import { formatDueDate } from "@/lib/kanban-utils";
import { formatTimeLabel } from "@/lib/calendar-utils";
import { buildTodayAgenda } from "@/lib/dashboard-agenda";
import type { Goal, Objective } from "@/types";
import { cn } from "@/lib/utils";

interface TodayAgendaPanelProps {
  objectives: Objective[];
  dailyGoal: Goal | null;
  weeklyGoal: Goal | null;
}

/**
 * Glance-and-go "Today" panel for the Dashboard — overdue work, due/scheduled
 * today, in-progress board cards, and (when nothing is time-bound) open
 * Kanban todos so the hero never claims a "clear day" while the board is full.
 */
export function TodayAgendaPanel({
  objectives,
  dailyGoal,
  weeklyGoal,
}: TodayAgendaPanelProps) {
  const now = React.useMemo(() => new Date(), []);

  const {
    overdue,
    dueToday,
    focusBlocks,
    calendarEvents,
    inProgress,
    onBoard,
  } = React.useMemo(() => buildTodayAgenda(objectives, now), [objectives, now]);

  const dailyStatus = dailyGoal ? goalPaceStatus(dailyGoal, dayElapsedFraction(now)) : null;
  const weeklyStatus = weeklyGoal ? goalPaceStatus(weeklyGoal, weekElapsedFraction(now)) : null;

  const isEmpty =
    overdue.length === 0 &&
    dueToday.length === 0 &&
    focusBlocks.length === 0 &&
    calendarEvents.length === 0 &&
    inProgress.length === 0 &&
    onBoard.length === 0;

  const hasGoals = Boolean(dailyGoal || weeklyGoal);

  return (
    <Panel variant="glass" className="p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Today
        </p>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
          Your agenda
        </h2>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          hasGoals && "lg:grid-cols-[1.5fr_minmax(0,0.85fr)] lg:gap-8"
        )}
      >
        <div className="space-y-4">
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
                  color={o.color}
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
                  color={o.color}
                />
              ))}
            </AgendaSection>
          )}

          {focusBlocks.length > 0 && (
            <AgendaSection icon={Timer} label="Scheduled focus" count={focusBlocks.length}>
              {focusBlocks.map(({ objective, start, durationMinutes }) => (
                <AgendaLink
                  key={objective.id}
                  href="/pomodoro"
                  title={objective.title}
                  meta={`${formatTimeLabel(start.getHours() * 60 + start.getMinutes())} · ${durationMinutes}m`}
                  color={objective.color}
                  done={objective.status === "done"}
                />
              ))}
            </AgendaSection>
          )}

          {calendarEvents.length > 0 && (
            <AgendaSection icon={CalendarClock} label="Calendar events" count={calendarEvents.length}>
              {calendarEvents.map(({ objective, start, durationMinutes }) => (
                <AgendaLink
                  key={objective.id}
                  href="/calendar"
                  title={objective.title}
                  meta={`${formatTimeLabel(start.getHours() * 60 + start.getMinutes())} · ${durationMinutes}m`}
                  color={objective.color}
                  done={objective.status === "done"}
                />
              ))}
            </AgendaSection>
          )}

          {inProgress.length > 0 && (
            <AgendaSection icon={ListTodo} label="In progress" count={inProgress.length}>
              {inProgress.map((o) => (
                <AgendaLink
                  key={o.id}
                  href="/kanban"
                  title={o.title}
                  meta="On the board"
                  color={o.color}
                />
              ))}
            </AgendaSection>
          )}

          {onBoard.length > 0 && (
            <AgendaSection icon={ListTodo} label="On the board" count={onBoard.length}>
              {onBoard.map((o) => (
                <AgendaLink
                  key={o.id}
                  href="/kanban"
                  title={o.title}
                  meta={o.status === "in-progress" ? "In progress" : "To do"}
                  color={o.color}
                />
              ))}
            </AgendaSection>
          )}

          {isEmpty && (
            <p className="flex items-center gap-2 border-y border-dashed border-border/60 py-4 text-xs text-muted-foreground">
              <Sun className="h-3.5 w-3.5 shrink-0" />
              Clear day — add an objective on the board or schedule a focus block.
            </p>
          )}
        </div>

        {hasGoals && (
          <div className="space-y-3 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              Goal progress
            </p>
            {dailyGoal && dailyStatus && <GoalMini goal={dailyGoal} status={dailyStatus} />}
            {weeklyGoal && weeklyStatus && <GoalMini goal={weeklyGoal} status={weeklyStatus} />}
            <Link
              href="/goals"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Manage goals <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </Panel>
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
      <div className="mb-1 flex items-center gap-1.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "danger" ? "text-danger" : "text-muted-foreground"
          )}
        />
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.14em]",
            tone === "danger" ? "text-danger" : "text-foreground"
          )}
        >
          {label}
        </p>
        <span className="font-mono text-[10px] font-medium text-muted-foreground">· {count}</span>
      </div>
      {/* Negative horizontal margin so the hover wash and dividers reach the
          panel content width. */}
      <div className="-mx-2 divide-y divide-border sm:-mx-3">{children}</div>
    </div>
  );
}

function AgendaLink({
  href,
  title,
  meta,
  color,
  tone,
  done,
}: {
  href: string;
  title: string;
  meta: string;
  color?: string;
  tone?: "danger";
  done?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-2.5 px-2 py-2.5 transition-colors duration-200 sm:px-3",
        done
          ? "bg-success-muted/15 hover:bg-success-muted/25"
          : tone === "danger"
            ? "bg-danger-muted/10 hover:bg-danger-muted/20"
            : "hover:bg-card-hover"
      )}
    >
      {done ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <span
          aria-hidden
          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground"
          style={color ? { backgroundColor: color } : undefined}
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-foreground",
            done && "text-foreground/70 line-through"
          )}
        >
          {title}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>
      </div>
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
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate">{goal.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.08em]",
              status === "done" && "text-success",
              status === "on-track" && "text-muted-foreground",
              status === "behind" && "text-warning"
            )}
          >
            {PACE_LABEL[status]}
          </span>
          <span className="font-mono tabular-nums text-foreground/70">
            {goal.progress}/{goal.target}
            {goal.unit ? ` ${goal.unit}` : ""}
          </span>
        </span>
      </div>
      <ProgressBar
        value={percent}
        size="sm"
        className="mt-1.5"
        barClassName={status === "done" ? "bg-success" : undefined}
      />
    </div>
  );
}
