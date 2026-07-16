import type { ObjectiveStatus, Priority } from "@/types";

export interface KanbanColumnDef {
  id: ObjectiveStatus;
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
