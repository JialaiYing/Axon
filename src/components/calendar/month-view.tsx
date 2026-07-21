"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
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
  onOpenDay: (day: Date) => void;
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
  | "onOpenDay"
  | "onAddForDay"
>) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${toDateInputValue(day)}` });
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? events : events.slice(0, MAX_VISIBLE_PER_DAY);
  const hiddenCount = events.length - visible.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex min-h-[7.5rem] flex-col gap-1 border-b border-r border-border p-1.5 transition-colors duration-200",
        !isCurrentMonth && "bg-surface/30",
        isOver && "bg-accent-muted/20 shadow-[inset_0_0_0_1px_rgba(94,106,210,0.3)]"
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => actions.onOpenDay(day)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium transition-colors duration-150",
            isToday
              ? "bg-accent text-accent-foreground shadow-[0_0_8px_rgba(94,106,210,0.5)]"
              : isCurrentMonth
                ? "text-foreground hover:bg-card"
                : "text-muted-foreground hover:bg-card"
          )}
        >
          {day.getDate()}
        </button>
        <button
          type="button"
          aria-label="Add objective to this day"
          onClick={() => actions.onAddForDay(day)}
          className="flex h-5 w-5 items-center justify-center rounded-md text-muted opacity-0 transition-all duration-150 hover:bg-card hover:text-accent group-hover:opacity-100"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1">
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
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="px-1 text-left text-[10px] font-medium text-muted-foreground transition-colors hover:text-accent"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}

export function MonthView({ currentDate, events, ...actions }: MonthViewProps) {
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]"
    >
      <div className="grid grid-cols-7 border-b border-border bg-surface/60">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
