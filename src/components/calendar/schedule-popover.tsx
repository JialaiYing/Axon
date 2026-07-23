"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { combineDateAndTime, toDateInputValue, toTimeInputValue } from "@/lib/calendar-utils";
import type { Objective } from "@/types";

export interface ScheduleInput {
  start: string;
  durationMinutes: number;
}

interface SchedulePopoverProps {
  objective: Objective;
  onSchedule: (input: ScheduleInput) => void;
  onUnschedule?: () => void;
  trigger: (state: { open: boolean; toggle: () => void }) => React.ReactNode;
  align?: "start" | "end";
  /** Pre-fills the date/time when opening a fresh (unscheduled) objective — e.g. the slot just clicked on the Calendar. */
  defaultStart?: Date;
  className?: string;
}

function nextHalfHour(from: Date): Date {
  const d = new Date(from);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  d.setMinutes(mins < 30 ? 30 : 0);
  if (mins >= 30) d.setHours(d.getHours() + 1);
  return d;
}

const POPOVER_WIDTH = 288; // w-72

export function SchedulePopover({
  objective,
  onSchedule,
  onUnschedule,
  trigger,
  align = "start",
  defaultStart,
  className,
}: SchedulePopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLFormElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const isScheduled = Boolean(objective.scheduledStart);

  const initialAnchor = React.useMemo(() => {
    if (objective.scheduledStart) return new Date(objective.scheduledStart);
    return defaultStart ?? nextHalfHour(new Date());
  }, [objective.scheduledStart, defaultStart]);

  const defaultDuration =
    objective.scheduledDurationMinutes ??
    (objective.estimatedStudyTime && objective.estimatedStudyTime > 0 ? objective.estimatedStudyTime : 30);

  const [date, setDate] = React.useState(() => toDateInputValue(initialAnchor));
  const [time, setTime] = React.useState(() => toTimeInputValue(initialAnchor));
  const [duration, setDuration] = React.useState(defaultDuration);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

  const updatePosition = React.useCallback(() => {
    const triggerEl = containerRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const gap = 8;
    const left =
      align === "end"
        ? Math.min(rect.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH - 8)
        : Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8));
    // Prefer below the trigger; flip above if it would overflow the viewport.
    const estimatedHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const top =
      spaceBelow < estimatedHeight && rect.top > estimatedHeight
        ? Math.max(8, rect.top - estimatedHeight - gap)
        : rect.bottom + gap;
    setCoords({ top, left: Math.max(8, left) });
  }, [align]);

  React.useLayoutEffect(() => {
    if (!open) return;
    setDate(toDateInputValue(initialAnchor));
    setTime(toTimeInputValue(initialAnchor));
    setDuration(defaultDuration);
    setError(null);
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onReposition() {
      updatePosition();
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updatePosition]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) {
      setError("Pick a date and start time.");
      return;
    }
    const start = combineDateAndTime(date, time);
    if (Number.isNaN(start.getTime())) {
      setError("That date/time isn't valid.");
      return;
    }
    const safeDuration = Math.min(1440, Math.max(5, Math.round(duration) || 30));
    onSchedule({ start: start.toISOString(), durationMinutes: safeDuration });
    setOpen(false);
  }

  const panel =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open && coords && (
          <motion.form
            key="schedule-popover"
            ref={panelRef}
            onSubmit={handleSave}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.21, 0.47, 0.32, 0.98] }}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: POPOVER_WIDTH }}
            className="z-[80] rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-overlay)]"
          >
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-accent" />
              {isScheduled ? "Reschedule" : "Schedule"}
              <span className="truncate text-muted-foreground">· {objective.title}</span>
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`sched-date-${objective.id}`}>Date</Label>
                <Input
                  id={`sched-date-${objective.id}`}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor={`sched-time-${objective.id}`}>Start time</Label>
                  <Input
                    id={`sched-time-${objective.id}`}
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`sched-duration-${objective.id}`}>Duration (min)</Label>
                  <Input
                    id={`sched-duration-${objective.id}`}
                    type="number"
                    min={5}
                    max={1440}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    onPointerDown={(e) => e.stopPropagation()}
                    required
                  />
                </div>
              </div>
              {objective.estimatedStudyTime ? (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  Estimated {objective.estimatedStudyTime}m is used as the default block length.
                </p>
              ) : null}
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              {isScheduled && onUnschedule ? (
                <button
                  type="button"
                  onClick={() => {
                    onUnschedule();
                    setOpen(false);
                  }}
                  className="text-[11px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-danger hover:underline"
                >
                  Unschedule
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {isScheduled ? "Save" : "Schedule"}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      {trigger({ open, toggle: () => setOpen((prev) => !prev) })}
      {panel}
    </div>
  );
}
