"use client";

import { motion } from "framer-motion";
import { CalendarClock, Eye, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeTimerForObjective } from "@/lib/pomodoro-utils";
import { SchedulePopover, type ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective, PomodoroTimerInstance } from "@/types";

const menuItemClass =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors duration-150 hover:bg-card-hover";

interface EventActionsMenuProps {
  objective: Objective;
  timers: PomodoroTimerInstance[];
  align?: "start" | "end";
  onStartFocusSession: (objective: Objective) => void;
  onResumeTimer: (timerId: string) => void;
  onReschedule: (input: ScheduleInput) => void;
  onUnschedule: () => void;
  onViewEdit: () => void;
  onClose: () => void;
}

/** The single click-to-open menu for a scheduled event — reused by the week/day grid
 *  block and the month chip so there's exactly one place these actions live. */
export function EventActionsMenu({
  objective,
  timers,
  align = "start",
  onStartFocusSession,
  onResumeTimer,
  onReschedule,
  onUnschedule,
  onViewEdit,
  onClose,
}: EventActionsMenuProps) {
  const activeTimer = activeTimerForObjective(objective.id, timers);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(
        "absolute top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card/95 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_20px_48px_-16px_rgba(0,0,0,0.65)] backdrop-blur-xl",
        align === "end" ? "right-0" : "left-0"
      )}
    >
      <div className="px-2.5 py-1.5">
        <p className="truncate text-sm font-semibold text-foreground">{objective.title}</p>
      </div>

      {activeTimer?.status === "running" ? (
        <div className="mx-1 mb-1 flex items-center gap-1.5 rounded-md bg-accent-muted/40 px-2.5 py-2 text-xs font-medium text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          Studying now
        </div>
      ) : activeTimer?.status === "paused" ? (
        <button
          type="button"
          onClick={() => {
            onResumeTimer(activeTimer.id);
            onClose();
          }}
          className={menuItemClass}
        >
          <Play className="h-3.5 w-3.5 text-accent" />
          Resume active session
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            onStartFocusSession(objective);
            onClose();
          }}
          className={menuItemClass}
        >
          <Play className="h-3.5 w-3.5 text-accent" />
          Start focus session
        </button>
      )}

      <SchedulePopover
        objective={objective}
        onSchedule={onReschedule}
        onUnschedule={() => {
          onUnschedule();
          onClose();
        }}
        align={align}
        trigger={({ toggle }) => (
          <button type="button" onClick={toggle} className={menuItemClass}>
            <CalendarClock className="h-3.5 w-3.5" />
            Edit time
          </button>
        )}
      />

      <button
        type="button"
        onClick={() => {
          onViewEdit();
          onClose();
        }}
        className={menuItemClass}
      >
        <Eye className="h-3.5 w-3.5" />
        View & edit objective
      </button>
    </motion.div>
  );
}
