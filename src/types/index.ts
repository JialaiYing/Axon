export * from "./navigation";

export type Priority = "low" | "medium" | "high" | "urgent";

export type ObjectiveStatus = "todo" | "in-progress" | "done";

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
}

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
