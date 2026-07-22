"use client";

import { motion } from "framer-motion";
import { CalendarClock, Eye, MapPin, Play, Repeat, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeTimerForObjective } from "@/lib/pomodoro-utils";
import {
  formatDayTitle,
  formatTimeLabel,
  minutesSinceMidnight,
  type ScheduledEvent,
} from "@/lib/calendar-utils";
import { SchedulePopover, type ScheduleInput } from "@/components/calendar/schedule-popover";
import { EventStatusIcons, eventAccentColor } from "@/components/calendar/event-status-icons";
import type { Objective, PomodoroTimerInstance } from "@/types";

const menuItemClass =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors duration-150 hover:bg-card-hover";

interface EventDetailPopoverProps {
  event: ScheduledEvent;
  timers: PomodoroTimerInstance[];
  align?: "start" | "end";
  onStartFocusSession: (objective: Objective) => void;
  onResumeTimer: (timerId: string) => void;
  onReschedule: (input: ScheduleInput) => void;
  onUnschedule: () => void;
  onViewEdit: () => void;
  onClose: () => void;
}

/**
 * Click-to-expand panel for a calendar block: glance summary first, then
 * logistical details (location / notes / description) when present, then actions.
 */
export function EventDetailPopover({
  event,
  timers,
  align = "start",
  onStartFocusSession,
  onResumeTimer,
  onReschedule,
  onUnschedule,
  onViewEdit,
  onClose,
}: EventDetailPopoverProps) {
  const { objective, start, durationMinutes } = event;
  const activeTimer = activeTimerForObjective(objective.id, timers);
  const startMinutes = minutesSinceMidnight(start);
  const endMinutes = startMinutes + durationMinutes;
  const accent = eventAccentColor(objective);
  const isCalendarOnly = objective.showOnKanban === false;
  const location = isCalendarOnly ? objective.location?.trim() : undefined;
  const description = objective.description?.trim();
  const notes = objective.notes?.trim();
  const hasLogistics = Boolean(location || description || notes);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(
        "absolute top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-overlay)]",
        align === "end" ? "right-0" : "left-0"
      )}
    >
      <div className="border-b border-border px-3 py-2.5" style={{ borderLeft: `3px solid ${accent}` }}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{objective.title}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {formatTimeLabel(startMinutes)}–{formatTimeLabel(endMinutes)}
              <span className="text-muted"> · {formatDayTitle(start)}</span>
            </p>
          </div>
          <EventStatusIcons objective={objective} event={event} className="mt-0.5" />
        </div>
        {objective.recurrence && objective.recurrence !== "none" && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Repeat className="h-3 w-3" />
            Repeats {objective.recurrence}
          </p>
        )}
      </div>

      {hasLogistics && (
        <div className="space-y-2 border-b border-border px-3 py-2.5">
          {location && (
            <p className="flex items-start gap-2 text-xs text-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 break-words">{location}</span>
            </p>
          )}
          {description && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 whitespace-pre-wrap break-words">{description}</span>
            </p>
          )}
          {notes && notes !== description && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="min-w-0 whitespace-pre-wrap break-words">{notes}</span>
            </p>
          )}
        </div>
      )}

      <div className="p-1.5">
        {activeTimer?.status === "running" ? (
          <div className="mx-0.5 mb-0.5 rounded-md bg-accent-muted px-2.5 py-2 text-xs font-medium text-accent">
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
          View &amp; edit
        </button>
      </div>
    </motion.div>
  );
}
