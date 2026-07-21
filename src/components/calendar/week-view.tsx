"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getWeekDays, isSameDay, type ScheduledEvent } from "@/lib/calendar-utils";
import { TimeGrid } from "@/components/calendar/time-grid";
import type { ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective, PomodoroTimerInstance } from "@/types";

interface WeekViewProps {
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
  onAddAt: (day: Date, minutes: number) => void;
}

export function WeekView({ currentDate, ...actions }: WeekViewProps) {
  const days = React.useMemo(() => getWeekDays(currentDate), [currentDate]);
  const now = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <TimeGrid
        days={days}
        renderDayHeader={(day) => (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                isSameDay(day, now) ? "bg-accent text-accent-foreground shadow-[0_0_8px_rgba(94,106,210,0.5)]" : "text-foreground"
              )}
            >
              {day.getDate()}
            </span>
          </div>
        )}
        {...actions}
      />
    </motion.div>
  );
}
