"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeTimerForObjective } from "@/lib/pomodoro-utils";
import {
  GRID_STEP_MINUTES,
  MINUTES_IN_DAY,
  PX_PER_MINUTE,
  clampMinutes,
  formatTimeLabel,
  isPastEvent,
  minutesSinceMidnight,
  type ScheduledEvent,
} from "@/lib/calendar-utils";
import { EventDetailPopover } from "@/components/calendar/event-detail-popover";
import { EventStatusIcons, eventAccentColor } from "@/components/calendar/event-status-icons";
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
  const [expanded, setExpanded] = React.useState(false);
  const [resizePreview, setResizePreview] = React.useState<number | null>(null);
  const resizePreviewRef = React.useRef<number | null>(null);
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

  function handleResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startDuration = event.durationMinutes;
    const maxDuration = Math.max(GRID_STEP_MINUTES, MINUTES_IN_DAY - minutesSinceMidnight(event.start));
    resizePreviewRef.current = startDuration;
    setResizePreview(startDuration);

    function onMove(ev: PointerEvent) {
      const deltaMinutes = (ev.clientY - startY) / PX_PER_MINUTE;
      const next = clampMinutes(startDuration + deltaMinutes, GRID_STEP_MINUTES, maxDuration);
      resizePreviewRef.current = next;
      setResizePreview(next);
    }
    function cleanup() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    }
    function onUp() {
      const preview = resizePreviewRef.current;
      cleanup();
      resizePreviewRef.current = null;
      setResizePreview(null);
      if (preview === null) return;
      const snapped = Math.max(
        GRID_STEP_MINUTES,
        Math.round(preview / GRID_STEP_MINUTES) * GRID_STEP_MINUTES
      );
      if (snapped !== startDuration) onResizeCommit(objective, snapped);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        resizePreviewRef.current = null;
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
  const startMinutes = minutesSinceMidnight(event.start);
  const endMinutes = startMinutes + durationMinutes;
  const top = startMinutes * PX_PER_MINUTE;
  const height = Math.max(22, durationMinutes * PX_PER_MINUTE);
  const gap = 3;
  const widthPct = 100 / cols;
  const compact = height < 40;

  const activeTimer = activeTimerForObjective(objective.id, timers);
  const isLive = activeTimer?.status === "running";
  const isDone = objective.status === "done";
  const isPast = isPastEvent(event) && !isDone;
  const accent = eventAccentColor(objective);

  return (
    <div
      ref={containerRef}
      className="absolute z-10"
      style={{
        top,
        height,
        left: `calc(${col * widthPct}% + ${gap}px)`,
        width: `calc(${widthPct}% - ${gap * 2}px)`,
        zIndex: expanded ? 40 : isDragging ? 30 : isHovered ? 20 : 10,
      }}
      onMouseEnter={() => onHover(objective.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={() => setExpanded((o) => !o)}
        style={{
          transform: transform ? CSS.Translate.toString(transform) : undefined,
          borderLeftColor: accent,
        }}
        className={cn(
          "group flex h-full w-full cursor-grab flex-col overflow-hidden rounded-md border border-l-[3px] px-2 py-1 text-left shadow-[var(--shadow-elevation-1)] transition-[background-color,border-color] duration-150 active:cursor-grabbing",
          isDone
            ? "border-success/40 bg-success-muted text-foreground"
            : isPast
              ? "border-warning/40 bg-warning-muted text-foreground"
              : "border-border-strong bg-card-hover text-foreground",
          isDragging && "opacity-50",
          isResizing && "ring-1 ring-border-strong",
          isHovered && !isDone && !isPast && "border-border-strong bg-foreground/[0.08]",
          isLive && "border-accent/50 bg-accent-muted",
          expanded && "ring-1 ring-border-strong"
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-0.5">
          {compact ? (
            <p className="flex items-center gap-1 truncate text-[11px] font-semibold leading-tight">
              {isDone && <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />}
              <span className="font-mono text-[10px] font-medium text-muted-foreground">
                {formatTimeLabel(startMinutes)}
              </span>
              <span className="min-w-0 truncate">{objective.title}</span>
              <EventStatusIcons objective={objective} event={event} />
            </p>
          ) : (
            <>
              <p className="flex items-center gap-1 truncate text-[11px] font-semibold leading-tight">
                {isDone && <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />}
                <span className="min-w-0 truncate">{objective.title}</span>
                <EventStatusIcons objective={objective} event={event} />
              </p>
              <p className="truncate font-mono text-[10px] leading-tight text-muted-foreground">
                {formatTimeLabel(startMinutes)}–{formatTimeLabel(endMinutes)}
              </p>
            </>
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
        {expanded && (
          <EventDetailPopover
            event={{ ...event, durationMinutes }}
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
