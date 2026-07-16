"use client";

import * as React from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { MOCK_OBJECTIVES } from "@/lib/mock-objectives";
import type { Objective, ObjectiveStatus } from "@/types";

const STORAGE_KEY = "axon:kanban:objectives";

export type ObjectiveInput = {
  title: string;
  description?: string;
  subject: string;
  priority: Objective["priority"];
  dueDate?: string;
  estimatedStudyTime?: number;
  progress: number;
  labels: string[];
  status: ObjectiveStatus;
  color?: string;
  notes?: string;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useObjectives() {
  const [objectives, setObjectives, hydrated] = useLocalStorage<Objective[]>(
    STORAGE_KEY,
    MOCK_OBJECTIVES
  );

  const addObjective = React.useCallback(
    (input: ObjectiveInput) => {
      const now = new Date().toISOString();
      const objective: Objective = {
        id: createId(),
        title: input.title,
        description: input.description,
        subject: input.subject,
        priority: input.priority,
        dueDate: input.dueDate,
        estimatedStudyTime: input.estimatedStudyTime,
        progress: input.progress,
        labels: input.labels,
        status: input.status,
        createdAt: now,
        updatedAt: now,
        color: input.color,
        notes: input.notes,
      };
      setObjectives((prev) => [objective, ...prev]);
      return objective;
    },
    [setObjectives]
  );

  const updateObjective = React.useCallback(
    (id: string, patch: Partial<ObjectiveInput>) => {
      setObjectives((prev) =>
        prev.map((objective) =>
          objective.id === id
            ? {
                ...objective,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : objective
        )
      );
    },
    [setObjectives]
  );

  const deleteObjective = React.useCallback(
    (id: string) => {
      setObjectives((prev) => prev.filter((objective) => objective.id !== id));
    },
    [setObjectives]
  );

  /** Moves a card to a different column, optionally at a specific position. */
  const moveObjective = React.useCallback(
    (id: string, status: ObjectiveStatus) => {
      setObjectives((prev) =>
        prev.map((objective) => {
          if (objective.id !== id) return objective;
          const isNowDone = status === "done" && objective.status !== "done";
          return {
            ...objective,
            status,
            progress: isNowDone ? 100 : objective.progress,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [setObjectives]
  );

  /** Reorders within the same column (or across, if statuses already match) by dragged card id and target card id. */
  const reorderObjectives = React.useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;
      setObjectives((prev) => {
        const oldIndex = prev.findIndex((o) => o.id === activeId);
        const newIndex = prev.findIndex((o) => o.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    },
    [setObjectives]
  );

  const columnCounts = React.useMemo(() => {
    return objectives.reduce<Record<string, number>>((acc, objective) => {
      acc[objective.status] = (acc[objective.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [objectives]);

  return {
    objectives,
    hydrated,
    addObjective,
    updateObjective,
    deleteObjective,
    moveObjective,
    reorderObjectives,
    columnCounts,
  };
}
