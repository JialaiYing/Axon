import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export type Priority = "low" | "medium" | "high" | "urgent";

/** "recycled" objectives are excluded from the kanban board and live only in the recycle bin. */
export type ObjectiveStatus = "todo" | "in-progress" | "done" | "recycled";

/** The three statuses that are actually rendered/draggable as kanban columns. */
export type KanbanStatus = "todo" | "in-progress" | "done";

/** How often a completed/due objective should spawn a new occurrence. */
export type Recurrence = "none" | "daily" | "weekly";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
}

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
  /**
   * Whether this objective appears as a card on the Kanban board.
   * Calendar-only events set this to false — they still live in the same
   * objectives store (one source of truth) but are filtered out of board
   * columns. Omit / true = visible on the board.
   */
  showOnKanban?: boolean;
  /** Checklist items. When present, progress is derived from completion ratio. */
  subtasks?: Subtask[];
  /** Simple name+URL links attached to the objective. */
  attachments?: Attachment[];
  studySessions?: { id: string; date: string; minutes: number }[];
  /** IDs of objectives that block this one ("blocked by"). */
  dependencies?: string[];
  /** When set (and not "none"), housekeeping spawns the next occurrence on completion. */
  recurrence?: Recurrence;
  /** Links a spawned occurrence back to its template/previous instance. */
  recurrenceParentId?: string;
}

export interface FlashcardFolder {
  id: string;
  title: string;
  /** Optional user-uploaded thumbnail (data URL) shown on the folder icon. */
  imageDataUrl?: string;
  /** Accent color for the folder icon. */
  color: string;
  createdAt: string;
  /** Bumped whenever the folder is opened — drives the "Recents" list. */
  lastOpenedAt?: string;
  /**
   * Whether this folder appears as a column in the dome gallery.
   * Defaults to true when missing (single source of truth: omit = visible).
   */
  showInDome?: boolean;
  /** Whether this folder appears in the home "Pinned" list. */
  pinned?: boolean;
}

export interface FlashcardSet {
  id: string;
  title: string;
  description?: string;
  subject: string;
  /** Folder this set lives in; undefined = unfiled. */
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  /** Bumped whenever the set is opened — drives "Jump right back in". */
  lastOpenedAt?: string;
  /** Whether this set appears in the home "Pinned" list. */
  pinned?: boolean;
  /** Set the moment a full study pass or test run is finished — drives the home "Completed" list. */
  completedAt?: string;
  /** Most recent Test-mode result, shown as a score badge next to completed sets. */
  lastTestResult?: {
    correct: number;
    total: number;
    completedAt: string;
  };
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

export type AppNotificationKind = "timer" | "due-soon";

/** Archived in-app notification shown in the header bell. */
export interface TimerNotification {
  id: string;
  /** Legacy field — timer id, or a synthetic key for non-timer kinds. */
  timerId: string;
  kind?: AppNotificationKind;
  href?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Goal {
  id: string;
  title: string;
  type: "daily" | "weekly";
  /** Study goals auto-track from Pomodoro/Kanban; personal goals are manual. */
  category?: "study" | "personal";
  /** How progress is measured — personal goals default to manual. */
  tracking?: "auto" | "manual";
  target: number;
  progress: number;
  unit: string;
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

/** Closed period result for a tracked goal (daily midnight / weekly Monday reset). */
export interface GoalHistoryEntry {
  id: string;
  goalId: string;
  type: "daily" | "weekly";
  /** Daily: `YYYY-MM-DD`. Weekly: Monday's `YYYY-MM-DD`. */
  periodKey: string;
  progress: number;
  target: number;
  hit: boolean;
  recordedAt: string;
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
