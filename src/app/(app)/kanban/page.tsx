import { Suspense } from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanBoardSkeleton } from "@/components/ui/skeleton";

export default function KanbanPage() {
  return (
    <Suspense fallback={<KanbanBoardSkeleton />}>
      <KanbanBoard />
    </Suspense>
  );
}
