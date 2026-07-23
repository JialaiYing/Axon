"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { SchedulePopover, type ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective } from "@/types";

interface UnscheduledRailProps {
  objectives: Objective[];
  defaultStart: Date;
  onSchedule: (objective: Objective, input: ScheduleInput) => void;
  className?: string;
}

function UnscheduledRow({
  objective,
  defaultStart,
  onSchedule,
}: {
  objective: Objective;
  defaultStart: Date;
  onSchedule: (objective: Objective, input: ScheduleInput) => void;
}) {
  const duration =
    objective.scheduledDurationMinutes ??
    (objective.estimatedStudyTime && objective.estimatedStudyTime > 0
      ? objective.estimatedStudyTime
      : 30);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unscheduled:${objective.id}`,
    data: {
      objective,
      durationMinutes: duration,
      fromUnscheduled: true,
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? CSS.Translate.toString(transform) : undefined }}
      className={cn(
        "flex items-center gap-2 px-1 py-1.5 transition-colors hover:bg-foreground/[0.03] light:hover:bg-black/[0.03]",
        isDragging && "opacity-40"
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-grab items-center gap-2 text-left active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground"
          style={
            objective.color ? { backgroundColor: objective.color } : undefined
          }
        />
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground">{objective.title}</p>
      </button>
      <SchedulePopover
        objective={objective}
        defaultStart={defaultStart}
        onSchedule={(input) => onSchedule(objective, input)}
        align="end"
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            className="shrink-0 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Schedule
          </button>
        )}
      />
    </div>
  );
}

/** Browse and schedule objectives that aren't on the Calendar yet. */
export function UnscheduledRail({
  objectives,
  defaultStart,
  onSchedule,
  className,
}: UnscheduledRailProps) {
  const prefersReducedMotion = useReducedMotion();
  const [collapsed, setCollapsed] = React.useState(false);
  const unscheduled = React.useMemo(
    () =>
      objectives.filter(
        (o) => !o.scheduledStart && o.status !== "done" && o.status !== "recycled"
      ),
    [objectives]
  );

  return (
    <div className={cn("overflow-hidden rounded-md border border-border/50 light:border-border light:bg-card", className)}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between px-3 py-2.5"
      >
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
          <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
          Unscheduled
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            · {unscheduled.length}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            !collapsed && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden border-t border-border/50 light:border-border"
          >
            <div className="flex max-h-64 flex-col overflow-y-auto px-2 py-1">
              {unscheduled.length === 0 ? (
                <p className="px-1 py-3 text-center text-[12px] text-muted-foreground">
                  Everything active is on the Calendar.
                </p>
              ) : (
                <div className="divide-y divide-border/60 light:divide-border">
                  {unscheduled.map((objective) => (
                    <UnscheduledRow
                      key={objective.id}
                      objective={objective}
                      defaultStart={defaultStart}
                      onSchedule={onSchedule}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="border-t border-border/50 px-3 py-1.5 text-[10px] text-muted-foreground">
              Drag onto a day to schedule, or use Schedule.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
