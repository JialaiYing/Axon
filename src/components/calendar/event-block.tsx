"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeTimerForObjective } from "@/lib/pomodoro-utils";
import {
  GRID_STEP_MINUTES,
  MINUTES_IN_DAY,
  PX_PER_MINUTE,
  clampMinutes,
  formatDurationLabel,
  formatTimeLabel,
  isPastEvent,
  minutesSinceMidnight,
  type ScheduledEvent,
} from "@/lib/calendar-utils";
import { EventActionsMenu } from "@/components/calendar/event-actions-menu";
import type { ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective, PomodoroTimerInstance } from "@/types";

interface EventBlockProps {
  event: ScheduledEvent;
  col: number;
  cols: number;
  timers: PomodoroTimerInstance[];
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onStartFocusSession: (objective: Objective) => void;
  onResumeTimer: (timerId: string) => void;
  onReschedule: (objective: Objective, input: ScheduleInput) => void;
  onUnschedule: (objective: Objective) => void;
  onViewEdit: (objective: Objective) => void;
  onResizeCommit: (objective: Objective, newDurationMinutes: number) => void;
}

/** Absolute-positioned, draggable + resizable block for the week/day time grid. */
export function EventBlock({
  event,
  col,
  cols,
  timers,
  isHovered,
  onHover,
  onStartFocusSession,
  onResumeTimer,
  onReschedule,
  onUnschedule,
  onViewEdit,
  onResizeCommit,
}: EventBlockProps) {
  const { objective } = event;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [resizePreview, setResizePreview] = React.useState<number | null>(null);
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

  function handleResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startDuration = event.durationMinutes;
    const maxDuration = Math.max(GRID_STEP_MINUTES, MINUTES_IN_DAY - minutesSinceMidnight(event.start));
    setResizePreview(startDuration);

    function onMove(ev: PointerEvent) {
      const deltaMinutes = (ev.clientY - startY) / PX_PER_MINUTE;
      setResizePreview(clampMinutes(startDuration + deltaMinutes, GRID_STEP_MINUTES, maxDuration));
    }
    function cleanup() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    }
    function onUp() {
      setResizePreview((preview) => {
        if (preview !== null) {
          const snapped = Math.max(GRID_STEP_MINUTES, Math.round(preview / GRID_STEP_MINUTES) * GRID_STEP_MINUTES);
          if (snapped !== startDuration) onResizeCommit(objective, snapped);
        }
        return null;
      });
      cleanup();
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setResizePreview(null);
        cleanup();
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
  }

  const durationMinutes = resizePreview ?? event.durationMinutes;
  const isResizing = resizePreview !== null;
  const top = minutesSinceMidnight(event.start) * PX_PER_MINUTE;
  const height = Math.max(20, durationMinutes * PX_PER_MINUTE);
  const gap = 3;
  const widthPct = 100 / cols;

  const activeTimer = activeTimerForObjective(objective.id, timers);
  const isLive = activeTimer?.status === "running";
  const isPaused = activeTimer?.status === "paused";
  const isDone = objective.status === "done";
  const isPast = isPastEvent(event) && !isDone;
  const color = objective.color ?? "var(--color-accent)";

  return (
    <div
      ref={containerRef}
      className="absolute z-10"
      style={{
        top,
        height,
        left: `calc(${col * widthPct}% + ${gap}px)`,
        width: `calc(${widthPct}% - ${gap * 2}px)`,
        zIndex: menuOpen ? 40 : isDragging ? 30 : isHovered ? 20 : 10,
      }}
      onMouseEnter={() => onHover(objective.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={() => setMenuOpen((o) => !o)}
        style={{
          transform: transform ? CSS.Translate.toString(transform) : undefined,
          borderColor: isHovered ? color : undefined,
        }}
        className={cn(
          "group flex h-full w-full cursor-grab flex-col overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm transition-shadow duration-150 active:cursor-grabbing",
          isDone
            ? "border-success/30 bg-success-muted/40"
            : isPast
              ? "border-warning/30 bg-warning-muted/30"
              : "border-accent/25 bg-accent-muted/40",
          isDragging && "opacity-50",
          isResizing && "shadow-lg ring-1 ring-accent/40",
          isHovered && "shadow-[0_4px_16px_-6px_rgba(0,0,0,0.4)] ring-1 ring-accent/30",
          isLive && "animate-pulse-glow ring-2 ring-accent/60"
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="truncate text-[11px] font-semibold leading-tight text-foreground">
            {isDone && <CheckCircle2 className="mr-1 inline h-3 w-3 text-success" />}
            {objective.title}
          </p>
          {height > 32 && (
            <p className="truncate text-[10px] leading-tight text-muted-foreground">
              {formatTimeLabel(minutesSinceMidnight(event.start))} · {formatDurationLabel(durationMinutes)}
            </p>
          )}
          {height > 52 && (
            <span className="mt-1 inline-flex w-fit items-center rounded-full border border-border/60 bg-background/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
              {objective.subject}
            </span>
          )}
        </div>

        <div
          onPointerDown={handleResizePointerDown}
          className="absolute inset-x-0 bottom-0 h-2 cursor-row-resize opacity-0 transition-opacity group-hover:opacity-100"
        >
          <div className="mx-auto mt-1 h-0.5 w-6 rounded-full bg-foreground/30" />
        </div>
      </div>

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
