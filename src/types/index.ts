export * from "./navigation";

export type Priority = "low" | "medium" | "high" | "urgent";

/** "recycled" objectives are excluded from the kanban board and live only in the recycle bin. */
export type ObjectiveStatus = "todo" | "in-progress" | "done" | "recycled";

/** The three statuses that are actually rendered/draggable as kanban columns. */
export type KanbanStatus = "todo" | "in-progress" | "done";

export interface Objective {
  id: string;
  title: string;
  description?: string;
  subject: string;
  priority: Priority;
  dueDate?: string;
  estimatedStudyTime?: number; // minutes
  progress: number; // 0-100
  labels: string[];
  status: ObjectiveStatus;
  createdAt: string;
  updatedAt: string;
  /** Set when the objective is moved into the "done" column. Drives the 7-day auto-recycle. */
  completedAt?: string;
  /** Set when the objective is sent to the recycle bin. Drives the 30-day auto-delete. */
  recycledAt?: string;
  color?: string;
  notes?: string;
  // Reserved for future phases
  subtasks?: { id: string; title: string; done: boolean }[];
  attachments?: { id: string; name: string; url: string }[];
  studySessions?: { id: string; date: string; minutes: number }[];
  dependencies?: string[];
}

export interface FlashcardSet {
  id: string;
  title: string;
  description?: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  cards: Flashcard[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  correctCount: number;
  incorrectCount: number;
  masteryPercent: number;
}

export interface PomodoroSession {
  id: string;
  date: string;
  durationMinutes: number;
  type: "work" | "short-break" | "long-break";
  completed: boolean;
  /** Present when this session was focused on a specific kanban objective. */
  objectiveId?: string;
  /** Present when this was an ad-hoc timer not tied to any objective. */
  label?: string;
}

/** How the running timer is visualized in the Pomodoro section. */
export type TimerDisplayMode = "digital" | "blob";

/** Which kind of focus session the Pomodoro section is currently set up for. */
export type TimerSource = "objective" | "personal";

export interface Goal {
  id: string;
  title: string;
  type: "daily" | "weekly";
  target: number;
  progress: number;
  unit: string;
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

export interface UserStats {
  xp: number;
  level: number;
  rank: string;
  currentStreak: number;
  longestStreak: number;
  intervalsCompleted: number;
  productivityIndex: number;
}
