"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Pencil,
  Trash2,
  Clock,
  CalendarDays,
  ArchiveX,
  CalendarClock,
  CalendarOff,
  ListChecks,
  Repeat,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import {
  priorityDotClass,
  formatDueDate,
  formatEstimatedTime,
  formatScheduledDateTime,
  daysUntilAutoRecycle,
  isOverdue,
  isScheduleOverdue,
} from "@/lib/kanban-utils";
import { SchedulePopover, type ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective } from "@/types";

interface KanbanCardProps {
  objective: Objective;
  onEdit: (objective: Objective) => void;
  onDelete: (objective: Objective) => void;
  onSendToRecycleBin?: (objective: Objective) => void;
  onSchedule?: (objective: Objective, input: ScheduleInput) => void;
  onUnschedule?: (objective: Objective) => void;
  /** When true, renders a lightweight static preview (used in the drag overlay). */
  isOverlay?: boolean;
}

export function KanbanCard({
  objective,
  onEdit,
  onDelete,
  onSendToRecycleBin,
  onSchedule,
  onUnschedule,
  isOverlay = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: objective.id, data: { objective } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueLabel = formatDueDate(objective.dueDate);
  const timeLabel = formatEstimatedTime(objective.estimatedStudyTime);
  const overdue = isOverdue(objective.dueDate, objective.status);
  const isDone = objective.status === "done";
  const recycleCountdown = isDone ? daysUntilAutoRecycle(objective.completedAt) : null;
  const scheduledLabel = formatScheduledDateTime(objective.scheduledStart);
  const scheduleOverdue = isScheduleOverdue(objective);
  const hasSubtasks = Boolean(objective.subtasks && objective.subtasks.length > 0);
  const showProgress = objective.progress > 0 || hasSubtasks;
  const extraLabels = objective.labels.slice(0, 2);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isOverlay}
      initial={isOverlay ? false : { opacity: 0, y: 6 }}
      animate={isOverlay ? undefined : { opacity: 1, y: 0 }}
      exit={isOverlay ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={cn(
        "group relative touch-none rounded-xl border border-border bg-card-hover p-3.5 shadow-[var(--shadow-elevation-1)] light:bg-card",
        "transition-[background-color,border-color] duration-200 hover:border-border-strong hover:bg-foreground/[0.08] light:hover:bg-card-hover",
        !isOverlay && "cursor-grab active:cursor-grabbing",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "shadow-[var(--shadow-elevation-3)] ring-1 ring-border-strong"
      )}
    >
      {objective.color && (
        <span
          aria-hidden
          className="absolute left-0 top-3 h-[calc(100%-24px)] w-0.5 rounded-full"
          style={{ backgroundColor: objective.color }}
        />
      )}

      <div className="flex items-start justify-between gap-2 pl-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(objective);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <span
            className={cn(
              "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
              priorityDotClass(objective.priority)
            )}
            title={objective.priority}
          />
          <span className="text-sm font-medium leading-snug text-foreground transition-colors duration-150 hover:text-foreground/80">
            {objective.title}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {isDone && onSendToRecycleBin && (
            <button
              type="button"
              aria-label="Send to recycle bin"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSendToRecycleBin(objective);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
              title="Send to recycle bin"
            >
              <ArchiveX className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            aria-label="Edit objective"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(objective);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Delete objective"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(objective);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-danger-muted hover:text-danger focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {objective.description && (
        <p className="mt-1.5 line-clamp-2 pl-5 text-xs text-muted-foreground">{objective.description}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-5 text-[11px] text-muted-foreground">
        <span className="capitalize">{objective.priority}</span>
        {objective.subject && (
          <>
            <span aria-hidden>·</span>
            <span className="truncate">{objective.subject}</span>
          </>
        )}
        {extraLabels.map((label) => (
          <React.Fragment key={label}>
            <span aria-hidden>·</span>
            <span className="truncate">{label}</span>
          </React.Fragment>
        ))}
      </div>

      {showProgress && (
        <div className="mt-2.5 pl-5">
          <ProgressBar
            value={objective.progress}
            size="sm"
            barClassName={isDone ? "bg-success" : undefined}
          />
        </div>
      )}

      {(hasSubtasks || (objective.recurrence && objective.recurrence !== "none") || dueLabel || timeLabel) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-5 text-[11px] text-muted-foreground">
          {hasSubtasks && (
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              <span className="font-mono tabular-nums">
                {objective.subtasks!.filter((s) => s.done).length}/{objective.subtasks!.length}
              </span>
            </span>
          )}
          {objective.recurrence && objective.recurrence !== "none" && (
            <span className="flex items-center gap-1 capitalize">
              <Repeat className="h-3 w-3" />
              {objective.recurrence}
            </span>
          )}
          {dueLabel && (
            <span className={cn("flex items-center gap-1", overdue && "font-medium text-danger")}>
              <CalendarDays className="h-3 w-3" />
              <span className="font-mono">{overdue ? `Overdue · ${dueLabel}` : `Due ${dueLabel}`}</span>
            </span>
          )}
          {timeLabel && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="font-mono">{timeLabel}</span>
            </span>
          )}
        </div>
      )}

      {!isOverlay && (onSchedule || onUnschedule) && (
        <div className="mt-2.5 pl-5" onPointerDown={(e) => e.stopPropagation()}>
          <SchedulePopover
            objective={objective}
            onSchedule={(input) => onSchedule?.(objective, input)}
            onUnschedule={() => onUnschedule?.(objective)}
            trigger={({ open, toggle }) =>
              scheduledLabel ? (
                <button
                  type="button"
                  onClick={toggle}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] transition-colors duration-150",
                    "text-muted-foreground hover:text-foreground",
                    open && "text-foreground"
                  )}
                >
                  <CalendarClock
                    className={cn("h-3 w-3", scheduleOverdue && "text-warning")}
                  />
                  {scheduleOverdue && (
                    <span className="font-medium text-warning">Missed</span>
                  )}
                  <span className="font-mono tabular-nums">{scheduledLabel}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggle}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground",
                    open && "text-foreground"
                  )}
                >
                  <CalendarOff className="h-3 w-3" />
                  Schedule
                </button>
              )
            }
          />
        </div>
      )}

      {isDone && recycleCountdown !== null && (
        <p className="mt-2 pl-5 text-[10px] text-muted-foreground">
          {recycleCountdown === 0
            ? "Moves to recycle bin today"
            : `Auto-recycles in ${recycleCountdown}d`}
        </p>
      )}
    </motion.div>
  );
}
