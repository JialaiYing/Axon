"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { Panel } from "@/components/ui/panel";
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
    <Panel
      variant="standard"
      className="flex h-full w-full min-w-0 flex-col bg-surface p-3 shadow-none"
    >
      <div className="mb-3.5 flex items-center justify-between px-1 pt-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{column.title}</h2>
            <span className="rounded-pill border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
              {objectives.length}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{column.description}</p>
        </div>
        <button
          type="button"
          aria-label={`Add objective to ${column.title}`}
          onClick={() => onAdd(column.id)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong active:scale-90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border border-transparent p-1.5 transition-[border-color,background-color] duration-200",
          isOver && "border-accent/50 bg-accent-muted/20"
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
            className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-xs text-muted-foreground transition-colors duration-200 hover:border-border-strong hover:bg-card-hover hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add an objective
          </button>
        )}
      </div>
    </Panel>
  );
}
