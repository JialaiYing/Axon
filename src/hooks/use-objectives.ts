"use client";

import * as React from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useLocalStorage, asArray, dedupeById } from "@/hooks/use-local-storage";
import { removeActiveTimersForObjective } from "@/hooks/use-pomodoro-timers";
import { MOCK_OBJECTIVES } from "@/lib/mock-objectives";
import { daysSince } from "@/lib/kanban-utils";
import { AUTO_RECYCLE_AFTER_DAYS, RECYCLE_BIN_RETENTION_DAYS } from "@/constants/kanban";
import type { Objective, ObjectiveStatus, Priority } from "@/types";

const STORAGE_KEY = "axon:kanban:objectives";
const OBJECTIVE_STATUSES = new Set(["todo", "in-progress", "done", "recycled"]);
const PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

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

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function validIso(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return Number.isNaN(new Date(value).getTime()) ? undefined : value;
}

function normalizeStudySessions(value: Objective["studySessions"]): NonNullable<Objective["studySessions"]> {
  return asArray<NonNullable<Objective["studySessions"]>[number]>(value)
    .filter((session) => session && typeof session.id === "string")
    .map((session) => ({
      id: session.id,
      date: validIso(session.date) ?? new Date().toISOString(),
      minutes: Math.max(0, Math.round(finiteNumber(session.minutes, 0))),
    }));
}

function normalizeObjective(value: Objective): Objective | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const now = new Date().toISOString();
  const status = OBJECTIVE_STATUSES.has(value.status) ? (value.status as ObjectiveStatus) : "todo";
  const priority = PRIORITIES.has(value.priority) ? (value.priority as Priority) : "medium";
  const estimatedStudyTime =
    typeof value.estimatedStudyTime === "number" && Number.isFinite(value.estimatedStudyTime)
      ? Math.max(0, Math.round(value.estimatedStudyTime))
      : undefined;
  const scheduledDurationMinutes =
    typeof value.scheduledDurationMinutes === "number" && Number.isFinite(value.scheduledDurationMinutes)
      ? Math.max(5, Math.round(value.scheduledDurationMinutes))
      : undefined;

  return {
    ...value,
    title: typeof value.title === "string" && value.title.trim() ? value.title : "Untitled objective",
    description: typeof value.description === "string" ? value.description : undefined,
    subject: typeof value.subject === "string" && value.subject.trim() ? value.subject : "General",
    priority,
    dueDate: validIso(value.dueDate),
    estimatedStudyTime,
    progress: Math.min(100, Math.max(0, Math.round(finiteNumber(value.progress, 0)))),
    labels: asArray<string>(value.labels).filter((label) => typeof label === "string" && label.trim()),
    status,
    createdAt: validIso(value.createdAt) ?? now,
    updatedAt: validIso(value.updatedAt) ?? now,
    completedAt: status === "done" ? validIso(value.completedAt) ?? now : validIso(value.completedAt),
    recycledAt: status === "recycled" ? validIso(value.recycledAt) ?? now : validIso(value.recycledAt),
    color: typeof value.color === "string" ? value.color : undefined,
    notes: typeof value.notes === "string" ? value.notes : undefined,
    scheduledStart: validIso(value.scheduledStart),
    scheduledDurationMinutes,
    studySessions: normalizeStudySessions(value.studySessions),
  };
}

function normalizeObjectives(value: unknown): Objective[] {
  return dedupeById(asArray<Objective>(value))
    .map(normalizeObjective)
    .filter((objective): objective is Objective => objective !== null);
}

export function useObjectives() {
  const [rawObjectives, rawSetObjectives, hydrated] = useLocalStorage<Objective[]>(
    STORAGE_KEY,
    MOCK_OBJECTIVES
  );

  // Self-heals any corrupted/duplicated persisted state (e.g. a non-array
  // value, or leftover duplicate ids from a past bug) so rendering never
  // crashes on stale localStorage content.
  const objectives = React.useMemo(() => normalizeObjectives(rawObjectives), [rawObjectives]);

  const setObjectives = React.useCallback(
    (value: Objective[] | ((prev: Objective[]) => Objective[])) => {
      rawSetObjectives((prev) => {
        const safePrev = normalizeObjectives(prev);
        return normalizeObjectives(value instanceof Function ? value(safePrev) : value);
      });
    },
    [rawSetObjectives]
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
      // If the estimate changes while a Pomodoro timer is already running/
      // paused for this objective, that timer's duration was snapshotted at
      // start time and is now stale — drop it so the user starts fresh with
      // the updated estimate instead of finishing against an outdated one.
      const current = objectives.find((o) => o.id === id);
      if (
        current &&
        patch.estimatedStudyTime !== undefined &&
        patch.estimatedStudyTime !== current.estimatedStudyTime
      ) {
        removeActiveTimersForObjective(id);
      }
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
    [objectives, setObjectives]
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

  /**
   * Attaches/updates scheduling metadata on an existing objective — used by
   * the Calendar's schedule popover, the Kanban card's quick-schedule
   * action, and calendar drag/resize. Never creates a second object; the
   * objective is the single source of truth and the Calendar only ever
   * visualizes these fields.
   */
  const scheduleObjective = React.useCallback(
    (id: string, input: { start: string; durationMinutes: number }) => {
      setObjectives((prev) =>
        prev.map((objective) =>
          objective.id === id
            ? {
                ...objective,
                scheduledStart: input.start,
                scheduledDurationMinutes: Math.max(5, Math.round(input.durationMinutes)),
                updatedAt: new Date().toISOString(),
              }
            : objective
        )
      );
    },
    [setObjectives]
  );

  /** Removes scheduling metadata — the objective itself is untouched and stays on the board. */
  const unscheduleObjective = React.useCallback(
    (id: string) => {
      setObjectives((prev) =>
        prev.map((objective) =>
          objective.id === id
            ? {
                ...objective,
                scheduledStart: undefined,
                scheduledDurationMinutes: undefined,
                updatedAt: new Date().toISOString(),
              }
            : objective
        )
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
    scheduleObjective,
    unscheduleObjective,
    sendToRecycleBin,
    restoreFromRecycleBin,
    permanentlyDelete,
    columnCounts,
  };
}