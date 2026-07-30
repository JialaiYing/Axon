"use client";

/**
 * Linear Kanban column — light pass uses wash tokens for drop/hover.
 * Backup: kanban-column.pre-light-dashboard.bak
 */

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { cn } from "@/lib/utils";
import type { KanbanColumnDef } from "@/constants/kanban";
import type { ScheduleInput } from "@/components/calendar/schedule-popover";
import type { KanbanStatus, Objective } from "@/types";

interface KanbanColumnProps {
  column: KanbanColumnDef;
  objectives: Objective[];
  onEdit: (objective: Objective) => void;
  onDelete: (objective: Objective) => void;
  onAdd: (status: KanbanStatus) => void;
  onSendToRecycleBin?: (objective: Objective) => void;
  onSchedule?: (objective: Objective, input: ScheduleInput) => void;
  onUnschedule?: (objective: Objective) => void;
}

export function KanbanColumn({
  column,
  objectives,
  onEdit,
  onDelete,
  onAdd,
  onSendToRecycleBin,
  onSchedule,
  onUnschedule,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id, type: "column" },
  });

  const ids = objectives.map((o) => o.id);
  const isEmpty = objectives.length === 0;

  return (
    <div className="flex h-full min-h-[min(70vh,36rem)] w-full min-w-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="truncate text-[15px] font-medium text-foreground">{column.title}</h2>
          <span className="font-mono text-[13px] tabular-nums text-muted-foreground">
            {objectives.length}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Add objective to ${column.title}`}
          onClick={() => onAdd(column.id)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-wash hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col rounded-md border border-border/50 light:border-border",
          "transition-[border-color,background-color] duration-150",
          isEmpty
            ? "border-dashed bg-transparent"
            : "bg-wash/30 p-1.5 light:bg-card/40",
          isOver && "border-border bg-wash light:border-border light:bg-wash"
        )}
      >
        {isEmpty ? (
          <button
            type="button"
            onClick={() => onAdd(column.id)}
            className="flex h-full min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-wash hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong"
          >
            <Plus className="h-4 w-4" />
            Add objective
          </button>
        ) : (
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="flex min-h-0 flex-1 flex-col justify-start gap-1.5 overflow-y-auto">
              {objectives.map((objective) => (
                <KanbanCard
                  key={objective.id}
                  objective={objective}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSendToRecycleBin={onSendToRecycleBin}
                  onSchedule={onSchedule}
                  onUnschedule={onUnschedule}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
