"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ListTodo,
  Sun,
  Timer,
} from "lucide-react";
import { formatDueDate } from "@/lib/kanban-utils";
import { formatTimeLabel } from "@/lib/calendar-utils";
import { buildTodayAgenda } from "@/lib/dashboard-agenda";
import type { Objective } from "@/types";
import { cn } from "@/lib/utils";

interface TodayAgendaPanelProps {
  objectives: Objective[];
}

/**
 * Glance-and-go "Today" section for the Dashboard.
 * Linear-inspired: flat bordered module; light uses card on cool page canvas.
 * Backup: today-agenda-panel.pre-light-dashboard.bak
 */
export function TodayAgendaPanel({ objectives }: TodayAgendaPanelProps) {
  const now = React.useMemo(() => new Date(), []);

  const {
    overdue,
    dueToday,
    focusBlocks,
    calendarEvents,
    inProgress,
    onBoard,
  } = React.useMemo(() => buildTodayAgenda(objectives, now), [objectives, now]);

  const isEmpty =
    overdue.length === 0 &&
    dueToday.length === 0 &&
    focusBlocks.length === 0 &&
    calendarEvents.length === 0 &&
    inProgress.length === 0 &&
    onBoard.length === 0;

  return (
    <section className="rounded-md border border-border/50 p-4 light:border-border light:bg-card">
      <div className="mb-3">
        <p className="text-[14px] font-medium text-muted">Today</p>
        <h2 className="mt-0.5 text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
          Your agenda
        </h2>
      </div>

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
          <p className="flex items-center gap-2 border-y border-dashed border-border/50 py-3 text-[12px] text-muted-foreground light:border-border">
            <Sun className="h-3.5 w-3.5 shrink-0" />
            Clear day — add an objective on the board or schedule a focus block.
          </p>
        )}
      </div>
    </section>
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
            tone === "danger" ? "text-danger" : "text-muted"
          )}
        />
        <p
          className={cn(
            "text-[11px] font-medium",
            tone === "danger" ? "text-danger" : "text-muted"
          )}
        >
          {label}
        </p>
        <span className="font-mono text-[10px] font-medium text-muted">· {count}</span>
      </div>
      {/* Negative horizontal margin so the hover wash and dividers reach the
          panel content width. */}
      <div className="-mx-2 divide-y divide-border/50 light:divide-border sm:-mx-3">{children}</div>
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
        "flex items-center gap-2.5 px-1.5 py-1.5 transition-colors duration-150 sm:px-2",
        done
          ? "bg-success-muted/10 hover:bg-success-muted/20"
          : tone === "danger"
            ? "bg-danger-muted/10 hover:bg-danger-muted/15"
            : "hover:bg-wash"
      )}
    >
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground"
          style={color ? { backgroundColor: color } : undefined}
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13px] font-medium text-foreground",
            done && "text-foreground/70 line-through"
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{meta}</p>
      </div>
    </Link>
  );
}
