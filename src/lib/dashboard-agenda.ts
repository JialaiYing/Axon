import { isToday } from "@/lib/goals-utils";
import { getScheduledEvent, isSameDay, type ScheduledEvent } from "@/lib/calendar-utils";
import { isOverdue, isScheduleOverdue } from "@/lib/kanban-utils";
import type { Objective } from "@/types";

const PRIORITY_ORDER: Record<Objective["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortOpenQueue(a: Objective, b: Objective) {
  const aTime = a.scheduledStart ?? a.dueDate;
  const bTime = b.scheduledStart ?? b.dueDate;
  if (aTime && bTime) return new Date(aTime).getTime() - new Date(bTime).getTime();
  if (aTime) return -1;
  if (bTime) return 1;
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

export interface TodayAgendaBuckets {
  overdue: Objective[];
  dueToday: Objective[];
  focusBlocks: ScheduledEvent[];
  calendarEvents: ScheduledEvent[];
  /** In-progress Kanban cards not already listed above. */
  inProgress: Objective[];
  /**
   * Open board work shown only when nothing is due/scheduled/in-progress today —
   * so undated todos still appear in the hero instead of a false "clear day".
   */
  onBoard: Objective[];
  /** IDs already rendered in the agenda — Up next must exclude these. */
  shownIds: Set<string>;
}

/**
 * Single source of truth for Dashboard Agenda + Up next partitioning.
 * Both surfaces read the same `axon:kanban:objectives` list; this helper
 * decides which bucket each active objective lands in so nothing duplicates.
 */
export function buildTodayAgenda(
  objectives: Objective[],
  now: Date = new Date()
): TodayAgendaBuckets {
  const active = objectives.filter((o) => o.status !== "done" && o.status !== "recycled");

  const overdue = active
    .filter((o) => isOverdue(o.dueDate, o.status) || isScheduleOverdue(o))
    .sort((a, b) => {
      const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return at - bt;
    })
    .slice(0, 5);

  const dueToday = active
    .filter(
      (o) =>
        o.dueDate &&
        isToday(o.dueDate, now) &&
        !isOverdue(o.dueDate, o.status) &&
        !overdue.some((x) => x.id === o.id)
    )
    .slice(0, 6);

  const scheduledToday = active
    .map((o) => {
      const event = getScheduledEvent(o);
      if (!event || !isSameDay(event.start, now) || isScheduleOverdue(o)) return null;
      return event;
    })
    .filter((e): e is ScheduledEvent => e !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 8);

  const focusBlocks = scheduledToday.filter((e) => e.objective.showOnKanban !== false);
  const calendarEvents = scheduledToday.filter((e) => e.objective.showOnKanban === false);

  const timedIds = new Set<string>([
    ...overdue.map((o) => o.id),
    ...dueToday.map((o) => o.id),
    ...scheduledToday.map((e) => e.objective.id),
  ]);

  const inProgress = active
    .filter(
      (o) =>
        o.status === "in-progress" &&
        o.showOnKanban !== false &&
        !timedIds.has(o.id)
    )
    .sort(sortOpenQueue)
    .slice(0, 5);

  const hasTimedOrProgress =
    overdue.length > 0 ||
    dueToday.length > 0 ||
    focusBlocks.length > 0 ||
    calendarEvents.length > 0 ||
    inProgress.length > 0;

  const onBoard = hasTimedOrProgress
    ? []
    : active
        .filter(
          (o) =>
            (o.status === "todo" || o.status === "in-progress") &&
            o.showOnKanban !== false
        )
        .sort(sortOpenQueue)
        .slice(0, 5);

  const shownIds = new Set<string>([
    ...timedIds,
    ...inProgress.map((o) => o.id),
    ...onBoard.map((o) => o.id),
  ]);

  return {
    overdue,
    dueToday,
    focusBlocks,
    calendarEvents,
    inProgress,
    onBoard,
    shownIds,
  };
}

/** Open Kanban objectives not already covered by the Today agenda buckets. */
export function buildUpNextQueue(objectives: Objective[], now: Date = new Date()): Objective[] {
  const { shownIds } = buildTodayAgenda(objectives, now);
  return objectives
    .filter(
      (o) =>
        (o.status === "todo" || o.status === "in-progress") &&
        o.showOnKanban !== false &&
        !shownIds.has(o.id)
    )
    .sort(sortOpenQueue)
    .slice(0, 5);
}
