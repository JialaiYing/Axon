"use client";

import { motion } from "framer-motion";
import { TimeGrid } from "@/components/calendar/time-grid";
import type { ScheduledEvent } from "@/lib/calendar-utils";
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <TimeGrid days={[currentDate]} {...actions} />
    </motion.div>
  );
}
