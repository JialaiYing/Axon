"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion, useReducedMotion } from "framer-motion";
import { ListTodo, RotateCcw, SearchX } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { EASE } from "@/lib/motion";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { KanbanToolbar } from "@/components/kanban/kanban-toolbar";
import { ObjectiveDialog } from "@/components/kanban/objective-dialog";
import { RecycleBinDialog } from "@/components/kanban/recycle-bin-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoardSkeleton } from "@/components/ui/skeleton";
import { ConfettiBurst } from "@/components/ui/confetti";
import { KANBAN_COLUMNS } from "@/constants/kanban";
import { useObjectives, isOnKanbanBoard, type ObjectiveInput } from "@/hooks/use-objectives";
import type { Objective, KanbanStatus } from "@/types";

type DialogState =
  | { mode: "create"; status: KanbanStatus }
  | { mode: "edit"; objective: Objective }
  | null;

/** Prefer cards under the pointer; fall back to columns / closest corner. */
const boardCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    const columnIds = new Set<string>(KANBAN_COLUMNS.map((c) => c.id));
    const overCard = pointerHits.find((hit) => !columnIds.has(String(hit.id)));
    if (overCard) return [overCard];
    return pointerHits;
  }
  return closestCorners(args);
};

export function KanbanBoard() {
  const prefersReducedMotion = useReducedMotion();
  const {
    objectives,
    hydrated,
    addObjective,
    updateObjective,
    deleteObjective,
    moveObjective,
    reorderObjectives,
    scheduleObjective,
    unscheduleObjective,
    sendToRecycleBin,
    restoreFromRecycleBin,
    permanentlyDelete,
    clearRecycleBin,
  } = useObjectives();

  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [recycleBinOpen, setRecycleBinOpen] = React.useState(false);
  const [celebrateKey, setCelebrateKey] = React.useState(0);

  const [dialogState, setDialogState] = React.useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Objective | null>(null);
  const searchParams = useSearchParams();

  // Dashboard / command palette land here with ?new=1
  React.useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setDialogState({ mode: "create", status: "todo" });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState(null, "", next);
  }, [searchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const boardObjectives = React.useMemo(
    () => objectives.filter((o) => o.status !== "recycled" && isOnKanbanBoard(o)),
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
    // Preserve store order so drag-reorder sticks — including the top card.
    // Priority still shows as a dot; it no longer overrides manual position.
    for (const objective of filtered) {
      if (objective.status === "recycled") continue;
      map[objective.status].push(objective);
    }
    return map;
  }, [filtered]);

  const activeObjective = activeId ? objectives.find((o) => o.id === activeId) ?? null : null;
  const isBoardEmpty = boardObjectives.length === 0;
  const hasActiveFilters = search.trim().length > 0 || priorityFilter !== "all";
  const isFilterEmpty = !isBoardEmpty && filtered.length === 0 && hasActiveFilters;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  /**
   * Commit column moves only on drop — never mid-drag.
   * Moving during onDragOver remounts the card into a new SortableContext
   * while the pointer is still down, which leaves it undraggable afterward
   * (especially when dropping into an empty column).
   */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeObjective = objectives.find((o) => o.id === active.id);
    if (!activeObjective) return;

    const overColumn = KANBAN_COLUMNS.find((c) => c.id === over.id);
    if (overColumn) {
      if (activeObjective.status === overColumn.id) return;
      moveObjective(activeObjective.id, overColumn.id);
      if (overColumn.id === "done") setCelebrateKey((k) => k + 1);
      return;
    }

    const overObjective = objectives.find((o) => o.id === over.id);
    if (!overObjective || overObjective.id === activeObjective.id) return;

    if (overObjective.status !== activeObjective.status) {
      // Single write: change column and land next to the target card.
      moveObjective(activeObjective.id, overObjective.status);
      // queueMicrotask so reorder sees the post-move store (avoids a same-tick
      // status mismatch if the two setStates don't chain as expected).
      queueMicrotask(() => {
        reorderObjectives(String(active.id), overObjective.id);
      });
      if (overObjective.status === "done") setCelebrateKey((k) => k + 1);
      return;
    }

    reorderObjectives(String(active.id), overObjective.id);
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
    <AppPage
      feature="kanban"
      title="Board"
      actions={
        <button
          type="button"
          onClick={() => setRecycleBinOpen(true)}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-wash hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Recycle bin
          {recycledObjectives.length > 0 && (
            <span className="font-mono text-[14px] tabular-nums text-muted-foreground">
              {recycledObjectives.length}
            </span>
          )}
        </button>
      }
      toolbar={
        <KanbanToolbar
          search={search}
          onSearchChange={setSearch}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          onAdd={() => setDialogState({ mode: "create", status: "todo" })}
        />
      }
    >
      {!hydrated ? (
        <KanbanBoardSkeleton />
      ) : isBoardEmpty ? (
        <EmptyState
          icon={<ListTodo />}
          title="No objectives yet"
          actionLabel="New objective"
          actionSize="lg"
          className="min-h-[min(70vh,36rem)]"
          onAction={() => setDialogState({ mode: "create", status: "todo" })}
        />
      ) : isFilterEmpty ? (
        <EmptyState
          icon={<SearchX />}
          title="No matches"
          description="Try a different search or clear the priority filter."
          actionLabel="Clear filters"
          actionSize="lg"
          className="min-h-[min(70vh,36rem)]"
          onAction={() => {
            setSearch("");
            setPriorityFilter("all");
          }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={boardCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: EASE }}
            className="grid w-full grid-flow-col auto-cols-[minmax(260px,1fr)] items-stretch gap-4 overflow-x-auto pb-3 lg:grid-flow-row lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-border/50 light:lg:divide-border"
          >
            {KANBAN_COLUMNS.map((column) => (
              <div key={column.id} className="flex min-w-0 flex-col lg:px-5 lg:first:pl-0 lg:last:pr-0">
                <KanbanColumn
                  column={column}
                  objectives={grouped[column.id]}
                  onEdit={(objective) => setDialogState({ mode: "edit", objective })}
                  onDelete={(objective) => setDeleteTarget(objective)}
                  onAdd={(status) => setDialogState({ mode: "create", status })}
                  onSendToRecycleBin={(objective) => sendToRecycleBin(objective.id)}
                  onSchedule={(objective, input) => scheduleObjective(objective.id, input)}
                  onUnschedule={(objective) => unscheduleObjective(objective.id)}
                />
              </div>
            ))}
          </motion.div>

          <DragOverlay>
            {activeObjective ? (
              <div className="w-[280px] md:w-[300px]">
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
        dependencyCandidates={objectives}
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
        onClearAll={clearRecycleBin}
      />
    </AppPage>
  );
}