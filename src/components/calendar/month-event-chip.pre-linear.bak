"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeTimerForObjective } from "@/lib/pomodoro-utils";
import {
  formatTimeLabel,
  isPastEvent,
  minutesSinceMidnight,
  type ScheduledEvent,
} from "@/lib/calendar-utils";
import { EventDetailPopover } from "@/components/calendar/event-detail-popover";
import { EventStatusIcons, eventAccentColor } from "@/components/calendar/event-status-icons";
import type { ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective, PomodoroTimerInstance } from "@/types";

interface MonthEventChipProps {
  event: ScheduledEvent;
  timers: PomodoroTimerInstance[];
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onStartFocusSession: (objective: Objective) => void;
  onResumeTimer: (timerId: string) => void;
  onReschedule: (objective: Objective, input: ScheduleInput) => void;
  onUnschedule: (objective: Objective) => void;
  onViewEdit: (objective: Objective) => void;
}

export function MonthEventChip({
  event,
  timers,
  isHovered,
  onHover,
  onStartFocusSession,
  onResumeTimer,
  onReschedule,
  onUnschedule,
  onViewEdit,
}: MonthEventChipProps) {
  const { objective } = event;
  const [expanded, setExpanded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event:${objective.id}`,
    data: {
      objective,
      originalStart: event.start.toISOString(),
      durationMinutes: event.durationMinutes,
    },
  });

  React.useEffect(() => {
    if (!expanded) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [expanded]);

  const activeTimer = activeTimerForObjective(objective.id, timers);
  const isLive = activeTimer?.status === "running";
  const isDone = objective.status === "done";
  const isPast = isPastEvent(event) && !isDone;
  const accent = eventAccentColor(objective);
  const startMinutes = minutesSinceMidnight(event.start);
  const endMinutes = startMinutes + event.durationMinutes;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ zIndex: expanded ? 40 : isDragging ? 30 : 1 }}
    >
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((o) => !o);
        }}
        onMouseEnter={() => onHover(objective.id)}
        onMouseLeave={() => onHover(null)}
        className={cn(
          "flex w-full cursor-grab items-center gap-1 rounded-md border border-l-[3px] px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight transition-colors duration-150 active:cursor-grabbing",
          isDone
            ? "border-success/40 bg-success-muted text-foreground"
            : isPast
              ? "border-warning/40 bg-warning-muted text-foreground"
              : "border-border-strong bg-card-hover text-foreground hover:bg-foreground/[0.08]",
          isDragging && "opacity-50",
          isHovered && !isDone && !isPast && "bg-foreground/[0.08]",
          isLive && "border-accent/50 bg-accent-muted",
          expanded && "ring-1 ring-border-strong"
        )}
        style={{
          transform: transform ? CSS.Translate.toString(transform) : undefined,
          borderLeftColor: accent,
        }}
      >
        {isDone && <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-success" />}
        <span className="min-w-0 flex-1 truncate">
          <span className="font-mono text-muted-foreground">
            {formatTimeLabel(startMinutes)}–{formatTimeLabel(endMinutes)}
          </span>{" "}
          {objective.title}
        </span>
        <EventStatusIcons objective={objective} event={event} />
      </button>

      <AnimatePresence>
        {expanded && (
          <EventDetailPopover
            event={event}
            timers={timers}
            onStartFocusSession={onStartFocusSession}
            onResumeTimer={onResumeTimer}
            onReschedule={(input) => onReschedule(objective, input)}
            onUnschedule={() => onUnschedule(objective)}
            onViewEdit={() => onViewEdit(objective)}
            onClose={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
