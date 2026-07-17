"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { addDays, addMonths, startOfDay } from "@/lib/calendar-utils";

export type CalendarViewMode = "month" | "week" | "day";
const VIEW_MODES = new Set(["month", "week", "day"]);

/** View mode is remembered across visits; the focused date always starts on "today". */
export function useCalendarState() {
  const [rawView, setRawView, hydrated] = useLocalStorage<CalendarViewMode>("axon:calendar:view", "week");
  const view = VIEW_MODES.has(rawView) ? rawView : "week";
  const setView = React.useCallback(
    (next: CalendarViewMode) => setRawView(VIEW_MODES.has(next) ? next : "week"),
    [setRawView]
  );
  const [currentDate, setCurrentDate] = React.useState<Date>(() => startOfDay(new Date()));

  const goToday = React.useCallback(() => setCurrentDate(startOfDay(new Date())), []);

  const goPrev = React.useCallback(() => {
    setCurrentDate((d) => (view === "month" ? addMonths(d, -1) : view === "week" ? addDays(d, -7) : addDays(d, -1)));
  }, [view]);

  const goNext = React.useCallback(() => {
    setCurrentDate((d) => (view === "month" ? addMonths(d, 1) : view === "week" ? addDays(d, 7) : addDays(d, 1)));
  }, [view]);

  const goToDate = React.useCallback((date: Date) => setCurrentDate(startOfDay(date)), []);

  return { view, setView, hydrated, currentDate, setCurrentDate: goToDate, goToday, goPrev, goNext };
}
