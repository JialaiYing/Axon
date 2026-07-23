"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatWeekdayShort, isSameDay, type ScheduledEvent } from "@/lib/calendar-utils";
import { TimeGrid } from "@/components/calendar/time-grid";
import type { ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective, PomodoroTimerInstance } from "@/types";

interface DayViewProps {
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

export function DayView({ currentDate, ...actions }: DayViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const now = new Date();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <TimeGrid
        days={[currentDate]}
        renderDayHeader={(day) => (
          <div className="flex flex-col items-center gap-1 py-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {formatWeekdayShort(day)}
            </span>
            <span
              className={cn(
                "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-mono text-[13px] font-semibold tabular-nums",
                isSameDay(day, now)
                  ? "bg-foreground text-background light:bg-black light:text-white"
                  : "text-foreground"
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
