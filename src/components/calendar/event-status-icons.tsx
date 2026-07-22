"use client";

import { AlertTriangle, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { isScheduleOverdue } from "@/lib/kanban-utils";
import { isPastEvent, type ScheduledEvent } from "@/lib/calendar-utils";
import type { Objective } from "@/types";

/** Compact glance icons: muted alert (missed/overdue) + recurring loop. */
export function EventStatusIcons({
  objective,
  event,
  className,
}: {
  objective: Objective;
  event?: ScheduledEvent;
  className?: string;
}) {
  const isDone = objective.status === "done";
  const missed =
    !isDone && (isScheduleOverdue(objective) || (event ? isPastEvent(event) : false));
  const recurring = Boolean(objective.recurrence && objective.recurrence !== "none");

  if (!missed && !recurring) return null;

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-0.5", className)}>
      {missed && (
        <span title="Missed or overdue" className="text-warning/80">
          <AlertTriangle className="h-3 w-3" aria-hidden />
          <span className="sr-only">Missed or overdue</span>
        </span>
      )}
      {recurring && (
        <span
          title={objective.recurrence === "daily" ? "Repeats daily" : "Repeats weekly"}
          className="text-muted-foreground"
        >
          <Repeat className="h-3 w-3" aria-hidden />
          <span className="sr-only">
            {objective.recurrence === "daily" ? "Repeats daily" : "Repeats weekly"}
          </span>
        </span>
      )}
    </span>
  );
}

export function eventAccentColor(objective: Objective): string {
  return objective.color ?? "var(--color-accent)";
}

export function hasExpandableDetails(objective: Objective): boolean {
  const isCalendarOnly = objective.showOnKanban === false;
  return Boolean(
    (isCalendarOnly && objective.location?.trim()) ||
      objective.description?.trim() ||
      objective.notes?.trim()
  );
}
