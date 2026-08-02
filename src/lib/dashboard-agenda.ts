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

const CAPS = {
  overdue: 5,
  dueToday: 6,
  focusBlocks: 6,
  calendarEvents: 6,
  inProgress: 5,
  onBoard: 5,
} as const;

function sortOpenQueue(a: Objective, b: Objective) {
  const aTime = a.scheduledStart ?? a.dueDate;
  const bTime = b.scheduledStart ?? b.dueDate;
  if (aTime && bTime) return new Date(aTime).getTime() - new Date(bTime).getTime();
  if (aTime) return -1;
  if (bTime) return 1;
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

function overflow(total: number, shown: number): number {
  return Math.max(0, total - shown);
}

export interface TodayAgendaBuckets {
  overdue: Objective[];
  dueToday: Objective[];
  focusBlocks: ScheduledEvent[];
  calendarEvents: ScheduledEvent[];
  /** In-progress board cards not already listed above. */
  inProgress: Objective[];
  /**
   * Open board work shown only when nothing is due/scheduled/in-progress today —
   * so undated todos still appear in the hero instead of a false "clear day".
   */
  onBoard: Objective[];
  /** Hidden items beyond each section cap — for "+N more" links. */
  more: {
    overdue: number;
    dueToday: number;
    focusBlocks: number;
    calendarEvents: number;
    inProgress: number;
    onBoard: number;
  };
  /** Uncapped overdue + due-today count (Dashboard stats). */
  openTodayCount: number;
}

/**
 * Single source of truth for the Dashboard Today agenda.
 * Reads `axon:kanban:objectives` and buckets active work so nothing duplicates.
 */
export function buildTodayAgenda(
  objectives: Objective[],
  now: Date = new Date()
): TodayAgendaBuckets {
  const active = objectives.filter((o) => o.status !== "done" && o.status !== "recycled");

  const overdueAll = active
    .filter((o) => isOverdue(o.dueDate, o.status) || isScheduleOverdue(o))
    .sort((a, b) => {
      const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return at - bt;
    });
  const overdue = overdueAll.slice(0, CAPS.overdue);

  const dueTodayAll = active.filter(
    (o) =>
      o.dueDate &&
      isToday(o.dueDate, now) &&
      !isOverdue(o.dueDate, o.status) &&
      !overdueAll.some((x) => x.id === o.id)
  );
  const dueToday = dueTodayAll.slice(0, CAPS.dueToday);

  const scheduledTodayAll = active
    .map((o) => {
      const event = getScheduledEvent(o);
      if (!event || !isSameDay(event.start, now) || isScheduleOverdue(o)) return null;
      return event;
    })
    .filter((e): e is ScheduledEvent => e !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Cap focus vs calendar separately so one type can't silence the other's overflow.
  const focusBlocksAll = scheduledTodayAll.filter((e) => e.objective.showOnKanban !== false);
  const calendarEventsAll = scheduledTodayAll.filter((e) => e.objective.showOnKanban === false);
  const focusBlocks = focusBlocksAll.slice(0, CAPS.focusBlocks);
  const calendarEvents = calendarEventsAll.slice(0, CAPS.calendarEvents);

  const timedIds = new Set<string>([
    ...overdueAll.map((o) => o.id),
    ...dueTodayAll.map((o) => o.id),
    ...scheduledTodayAll.map((e) => e.objective.id),
  ]);

  const inProgressAll = active
    .filter(
      (o) =>
        o.status === "in-progress" &&
        o.showOnKanban !== false &&
        !timedIds.has(o.id)
    )
    .sort(sortOpenQueue);
  const inProgress = inProgressAll.slice(0, CAPS.inProgress);

  const hasTimedOrProgress =
    overdueAll.length > 0 ||
    dueTodayAll.length > 0 ||
    focusBlocksAll.length > 0 ||
    calendarEventsAll.length > 0 ||
    inProgressAll.length > 0;

  const onBoardAll = hasTimedOrProgress
    ? []
    : active
        .filter(
          (o) =>
            (o.status === "todo" || o.status === "in-progress") &&
            o.showOnKanban !== false
        )
        .sort(sortOpenQueue);
  const onBoard = onBoardAll.slice(0, CAPS.onBoard);

  return {
    overdue,
    dueToday,
    focusBlocks,
    calendarEvents,
    inProgress,
    onBoard,
    more: {
      overdue: overflow(overdueAll.length, overdue.length),
      dueToday: overflow(dueTodayAll.length, dueToday.length),
      focusBlocks: overflow(focusBlocksAll.length, focusBlocks.length),
      calendarEvents: overflow(calendarEventsAll.length, calendarEvents.length),
      inProgress: overflow(inProgressAll.length, inProgress.length),
      onBoard: overflow(onBoardAll.length, onBoard.length),
    },
    openTodayCount: overdueAll.length + dueTodayAll.length,
  };
}
