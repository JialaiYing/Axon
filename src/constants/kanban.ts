import type { KanbanStatus, Priority } from "@/types";

export interface KanbanColumnDef {
  id: KanbanStatus;
  title: string;
  description: string;
}

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: "todo", title: "To Go Queue", description: "Not started yet" },
  { id: "in-progress", title: "In Progress", description: "Currently working" },
  { id: "done", title: "Finished", description: "Completed objectives" },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

/** Higher weight sorts higher in a column. */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/** Objectives move from "done" to the recycle bin automatically after this many days. */
export const AUTO_RECYCLE_AFTER_DAYS = 7;

/** Objectives are permanently deleted from the recycle bin after this many days. */
export const RECYCLE_BIN_RETENTION_DAYS = 30;

export const SUBJECT_SUGGESTIONS = [
  "Math",
  "Biology",
  "Chemistry",
  "Physics",
  "History",
  "English",
  "Computer Science",
  "Economics",
];

export const OBJECTIVE_COLORS = [
  "#3b82f6", // accent blue
  "#a855f7", // secondary purple
  "#22c55e", // success green
  "#f59e0b", // warning amber
  "#ef4444", // danger red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#6b7185", // neutral
];
