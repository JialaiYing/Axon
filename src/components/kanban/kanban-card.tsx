"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Pencil, Trash2, Clock, CalendarDays, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import {
  priorityBadgeVariant,
  formatDueDate,
  formatEstimatedTime,
  isOverdue,
} from "@/lib/kanban-utils";
import type { Objective } from "@/types";

interface KanbanCardProps {
  objective: Objective;
  onEdit: (objective: Objective) => void;
  onDelete: (objective: Objective) => void;
  /** When true, renders a lightweight static preview (used in the drag overlay). */
  isOverlay?: boolean;
}

export function KanbanCard({ objective, onEdit, onDelete, isOverlay = false }: KanbanCardProps) {
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isOverlay}
      initial={isOverlay ? false : { opacity: 0, y: 8 }}
      animate={isOverlay ? undefined : { opacity: 1, y: 0 }}
      exit={isOverlay ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
        "hover:border-border-strong hover:bg-card-hover transition-colors",
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
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onEdit(objective)}
          className="flex-1 text-left text-sm font-medium leading-snug text-foreground"
        >
          {objective.title}
        </button>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="Edit objective"
            onClick={() => onEdit(objective)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Delete objective"
            onClick={() => onDelete(objective)}
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

      {(dueLabel || timeLabel) && (
        <div className="mt-2.5 flex items-center gap-3 pl-2 text-[11px] text-muted-foreground">
          {dueLabel && (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue && "font-medium text-danger"
              )}
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
      )}
    </motion.div>
  );
}
