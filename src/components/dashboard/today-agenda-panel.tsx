"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ListTodo,
  Plus,
  Sun,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDueDate } from "@/lib/kanban-utils";
import { formatTimeLabel } from "@/lib/calendar-utils";
import { buildTodayAgenda } from "@/lib/dashboard-agenda";
import { colorForSubject } from "@/lib/subject-colors";
import type { Objective } from "@/types";
import { cn } from "@/lib/utils";

interface TodayAgendaPanelProps {
  objectives: Objective[];
  /** Due Leitner cards — cue only when > 0; omit or 0 hides it. */
  dueCount?: number;
  /** When a Pomodoro is active, empty-state CTA mirrors header ("Open timer"). */
  timerActive?: boolean;
  className?: string;
}

/**
 * Glance-and-go "Today" section for the Dashboard.
 * Linear-inspired: flat bordered module; light uses card on cool page canvas.
 * Backup: today-agenda-panel.pre-light-dashboard.bak
 */
export function TodayAgendaPanel({
  objectives,
  dueCount = 0,
  timerActive = false,
  className,
}: TodayAgendaPanelProps) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const {
    overdue,
    dueToday,
    focusBlocks,
    calendarEvents,
    inProgress,
    onBoard,
    more,
  } = React.useMemo(() => buildTodayAgenda(objectives, now), [objectives, now]);

  const isEmpty =
    overdue.length === 0 &&
    dueToday.length === 0 &&
    focusBlocks.length === 0 &&
    calendarEvents.length === 0 &&
    inProgress.length === 0 &&
    onBoard.length === 0;

  return (
    <section
      className={cn(
        "flex flex-col rounded-md border border-border/50 p-5 light:border-border light:bg-card sm:p-6",
        className
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[14px] font-medium text-muted">Today</p>
          <h2 className="mt-0.5 text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
            Your agenda
          </h2>
        </div>
        {dueCount > 0 && (
          <Link
            href="/flashcards?study=due"
            className="mt-1 shrink-0 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {dueCount === 1 ? "1 card due" : `${dueCount} cards due`}
          </Link>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-5">
        {overdue.length > 0 && (
          <AgendaSection
            icon={AlertTriangle}
            label="Overdue"
            count={overdue.length + more.overdue}
            tone="danger"
          >
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
                color={colorForSubject(o.subject)}
                tone="danger"
              />
            ))}
            <MoreLink count={more.overdue} href="/kanban" />
          </AgendaSection>
        )}

        {dueToday.length > 0 && (
          <AgendaSection
            icon={ListTodo}
            label="Due today"
            count={dueToday.length + more.dueToday}
          >
            {dueToday.map((o) => (
              <AgendaLink
                key={o.id}
                href="/kanban"
                title={o.title}
                meta="Due today"
                color={colorForSubject(o.subject)}
              />
            ))}
            <MoreLink count={more.dueToday} href="/kanban" />
          </AgendaSection>
        )}

        {focusBlocks.length > 0 || more.focusBlocks > 0 ? (
          <AgendaSection
            icon={Timer}
            label="Scheduled focus"
            count={focusBlocks.length + more.focusBlocks}
          >
            {focusBlocks.map(({ objective, start, durationMinutes }) => (
              <AgendaLink
                key={objective.id}
                href="/pomodoro"
                title={objective.title}
                meta={`${formatTimeLabel(start.getHours() * 60 + start.getMinutes())} · ${durationMinutes}m`}
                color={colorForSubject(objective.subject)}
                done={objective.status === "done"}
              />
            ))}
            <MoreLink count={more.focusBlocks} href="/calendar" />
          </AgendaSection>
        ) : null}

        {calendarEvents.length > 0 || more.calendarEvents > 0 ? (
          <AgendaSection
            icon={CalendarClock}
            label="Calendar events"
            count={calendarEvents.length + more.calendarEvents}
          >
            {calendarEvents.map(({ objective, start, durationMinutes }) => (
              <AgendaLink
                key={objective.id}
                href="/calendar"
                title={objective.title}
                meta={`${formatTimeLabel(start.getHours() * 60 + start.getMinutes())} · ${durationMinutes}m`}
                color={colorForSubject(objective.subject)}
                done={objective.status === "done"}
              />
            ))}
            <MoreLink count={more.calendarEvents} href="/calendar" />
          </AgendaSection>
        ) : null}

        {inProgress.length > 0 && (
          <AgendaSection
            icon={ListTodo}
            label="In progress"
            count={inProgress.length + more.inProgress}
          >
            {inProgress.map((o) => (
              <AgendaLink
                key={o.id}
                href="/kanban"
                title={o.title}
                meta="On the board"
                color={colorForSubject(o.subject)}
              />
            ))}
            <MoreLink count={more.inProgress} href="/kanban" />
          </AgendaSection>
        )}

        {onBoard.length > 0 && (
          <AgendaSection
            icon={ListTodo}
            label="On the board"
            count={onBoard.length + more.onBoard}
          >
            {onBoard.map((o) => (
              <AgendaLink
                key={o.id}
                href="/kanban"
                title={o.title}
                meta={o.status === "in-progress" ? "In progress" : "To do"}
                color={colorForSubject(o.subject)}
              />
            ))}
            <MoreLink count={more.onBoard} href="/kanban" />
          </AgendaSection>
        )}

        {isEmpty && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
            <Sun className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <div>
              <p className="text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]">
                Clear day
              </p>
              <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-muted-foreground">
                Add an objective on the board or start a focus block.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/kanban?new=1"
                className="inline-flex cursor-pointer items-center gap-1 text-[14px] font-medium text-foreground transition-colors hover:text-muted"
              >
                <Plus className="h-3.5 w-3.5" /> New objective
              </Link>
              <Button asChild size="sm" className="cursor-pointer shadow-none">
                <Link href="/pomodoro" className="inline-flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5" />
                  {timerActive ? "Open timer" : "Start focus"}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MoreLink({ count, href }: { count: number; href: string }) {
  if (count <= 0) return null;
  return (
    <Link
      href={href}
      className="block px-1.5 py-1.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-2"
    >
      +{count} more
    </Link>
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
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "danger" ? "text-danger" : "text-muted"
          )}
        />
        <p
          className={cn(
            "text-[14px] font-medium",
            tone === "danger" ? "text-danger" : "text-muted"
          )}
        >
          {label}
        </p>
        <span className="font-mono text-[14px] font-medium tabular-nums text-muted">· {count}</span>
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
            "truncate text-[14px] font-medium text-foreground",
            done && "text-foreground/70 line-through"
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[14px] text-muted-foreground">{meta}</p>
      </div>
    </Link>
  );
}
