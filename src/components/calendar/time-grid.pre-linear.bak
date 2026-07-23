"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  GRID_STEP_MINUTES,
  HOUR_HEIGHT_PX,
  PX_PER_MINUTE,
  isSameDay,
  layoutOverlaps,
  minutesSinceMidnight,
  snapMinutes,
  toDateInputValue,
  type ScheduledEvent,
} from "@/lib/calendar-utils";
import { EventBlock } from "@/components/calendar/event-block";
import type { ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective, PomodoroTimerInstance } from "@/types";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GUTTER_WIDTH = 56;

interface TimeGridProps {
  days: Date[];
  events: ScheduledEvent[];
  timers: PomodoroTimerInstance[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onStartFocusSession: (objective: Objective) => void;
  onResumeTimer: (timerId: string) => void;
  onReschedule: (objective: Objective, input: ScheduleInput) => void;
  onUnschedule: (objective: Objective) => void;
  onViewEdit: (objective: Objective) => void;
  onAddAt: (day: Date, minutes: number) => void;
  /** Renders a header cell above each day column (weekday/date, "today" pill, etc). */
  renderDayHeader?: (day: Date) => React.ReactNode;
}

function DayColumn({
  day,
  events,
  timers,
  hoveredId,
  onHover,
  onStartFocusSession,
  onResumeTimer,
  onReschedule,
  onUnschedule,
  onViewEdit,
  onAddAt,
}: Pick<
  TimeGridProps,
  | "events"
  | "timers"
  | "hoveredId"
  | "onHover"
  | "onStartFocusSession"
  | "onResumeTimer"
  | "onReschedule"
  | "onUnschedule"
  | "onViewEdit"
  | "onAddAt"
> & { day: Date }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${toDateInputValue(day)}` });
  const laidOut = React.useMemo(() => layoutOverlaps(events), [events]);

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = snapMinutes((e.clientY - rect.top) / PX_PER_MINUTE, GRID_STEP_MINUTES);
    onAddAt(day, Math.max(0, minutes));
  }

  return (
    <div
      ref={setNodeRef}
      onClick={handleColumnClick}
      className={cn(
        "relative flex-1 border-r border-border transition-colors duration-150",
        isOver && "bg-accent-muted/10"
      )}
      style={{ height: 24 * HOUR_HEIGHT_PX }}
    >
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-border/70"
          style={{ top: hour * HOUR_HEIGHT_PX }}
        />
      ))}
      {laidOut.map(({ event, col, cols }) => (
        <EventBlock
          key={event.objective.id}
          event={event}
          col={col}
          cols={cols}
          timers={timers}
          isHovered={hoveredId === event.objective.id}
          onHover={onHover}
          onStartFocusSession={onStartFocusSession}
          onResumeTimer={onResumeTimer}
          onReschedule={onReschedule}
          onUnschedule={onUnschedule}
          onViewEdit={onViewEdit}
          onResizeCommit={(objective, minutes) => onReschedule(objective, { start: event.start.toISOString(), durationMinutes: minutes })}
        />
      ))}
    </div>
  );
}

/** Shared hour-gridded, droppable time surface for the Week and Day views. */
export function TimeGrid({ days, events, renderDayHeader, ...actions }: TimeGridProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const now = new Date();
  const hasScrolledRef = React.useRef(false);

  React.useEffect(() => {
    if (hasScrolledRef.current || !scrollRef.current) return;
    hasScrolledRef.current = true;
    const nowMinutes = minutesSinceMidnight(now);
    scrollRef.current.scrollTop = Math.max(0, nowMinutes * PX_PER_MINUTE - HOUR_HEIGHT_PX * 2.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, ScheduledEvent[]>();
    for (const event of events) {
      const key = toDateInputValue(event.start);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const showNowLine = days.some((d) => isSameDay(d, now));
  const nowTop = minutesSinceMidnight(now) * PX_PER_MINUTE;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
      {renderDayHeader && (
        <div className="flex border-b border-border bg-surface/60">
          <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
          {days.map((day) => (
            <div key={day.toISOString()} className="flex-1 border-r border-border py-2 text-center last:border-r-0">
              {renderDayHeader(day)}
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="max-h-[calc(100vh-16rem)] overflow-y-auto">
        <div className="flex">
          <div className="relative shrink-0" style={{ width: GUTTER_WIDTH, height: 24 * HOUR_HEIGHT_PX }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground"
                style={{ top: hour * HOUR_HEIGHT_PX }}
              >
                {hour === 0 ? "" : new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: "numeric" })}
              </div>
            ))}
          </div>

          <div className="relative flex flex-1">
            {days.map((day) => (
              <DayColumn
                key={day.toISOString()}
                day={day}
                events={eventsByDay.get(toDateInputValue(day)) ?? []}
                {...actions}
              />
            ))}

            {showNowLine && (
              <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowTop }}>
                <div className="flex items-center">
                  <span className="-ml-1 h-2 w-2 rounded-full bg-danger" />
                  <div className="h-px flex-1 bg-danger/70" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
