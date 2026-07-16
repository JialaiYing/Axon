"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Pencil, Trash2, Clock, CalendarDays, CalendarPlus, ArchiveX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import {
  priorityBadgeVariant,
  formatDueDate,
  formatEstimatedTime,
  formatCreatedDate,
  daysUntilAutoRecycle,
  isOverdue,
} from "@/lib/kanban-utils";
import type { Objective } from "@/types";

interface KanbanCardProps {
  objective: Objective;
  onEdit: (objective: Objective) => void;
  onDelete: (objective: Objective) => void;
  onSendToRecycleBin?: (objective: Objective) => void;
  /** When true, renders a lightweight static preview (used in the drag overlay). */
  isOverlay?: boolean;
}

export function KanbanCard({
  objective,
  onEdit,
  onDelete,
  onSendToRecycleBin,
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isOverlay}
      initial={isOverlay ? false : { opacity: 0, y: 8 }}
      animate={isOverlay ? undefined : { opacity: 1, y: 0 }}
      exit={isOverlay ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={isOverlay ? undefined : { y: -2 }}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      className={cn(
        "group relative touch-none rounded-lg border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
        "hover:border-border-strong hover:bg-card-hover hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.5)] transition-[background-color,border-color,box-shadow,transform] duration-200",
        !isOverlay && "cursor-grab active:cursor-grabbing",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "shadow-2xl ring-1 ring-accent/40 rotate-1"
      )}
    >
      {objective.color && (
        <span
          className="absolute left-0 top-3 h-[calc(100%-24px)] w-1 rounded-full"
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
          className="flex-1 text-left text-sm font-medium leading-snug text-foreground"
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
              className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-surface hover:text-foreground"
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
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-surface hover:text-foreground"
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
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-danger-muted hover:text-danger"
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
  );
}