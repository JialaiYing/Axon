"use client";

/**
 * Linear-inspired Kanban column (§2).
 * Backup: kanban-column.pre-linear.bak
 */

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
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
    data: { columnId: column.id },
  });

  const ids = objectives.map((o) => o.id);

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="truncate text-[13px] font-medium text-foreground">{column.title}</h2>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {objectives.length}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Add objective to ${column.title}`}
          onClick={() => onAdd(column.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong light:hover:bg-black/[0.04]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[180px] flex-1 flex-col gap-1 rounded-md border border-transparent p-0.5 transition-[border-color,background-color] duration-150",
          isOver && "border-border bg-foreground/[0.03] light:bg-black/[0.03]"
        )}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
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
          </AnimatePresence>
        </SortableContext>

        {objectives.length === 0 && (
          <button
            type="button"
            onClick={() => onAdd(column.id)}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/60 py-6 text-[12px] text-muted-foreground transition-colors duration-150 hover:border-border hover:bg-foreground/[0.03] hover:text-foreground light:border-border light:hover:bg-black/[0.03]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add objective
          </button>
        )}
      </div>
    </div>
  );
}
