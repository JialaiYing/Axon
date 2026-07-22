import { AUTO_RECYCLE_AFTER_DAYS, PRIORITY_WEIGHT, RECYCLE_BIN_RETENTION_DAYS } from "@/constants/kanban";
import type { Objective, Priority } from "@/types";

export function priorityBadgeVariant(priority: Priority) {
  switch (priority) {
    case "urgent":
      return "danger" as const;
    case "high":
      return "warning" as const;
    case "medium":
      return "default" as const;
    case "low":
    default:
      return "default" as const;
  }
}

/** Dot-color class for the flat priority indicator (dot + text label) used in
 *  place of a bordered pill on repeated list rows — same semantics as
 *  `priorityBadgeVariant`, just as a plain color instead of a pill. */
export function priorityDotClass(priority: Priority) {
  switch (priority) {
    case "urgent":
      return "bg-danger" as const;
    case "high":
      return "bg-warning" as const;
    case "medium":
      return "bg-muted" as const;
    case "low":
    default:
      return "bg-foreground/35" as const;
  }
}

/** Text-color class paired with `priorityDotClass` for the same row. */
export function priorityTextClass(priority: Priority) {
  switch (priority) {
    case "urgent":
      return "text-danger" as const;
    case "high":
      return "text-warning" as const;
    case "medium":
      return "text-muted" as const;
    case "low":
    default:
      return "text-foreground/60" as const;
  }
}

export function formatDueDate(dueDate?: string): string | null {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === "done") return false;
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

export function formatEstimatedTime(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

export function parseLabels(raw: string): string[] {
  return raw
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

/**
 * Sorts objectives so higher priority appears first, using each item's
 * position in the incoming array as a stable tiebreaker — this lets manual
 * drag-reordering still take effect *within* a priority tier.
 */
export function sortByPriority(objectives: Objective[]): Objective[] {
  return objectives
    .map((objective, index) => ({ objective, index }))
    .sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHT[b.objective.priority] - PRIORITY_WEIGHT[a.objective.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.index - b.index;
    })
    .map((entry) => entry.objective);
}

export function formatCreatedDate(createdAt?: string): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function daysSince(dateIso?: string): number | null {
  if (!dateIso) return null;
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return null;
  const ms = Date.now() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Days remaining before a "done" card auto-moves to the recycle bin. */
export function daysUntilAutoRecycle(completedAt?: string): number | null {
  const elapsed = daysSince(completedAt);
  if (elapsed === null) return null;
  return Math.max(0, AUTO_RECYCLE_AFTER_DAYS - elapsed);
}

/** Days remaining before a recycled card is permanently deleted. */
export function daysUntilPermanentDelete(recycledAt?: string): number | null {
  const elapsed = daysSince(recycledAt);
  if (elapsed === null) return null;
  return Math.max(0, RECYCLE_BIN_RETENTION_DAYS - elapsed);
}

/** Total minutes already logged against an objective via focus sessions. */
export function loggedMinutes(objective: Objective): number {
  return (objective.studySessions ?? []).reduce((sum, session) => sum + session.minutes, 0);
}

/**
 * Whether an objective may move to Done from the board / form / dashboard.
 * When an estimate exists, focus time must be fully logged. When subtasks
 * exist, they must all be done. Explicit "Finished" from the timer dialog
 * still calls `completeObjective` directly and bypasses this gate.
 */
export function canMarkObjectiveDone(objective: Objective): boolean {
  if (objective.status === "done") return true;
  const hasEstimate = Boolean(objective.estimatedStudyTime && objective.estimatedStudyTime > 0);
  const hasSubtasks = Boolean(objective.subtasks && objective.subtasks.length > 0);

  if (hasEstimate && loggedMinutes(objective) < (objective.estimatedStudyTime as number)) {
    return false;
  }
  if (hasSubtasks && !objective.subtasks!.every((s) => s.done)) {
    return false;
  }
  // No estimate and no subtasks — allow Done without a timer gate.
  return true;
}

/** Minutes remaining before an objective's estimated study time is used up (never negative). */
export function remainingMinutes(objective: Objective): number | null {
  if (!objective.estimatedStudyTime) return null;
  return Math.max(0, objective.estimatedStudyTime - loggedMinutes(objective));
}

/** Compact "Thu, Jan 8 · 2:30 PM" label for a scheduled objective — shared by the Kanban card and Calendar. */
export function formatScheduledDateTime(scheduledStart?: string): string | null {
  if (!scheduledStart) return null;
  const date = new Date(scheduledStart);
  if (Number.isNaN(date.getTime())) return null;
  const datePart = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timePart = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

/** True once a scheduled block's end time has passed and the objective still isn't done. */
export function isScheduleOverdue(objective: Objective): boolean {
  if (!objective.scheduledStart || objective.status === "done") return false;
  const start = new Date(objective.scheduledStart);
  if (Number.isNaN(start.getTime())) return false;
  const duration = objective.scheduledDurationMinutes ?? 30;
  return start.getTime() + duration * 60000 < Date.now();
}
