"use client";

import * as React from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { MOCK_OBJECTIVES } from "@/lib/mock-objectives";
import { daysSince } from "@/lib/kanban-utils";
import { AUTO_RECYCLE_AFTER_DAYS, RECYCLE_BIN_RETENTION_DAYS } from "@/constants/kanban";
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
        completedAt: input.status === "done" ? now : undefined,
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
          const now = new Date().toISOString();
          const isNowDone = status === "done" && objective.status !== "done";
          const isLeavingDone = objective.status === "done" && status !== "done";
          return {
            ...objective,
            status,
            progress: isNowDone ? 100 : objective.progress,
            completedAt: isNowDone ? now : isLeavingDone ? undefined : objective.completedAt,
            recycledAt: status === "recycled" ? now : undefined,
            updatedAt: now,
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

  /** Marks an objective as complete — used by both the board and the Pomodoro timer. */
  const completeObjective = React.useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setObjectives((prev) =>
        prev.map((objective) =>
          objective.id === id
            ? { ...objective, status: "done", progress: 100, completedAt: now, updatedAt: now }
            : objective
        )
      );
    },
    [setObjectives]
  );

  /** Moves a queued objective into "in-progress" — used when a focus session starts. */
  const startObjectiveSession = React.useCallback(
    (id: string) => {
      setObjectives((prev) =>
        prev.map((objective) =>
          objective.id === id && objective.status === "todo"
            ? { ...objective, status: "in-progress", updatedAt: new Date().toISOString() }
            : objective
        )
      );
    },
    [setObjectives]
  );

  /**
   * Logs focused minutes against an objective (from the Pomodoro timer) and
   * recomputes its progress bar from estimatedStudyTime. Safe to call with
   * partial time if the timer was stopped early.
   */
  const logStudyTime = React.useCallback(
    (id: string, minutes: number) => {
      if (minutes <= 0) return;
      const now = new Date().toISOString();
      setObjectives((prev) =>
        prev.map((objective) => {
          if (objective.id !== id) return objective;
          const sessions = [
            ...(objective.studySessions ?? []),
            { id: createId(), date: now, minutes },
          ];
          const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
          const nextProgress = objective.estimatedStudyTime
            ? Math.min(100, Math.round((totalMinutes / objective.estimatedStudyTime) * 100))
            : objective.progress;
          return {
            ...objective,
            studySessions: sessions,
            progress: nextProgress,
            updatedAt: now,
          };
        })
      );
    },
    [setObjectives]
  );

  const sendToRecycleBin = React.useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setObjectives((prev) =>
        prev.map((objective) =>
          objective.id === id
            ? { ...objective, status: "recycled", recycledAt: now, updatedAt: now }
            : objective
        )
      );
    },
    [setObjectives]
  );

  const restoreFromRecycleBin = React.useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setObjectives((prev) =>
        prev.map((objective) =>
          objective.id === id
            ? {
                ...objective,
                status: "done",
                recycledAt: undefined,
                completedAt: now,
                updatedAt: now,
              }
            : objective
        )
      );
    },
    [setObjectives]
  );

  const permanentlyDelete = deleteObjective;

  /**
   * Applies the two time-based lifecycle rules: a "done" card auto-recycles
   * after AUTO_RECYCLE_AFTER_DAYS, and a recycled card is permanently
   * deleted after RECYCLE_BIN_RETENTION_DAYS. Runs on hydration and then
   * periodically so a long-open tab stays accurate.
   */
  const runHousekeeping = React.useCallback(() => {
    setObjectives((prev) => {
      let changed = false;
      const now = new Date().toISOString();
      const next = prev
        .map((objective) => {
          if (objective.status === "done") {
            const elapsed = daysSince(objective.completedAt);
            if (elapsed !== null && elapsed >= AUTO_RECYCLE_AFTER_DAYS) {
              changed = true;
              return { ...objective, status: "recycled" as const, recycledAt: now, updatedAt: now };
            }
          }
          return objective;
        })
        .filter((objective) => {
          if (objective.status === "recycled") {
            const elapsed = daysSince(objective.recycledAt);
            if (elapsed !== null && elapsed >= RECYCLE_BIN_RETENTION_DAYS) {
              changed = true;
              return false;
            }
          }
          return true;
        });
      return changed ? next : prev;
    });
  }, [setObjectives]);

  React.useEffect(() => {
    if (!hydrated) return;
    runHousekeeping();
    const interval = setInterval(runHousekeeping, 60_000);
    return () => clearInterval(interval);
  }, [hydrated, runHousekeeping]);

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
    completeObjective,
    startObjectiveSession,
    logStudyTime,
    sendToRecycleBin,
    restoreFromRecycleBin,
    permanentlyDelete,
    columnCounts,
  };
}