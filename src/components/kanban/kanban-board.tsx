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
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { KanbanToolbar } from "@/components/kanban/kanban-toolbar";
import { ObjectiveDialog } from "@/components/kanban/objective-dialog";
import { RecycleBinDialog } from "@/components/kanban/recycle-bin-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { KanbanBoardSkeleton } from "@/components/ui/skeleton";
import { ConfettiBurst } from "@/components/ui/confetti";
import { KANBAN_COLUMNS } from "@/constants/kanban";
import { sortByPriority } from "@/lib/kanban-utils";
import { useObjectives, type ObjectiveInput } from "@/hooks/use-objectives";
import type { Objective, ObjectiveStatus, KanbanStatus } from "@/types";

type DialogState =
  | { mode: "create"; status: ObjectiveStatus }
  | { mode: "edit"; objective: Objective }
  | null;

export function KanbanBoard() {
  const {
    objectives,
    hydrated,
    addObjective,
    updateObjective,
    deleteObjective,
    moveObjective,
    reorderObjectives,
    sendToRecycleBin,
    restoreFromRecycleBin,
    permanentlyDelete,
  } = useObjectives();

  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [recycleBinOpen, setRecycleBinOpen] = React.useState(false);
  const [celebrateKey, setCelebrateKey] = React.useState(0);

  const [dialogState, setDialogState] = React.useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Objective | null>(null); 

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const boardObjectives = React.useMemo(
    () => objectives.filter((o) => o.status !== "recycled"),
    [objectives]
  );
  const recycledObjectives = React.useMemo(
    () => objectives.filter((o) => o.status === "recycled"),
    [objectives]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return boardObjectives.filter((objective) => {
      const matchesQuery =
        !query ||
        objective.title.toLowerCase().includes(query) ||
        objective.subject.toLowerCase().includes(query) ||
        objective.labels.some((label) => label.toLowerCase().includes(query));
      const matchesPriority = priorityFilter === "all" || objective.priority === priorityFilter;
      return matchesQuery && matchesPriority;
    });
  }, [boardObjectives, search, priorityFilter]);

  const grouped = React.useMemo(() => {
    const map: Record<KanbanStatus, Objective[]> = {
      todo: [],
      "in-progress": [],
      done: [],
    };
    for (const objective of filtered) {
      if (objective.status === "recycled") continue;
      map[objective.status].push(objective);
    }
    return {
      todo: sortByPriority(map.todo),
      "in-progress": sortByPriority(map["in-progress"]),
      done: sortByPriority(map.done),
    };
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
      if (overColumn.id === "done") setCelebrateKey((k) => k + 1);
      return;
    }

    // Dropping over another card: if it's in a different column, adopt that column.
    const overObjective = objectives.find((o) => o.id === over.id);
    if (overObjective && overObjective.status !== activeObjective.status) {
      moveObjective(activeObjective.id, overObjective.status);
      if (overObjective.status === "done") setCelebrateKey((k) => k + 1);
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
      const wasDone = dialogState.objective.status === "done";
      updateObjective(dialogState.objective.id, input);
      if (!wasDone && input.status === "done") setCelebrateKey((k) => k + 1);
    } else {
      addObjective(input);
    }
  }

  return (
    <div className="relative">
      <PageHeader
        title="Kanban"
        description="Plan, track, and move your objectives through your study workflow."
        actions={
          <Button variant="outline" onClick={() => setRecycleBinOpen(true)}>
            <RotateCcw className="h-4 w-4" />
            Recycle bin
            {recycledObjectives.length > 0 && (
              <span className="ml-0.5 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {recycledObjectives.length}
              </span>
            )}
          </Button>
        }
      />

      <KanbanToolbar
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        onAdd={() => setDialogState({ mode: "create", status: "todo" })}
      />

      {!hydrated ? (
        <KanbanBoardSkeleton />
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
                onSendToRecycleBin={(objective) => sendToRecycleBin(objective.id)}
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

      <ConfettiBurst triggerKey={celebrateKey} />

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

      <RecycleBinDialog
        open={recycleBinOpen}
        onOpenChange={setRecycleBinOpen}
        objectives={recycledObjectives}
        onRestore={(objective) => restoreFromRecycleBin(objective.id)}
        onDeleteForever={(objective) => permanentlyDelete(objective.id)}
      />
    </div>
  );
}