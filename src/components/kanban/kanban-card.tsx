"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Pencil, Trash2, Clock, CalendarDays, CalendarPlus, ArchiveX, CalendarClock, CalendarOff, ListChecks, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import {
  priorityBadgeVariant,
  formatDueDate,
  formatEstimatedTime,
  formatCreatedDate,
  formatScheduledDateTime,
  daysUntilAutoRecycle,
  isOverdue,
  isScheduleOverdue,
} from "@/lib/kanban-utils";
import { SchedulePopover, type ScheduleInput } from "@/components/calendar/schedule-popover";
import MagicCard from "@/components/effects/magic-card";
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
  const createdLabel = formatCreatedDate(objective.createdAt);
  const overdue = isOverdue(objective.dueDate, objective.status);
  const isDone = objective.status === "done";
  const recycleCountdown = isDone ? daysUntilAutoRecycle(objective.completedAt) : null;
  const scheduledLabel = formatScheduledDateTime(objective.scheduledStart);
  const scheduleOverdue = isScheduleOverdue(objective);

  return (
    <MagicCard
      className="rounded-xl"
      enableStars
      enableBorderGlow
      enableTilt={false}
      enableMagnetism={false}
      clickEffect
      particleCount={8}
      glowColor="168, 85, 247"
      disableAnimations={isOverlay || isDragging}
    >
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isOverlay}
      initial={isOverlay ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={isOverlay ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={isOverlay ? undefined : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={isOverlay ? undefined : { y: -3, scale: 1.012 }}
      whileTap={isOverlay ? undefined : { scale: 0.99 }}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={cn(
        "group relative touch-none rounded-xl border border-border bg-card/80 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-sm",
        "hover:border-border-strong hover:bg-card-hover hover:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_16px_36px_-12px_rgba(0,0,0,0.55)] transition-[background-color,border-color,box-shadow] duration-200",
        !isOverlay && "cursor-grab active:cursor-grabbing",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "shadow-[0_1px_2px_rgba(0,0,0,0.4),0_28px_60px_-16px_rgba(0,0,0,0.7)] ring-1 ring-accent/40 rotate-1 scale-[1.02]"
      )}
    >
      {/* Subtle top sheen for depth — barely visible, echoes the card system's "layered" spec. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-foreground/[0.03] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />

      {objective.color && (
        <span
          className="absolute left-0 top-3 h-[calc(100%-24px)] w-1 rounded-full"
          style={{ backgroundColor: objective.color, boxShadow: `0 0 12px -2px ${objective.color}` }}
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
          className="flex-1 text-left text-sm font-medium leading-snug text-foreground transition-colors duration-150 hover:text-accent"
        >
          {objective.title}
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
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-all duration-150 hover:scale-105 hover:bg-surface hover:text-foreground active:scale-90"
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
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-all duration-150 hover:scale-105 hover:bg-surface hover:text-foreground active:scale-90"
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
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-all duration-150 hover:scale-105 hover:bg-danger-muted hover:text-danger active:scale-90"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {objective.description && (
        <p className="mt-1.5 line-clamp-2 pl-2 text-xs text-muted">{objective.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-2">
        <Badge variant={priorityBadgeVariant(objective.priority)} className="capitalize">
          {objective.priority}
        </Badge>
        <Badge variant="outline">{objective.subject}</Badge>
        {objective.labels.map((label) => (
          <Badge key={label} variant="default">
            {label}
          </Badge>
        ))}
      </div>

      <div className="mt-3 pl-2">
        <ProgressBar value={objective.progress} size="sm" showLabel />
      </div>

      {((objective.subtasks && objective.subtasks.length > 0) ||
        (objective.recurrence && objective.recurrence !== "none")) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-2 text-[11px] text-muted-foreground">
          {objective.subtasks && objective.subtasks.length > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {objective.subtasks.filter((s) => s.done).length}/{objective.subtasks.length}
            </span>
          )}
          {objective.recurrence && objective.recurrence !== "none" && (
            <span className="flex items-center gap-1 capitalize">
              <Repeat className="h-3 w-3" />
              {objective.recurrence}
            </span>
          )}
        </div>
      )}

      {!isOverlay && (onSchedule || onUnschedule) && (
        <div className="mt-2.5 pl-2" onPointerDown={(e) => e.stopPropagation()}>
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
                    "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium transition-all duration-150",
                    scheduleOverdue
                      ? "border-warning/30 bg-warning-muted text-warning"
                      : "border-accent/25 bg-accent-muted/50 text-accent hover:border-accent/40",
                    open && "ring-1 ring-accent/40"
                  )}
                >
                  <CalendarClock className="h-3 w-3" />
                  {scheduleOverdue ? `Missed · ${scheduledLabel}` : scheduledLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggle}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border border-dashed border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-all duration-150 hover:border-accent/40 hover:text-accent",
                    open && "ring-1 ring-accent/40"
                  )}
                >
                  <CalendarOff className="h-3 w-3" />
                  Not scheduled
                </button>
              )
            }
          />
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-3 pl-2 text-[11px] text-muted-foreground">
        {createdLabel && (
          <span className="flex items-center gap-1">
            <CalendarPlus className="h-3 w-3" />
            {createdLabel}
          </span>
        )}
        {dueLabel && (
          <span
            className={cn("flex items-center gap-1", overdue && "font-medium text-danger")}
          >
            <CalendarDays className="h-3 w-3" />
            {overdue ? `Overdue · ${dueLabel}` : dueLabel}
          </span>
        )}
        {timeLabel && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeLabel}
          </span>
        )}
      </div>

      {isDone && recycleCountdown !== null && (
        <p className="mt-2 pl-2 text-[10px] text-muted-foreground">
          {recycleCountdown === 0
            ? "Moves to recycle bin today"
            : `Auto-recycles in ${recycleCountdown}d`}
        </p>
      )}
    </motion.div>
    </MagicCard>
  );
}