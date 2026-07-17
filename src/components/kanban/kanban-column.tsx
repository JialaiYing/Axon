"use client";

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
    <div className="flex w-[300px] shrink-0 flex-col rounded-xl border border-border bg-surface/50 p-3 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-colors duration-300 md:w-[320px]">
      <div className="mb-3.5 flex items-center justify-between px-1 pt-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{column.title}</h2>
            <span className="rounded-full border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {objectives.length}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{column.description}</p>
        </div>
        <button
          type="button"
          aria-label={`Add objective to ${column.title}`}
          onClick={() => onAdd(column.id)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-all duration-200 hover:scale-105 hover:bg-card hover:text-foreground active:scale-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2.5 rounded-lg border border-transparent p-1.5 transition-all duration-300",
          isOver && "border-accent/50 bg-accent-muted/25 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]"
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
            className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-xs text-muted-foreground transition-all duration-200 hover:border-accent/40 hover:bg-accent-muted/10 hover:text-muted"
          >
            <Plus className="h-4 w-4" />
            Add an objective
          </button>
        )}
      </div>
    </div>
  );
}
