"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { cn } from "@/lib/utils";
import type { KanbanColumnDef } from "@/constants/kanban";
import type { Objective } from "@/types";

interface KanbanColumnProps {
  column: KanbanColumnDef;
  objectives: Objective[];
  onEdit: (objective: Objective) => void;
  onDelete: (objective: Objective) => void;
  onAdd: (status: Objective["status"]) => void;
  onSendToRecycleBin?: (objective: Objective) => void;
}

export function KanbanColumn({
  column,
  objectives,
  onEdit,
  onDelete,
  onAdd,
  onSendToRecycleBin,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });

  const ids = objectives.map((o) => o.id);

  return (
    <div className="flex w-[300px] shrink-0 flex-col md:w-[320px]">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {objectives.length}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{column.description}</p>
        </div>
        <button
          type="button"
          aria-label={`Add objective to ${column.title}`}
          onClick={() => onAdd(column.id)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-card hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2.5 rounded-lg border border-transparent p-2 transition-colors",
          isOver && "border-accent/40 bg-accent-muted/30"
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
           />
            ))}
          </AnimatePresence>
        </SortableContext>

        {objectives.length === 0 && (
          <button
            type="button"
            onClick={() => onAdd(column.id)}
            className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-8 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-muted"
          >
            <Plus className="h-4 w-4" />
            Add an objective
          </button>
        )}
      </div>
    </div>
  );
}
