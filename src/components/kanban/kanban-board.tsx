"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { KanbanToolbar } from "@/components/kanban/kanban-toolbar";
import { ObjectiveDialog } from "@/components/kanban/objective-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { KANBAN_COLUMNS } from "@/constants/kanban";
import { useObjectives, type ObjectiveInput } from "@/hooks/use-objectives";
import type { Objective, ObjectiveStatus } from "@/types";

export function KanbanBoard() {
  const {
    objectives,
    hydrated,
    addObjective,
    updateObjective,
    deleteObjective,
    moveObjective,
    reorderObjectives,
  } = useObjectives();

  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const [dialogState, setDialogState] = React.useState<
    | { mode: "create"; status: ObjectiveStatus }
    | { mode: "edit"; objective: Objective }
    | null
  >(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Objective | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return objectives.filter((objective) => {
      const matchesQuery =
        !query ||
        objective.title.toLowerCase().includes(query) ||
        objective.subject.toLowerCase().includes(query) ||
        objective.labels.some((label) => label.toLowerCase().includes(query));
      const matchesPriority = priorityFilter === "all" || objective.priority === priorityFilter;
      return matchesQuery && matchesPriority;
    });
  }, [objectives, search, priorityFilter]);

  const grouped = React.useMemo(() => {
    const map: Record<ObjectiveStatus, Objective[]> = {
      todo: [],
      "in-progress": [],
      done: [],
    };
    for (const objective of filtered) {
      map[objective.status].push(objective);
    }
    return map;
  }, [filtered]);

  const activeObjective = activeId ? objectives.find((o) => o.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeObjective = objectives.find((o) => o.id === active.id);
    if (!activeObjective) return;

    // Dropping directly over a column (empty space) moves it to that column.
    const overColumn = KANBAN_COLUMNS.find((c) => c.id === over.id);
    if (overColumn && activeObjective.status !== overColumn.id) {
      moveObjective(activeObjective.id, overColumn.id);
      return;
    }

    // Dropping over another card: if it's in a different column, adopt that column.
    const overObjective = objectives.find((o) => o.id === over.id);
    if (overObjective && overObjective.status !== activeObjective.status) {
      moveObjective(activeObjective.id, overObjective.status);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const overObjective = objectives.find((o) => o.id === over.id);
    if (overObjective && overObjective.id !== active.id) {
      reorderObjectives(String(active.id), overObjective.id);
    }
  }

  function handleFormSubmit(input: ObjectiveInput) {
    if (dialogState?.mode === "edit") {
      updateObjective(dialogState.objective.id, input);
    } else {
      addObjective(input);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kanban"
        description="Plan, track, and move your objectives through your study workflow."
      />

      <KanbanToolbar
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        onAdd={() => setDialogState({ mode: "create", status: "todo" })}
      />

      {!hydrated ? (
        <div className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">
          Loading your board...
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                objectives={grouped[column.id]}
                onEdit={(objective) => setDialogState({ mode: "edit", objective })}
                onDelete={(objective) => setDeleteTarget(objective)}
                onAdd={(status) => setDialogState({ mode: "create", status })}
              />
            ))}
          </div>

          <DragOverlay>
            {activeObjective ? (
              <div className="w-[300px] md:w-[320px]">
                <KanbanCard
                  objective={activeObjective}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <ObjectiveDialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
        mode={dialogState?.mode ?? "create"}
        defaultStatus={dialogState?.mode === "create" ? dialogState.status : undefined}
        objective={dialogState?.mode === "edit" ? dialogState.objective : undefined}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this objective?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete objective"
        onConfirm={() => {
          if (deleteTarget) deleteObjective(deleteTarget.id);
        }}
      />
    </div>
  );
}
