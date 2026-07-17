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
  /**
   * Scheduling metadata — when the user actually plans to work on this
   * objective. Optional and intentionally separate from `dueDate` (the
   * deadline) and `estimatedStudyTime` (the plan-level estimate). Lives
   * directly on the objective so the Calendar has nothing of its own to
   * duplicate: it only ever renders objectives that already exist.
   */
  scheduledStart?: string; // ISO datetime
  /** Length of the scheduled block, in minutes. Independent of estimatedStudyTime. */
  scheduledDurationMinutes?: number;
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
/** Which kind of focus session the Pomodoro section is currently set up for. */
export type TimerSource = "objective" | "personal";

/** Lifecycle of one running Pomodoro timer instance in the multi-timer list. */
export type TimerRunStatus = "running" | "paused" | "finished";

/**
 * One entry in the multi-timer list. Countdown accuracy across reloads/
 * backgrounding comes from `endAt` (an absolute epoch-ms timestamp) rather
 * than a naive per-second counter — remaining time is always derived as
 * `endAt - Date.now()` while running.
 */
export interface PomodoroTimerInstance {
  id: string;
  source: TimerSource;
  /** Objective title, or the personal timer's label. */
  label: string;
  /** Present when this timer is tracking a kanban objective (source "objective",
   *  or a personal timer whose "Add to Kanban board?" toggle created a card). */
  objectiveId?: string;
  /** The full configured duration of the current run, in seconds. Restart and
   *  "keep working" extensions both operate against this value. */
  durationSeconds: number;
  /** Epoch ms when this run reaches zero. Null while paused or finished. */
  endAt: number | null;
  /** Snapshotted remaining seconds at the moment of pausing. Null while running or finished. */
  pausedRemainingSeconds: number | null;
  status: TimerRunStatus;
  createdAt: string;
  /** True once this timer's completion has already been logged, so the
   *  reach-zero effect never double-logs across renders/ticks. */
  loggedCompletion?: boolean;
  /** True once a "timer finished" notification has been raised for this run,
   *  so the global watcher never double-notifies across renders/ticks. */
  notified?: boolean;
}

/** A notification raised when a timer finishes, archived in the header's notification bell. */
export interface TimerNotification {
  id: string;
  timerId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
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
