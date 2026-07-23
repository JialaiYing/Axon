"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getMonthGrid,
  isSameDay,
  toDateInputValue,
  type ScheduledEvent,
} from "@/lib/calendar-utils";
import { MonthEventChip } from "@/components/calendar/month-event-chip";
import type { ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective, PomodoroTimerInstance } from "@/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_DAY = 3;

interface MonthViewProps {
  currentDate: Date;
  events: ScheduledEvent[];
  timers: PomodoroTimerInstance[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onStartFocusSession: (objective: Objective) => void;
  onResumeTimer: (timerId: string) => void;
  onReschedule: (objective: Objective, input: ScheduleInput) => void;
  onUnschedule: (objective: Objective) => void;
  onViewEdit: (objective: Objective) => void;
  /** Click empty day / date number → create an event for that day. */
  onAddForDay: (day: Date) => void;
}

function DayCell({
  day,
  isCurrentMonth,
  isToday,
  events,
  ...actions
}: {
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ScheduledEvent[];
} & Pick<
  MonthViewProps,
  | "timers"
  | "hoveredId"
  | "onHover"
  | "onStartFocusSession"
  | "onResumeTimer"
  | "onReschedule"
  | "onUnschedule"
  | "onViewEdit"
  | "onAddForDay"
>) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${toDateInputValue(day)}` });
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? events : events.slice(0, MAX_VISIBLE_PER_DAY);
  const overflowCount = events.length - MAX_VISIBLE_PER_DAY;

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      aria-label={`Add event on ${toDateInputValue(day)}`}
      onClick={() => actions.onAddForDay(day)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          actions.onAddForDay(day);
        }
      }}
      className={cn(
        "group flex min-h-[5.75rem] cursor-pointer flex-col gap-0.5 border-b border-r border-border/50 p-1 transition-colors duration-150 light:border-border/80",
        !isCurrentMonth && "bg-foreground/[0.02] light:bg-black/[0.02]",
        isOver && "bg-foreground/[0.04] ring-1 ring-inset ring-border light:bg-black/[0.04]",
        "hover:bg-foreground/[0.03] light:hover:bg-black/[0.03]"
      )}
    >
      <div className="flex items-center">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full font-mono text-[11px] font-medium",
            isToday
              ? "bg-foreground text-background light:bg-black light:text-white"
              : isCurrentMonth
                ? "text-foreground"
                : "text-muted-foreground"
          )}
        >
          {day.getDate()}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {visible.map((event) => (
          <MonthEventChip
            key={event.objective.id}
            event={event}
            timers={actions.timers}
            isHovered={actions.hoveredId === event.objective.id}
            onHover={actions.onHover}
            onStartFocusSession={actions.onStartFocusSession}
            onResumeTimer={actions.onResumeTimer}
            onReschedule={actions.onReschedule}
            onUnschedule={actions.onUnschedule}
            onViewEdit={actions.onViewEdit}
          />
        ))}
        {overflowCount > 0 && !expanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            className="px-1 text-left text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            +{overflowCount} more
          </button>
        )}
        {expanded && events.length > MAX_VISIBLE_PER_DAY && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            className="px-1 text-left text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

export function MonthView({ currentDate, events, ...actions }: MonthViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const days = React.useMemo(() => getMonthGrid(currentDate), [currentDate]);
  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, ScheduledEvent[]>();
    for (const event of events) {
      const key = toDateInputValue(event.start);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.start.getTime() - b.start.getTime());
    return map;
  }, [events]);

  const now = new Date();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="overflow-hidden rounded-md border border-border/50 bg-background light:border-border light:bg-card"
    >
      <div className="grid grid-cols-7 border-b border-border/50 light:border-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1.5 py-1.5 text-center text-[11px] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            isCurrentMonth={day.getMonth() === currentDate.getMonth()}
            isToday={isSameDay(day, now)}
            events={eventsByDay.get(toDateInputValue(day)) ?? []}
            {...actions}
          />
        ))}
      </div>
    </motion.div>
  );
}
