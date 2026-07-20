"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeTimerForObjective } from "@/lib/pomodoro-utils";
import { formatTimeLabel, isPastEvent, minutesSinceMidnight, type ScheduledEvent } from "@/lib/calendar-utils";
import { EventActionsMenu } from "@/components/calendar/event-actions-menu";
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
  const [menuOpen, setMenuOpen] = React.useState(false);
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
    if (!menuOpen) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  const activeTimer = activeTimerForObjective(objective.id, timers);
  const isLive = activeTimer?.status === "running";
  const isDone = objective.status === "done";
  const isPast = isPastEvent(event) && !isDone;

  return (
    <div ref={containerRef} className="relative" style={{ zIndex: menuOpen ? 40 : isDragging ? 30 : 1 }}>
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
        onMouseEnter={() => onHover(objective.id)}
        onMouseLeave={() => onHover(null)}
        style={{ transform: transform ? CSS.Translate.toString(transform) : undefined }}
        className={cn(
          "flex w-full cursor-grab items-center gap-1 rounded-md border px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight transition-all duration-150 active:cursor-grabbing",
          isDone
            ? "border-success/30 bg-success-muted/40 text-success"
            : isPast
              ? "border-warning/30 bg-warning-muted/30 text-warning"
              : "border-accent/25 bg-accent-muted/40 text-accent",
          isDragging && "opacity-50",
          isHovered && "ring-1 ring-accent/40",
          isLive && "animate-pulse-glow ring-1 ring-accent/60"
        )}
      >
        {isDone && <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />}
        <span className="truncate">
          {formatTimeLabel(minutesSinceMidnight(event.start))} {objective.title}
        </span>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <EventActionsMenu
            objective={objective}
            timers={timers}
            onStartFocusSession={onStartFocusSession}
            onResumeTimer={onResumeTimer}
            onReschedule={(input) => onReschedule(objective, input)}
            onUnschedule={() => onUnschedule(objective)}
            onViewEdit={() => onViewEdit(objective)}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
