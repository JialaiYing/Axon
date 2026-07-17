"use client";

import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDayTitle, formatMonthTitle, formatWeekRangeTitle } from "@/lib/calendar-utils";
import type { CalendarViewMode } from "@/hooks/use-calendar-state";

interface CalendarHeaderProps {
  view: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddExisting: () => void;
}

export function CalendarHeader({
  view,
  onViewChange,
  currentDate,
  onPrev,
  onNext,
  onToday,
  onAddExisting,
}: CalendarHeaderProps) {
  const title =
    view === "month"
      ? formatMonthTitle(currentDate)
      : view === "week"
        ? formatWeekRangeTitle(currentDate)
        : formatDayTitle(currentDate);

  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Calendar</h1>
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5">
          <button
            type="button"
            aria-label="Previous"
            onClick={onPrev}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition-colors duration-150 hover:bg-card hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="rounded-[5px] px-2.5 py-1 text-xs font-medium text-muted transition-colors duration-150 hover:bg-card hover:text-foreground"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={onNext}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] text-muted transition-colors duration-150 hover:bg-card hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="hidden text-sm text-muted sm:block">{title}</p>
      </div>

      <div className="flex items-center gap-2">
        <Tabs value={view} onValueChange={(v) => onViewChange(v as CalendarViewMode)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" onClick={onAddExisting}>
          <CalendarPlus className="h-4 w-4" />
          Add existing objective
        </Button>
      </div>

      <p className="text-sm text-muted sm:hidden">{title}</p>
    </div>
  );
}
