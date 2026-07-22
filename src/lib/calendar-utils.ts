import type { Objective } from "@/types";

export const MINUTES_IN_DAY = 24 * 60;

/** Pixels per hour in the week/day time grid — also drives drag/resize pixel↔minute math. */
export const HOUR_HEIGHT_PX = 64;
export const PX_PER_MINUTE = HOUR_HEIGHT_PX / 60;
export const GRID_STEP_MINUTES = 15;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  return addDays(d, -d.getDay());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** 6-row x 7-col grid of dates covering the full month, including leading/trailing days. */
export function getMonthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Returns a new Date on the same calendar day as `date`, at `minutes` past midnight (local time). */
export function withMinutesSinceMidnight(date: Date, minutes: number): Date {
  const d = startOfDay(date);
  d.setMinutes(minutes);
  return d;
}

export function clampMinutes(minutes: number, min = 0, max = MINUTES_IN_DAY): number {
  return Math.min(max, Math.max(min, minutes));
}

export function snapMinutes(minutes: number, step = 15): number {
  return Math.round(minutes / step) * step;
}

export function formatMonthTitle(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Google/Apple-style week range: "Jul 19–25, 2026" or "Jul 28 – Aug 3, 2026". */
export function formatWeekRangeTitle(date: Date): string {
  const days = getWeekDays(date);
  const first = days[0] ?? date;
  const last = days[6] ?? date;
  const sameYear = first.getFullYear() === last.getFullYear();
  const sameMonth = sameYear && first.getMonth() === last.getMonth();

  if (sameMonth) {
    const month = first.toLocaleDateString(undefined, { month: "short" });
    return `${month} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
  }

  if (sameYear) {
    const start = first.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const end = last.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${start} – ${end}, ${first.getFullYear()}`;
  }

  const start = first.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const end = last.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

/** Full day header: "Wednesday, July 22, 2026". */
export function formatDayTitle(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Compact column header date: "19" with weekday separate — keeps week chrome scannable. */
export function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export function formatTimeLabel(minutes: number): string {
  const normalized = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h < 12 ? "AM" : "PM";
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;
  return m === 0 ? `${displayHour} ${period}` : `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

export interface ScheduledEvent {
  objective: Objective;
  start: Date;
  end: Date;
  durationMinutes: number;
}

/** The single place that turns an objective's scheduling metadata into a renderable event. */
export function getScheduledEvent(objective: Objective): ScheduledEvent | null {
  if (!objective.scheduledStart) return null;
  const start = new Date(objective.scheduledStart);
  if (Number.isNaN(start.getTime())) return null;
  const durationMinutes = Math.max(5, objective.scheduledDurationMinutes ?? 30);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { objective, start, end, durationMinutes };
}

export function isPastEvent(event: ScheduledEvent, now: Date = new Date()): boolean {
  return event.end.getTime() < now.getTime();
}

interface OverlapLayout {
  event: ScheduledEvent;
  col: number;
  cols: number;
}

/**
 * Lays out overlapping same-day events for the week/day time grid: clusters
 * events that overlap in time, then greedily assigns each a column index
 * within its cluster so callers can render them side-by-side
 * (left = col/cols, width = 1/cols).
 */
export function layoutOverlaps(events: ScheduledEvent[]): OverlapLayout[] {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const result: OverlapLayout[] = [];
  let cluster: ScheduledEvent[] = [];
  let clusterEnd = -Infinity;

  function flushCluster() {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    for (const event of cluster) {
      let col = columnEnds.findIndex((endTime) => endTime <= event.start.getTime());
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(event.end.getTime());
      } else {
        columnEnds[col] = event.end.getTime();
      }
      result.push({ event, col, cols: 0 });
    }
    const cols = columnEnds.length;
    for (let i = result.length - cluster.length; i < result.length; i++) {
      const item = result[i];
      if (item) item.cols = cols;
    }
    cluster = [];
  }

  for (const event of sorted) {
    if (cluster.length > 0 && event.start.getTime() >= clusterEnd) {
      flushCluster();
      clusterEnd = -Infinity;
    }
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, event.end.getTime());
  }
  flushCluster();

  return result;
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a "YYYY-MM-DD" value as a *local* midnight Date (avoids the UTC-parsing pitfall of `new Date("YYYY-MM-DD")`). */
export function parseDateInputValue(value: string): Date {
  const [y = 1970, m = 1, d = 1] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toTimeInputValue(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Combines a "YYYY-MM-DD" date input value and "HH:MM" time input value into a local Date. */
export function combineDateAndTime(dateValue: string, timeValue: string): Date {
  const [y = 1970, m = 1, d = 1] = dateValue.split("-").map(Number);
  const [h = 0, min = 0] = timeValue.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}
