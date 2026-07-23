"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarRange, ChevronDown } from "lucide-react";
import { CalendarSkeleton } from "@/components/ui/skeleton";
import { EASE, DURATION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ObjectiveDialog } from "@/components/kanban/objective-dialog";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroTimers } from "@/hooks/use-pomodoro-timers";
import { useCalendarState } from "@/hooks/use-calendar-state";
import { startFocusSession } from "@/lib/pomodoro-utils";
import {
  MINUTES_IN_DAY,
  PX_PER_MINUTE,
  clampMinutes,
  getScheduledEvent,
  minutesSinceMidnight,
  parseDateInputValue,
  snapMinutes,
  withMinutesSinceMidnight,
  type ScheduledEvent,
} from "@/lib/calendar-utils";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import { AgendaPanel } from "@/components/calendar/agenda-panel";
import { UnscheduledRail } from "@/components/calendar/unscheduled-rail";
import { AddObjectiveDialog } from "@/components/calendar/add-objective-dialog";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import type { ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective } from "@/types";

interface DragData {
  objective: Objective;
  durationMinutes: number;
  originalStart?: string;
  fromUnscheduled?: boolean;
}

const DEFAULT_UNSCHEDULED_MINUTES = 9 * 60;

export function CalendarPage() {
  const {
    objectives,
    hydrated,
    addObjective,
    updateObjective,
    scheduleObjective,
    unscheduleObjective,
    startObjectiveSession,
  } = useObjectives();
  const { timers, hydrated: timersHydrated, startTimer, pauseTimer, resumeTimer, removeTimer } =
    usePomodoroTimers();
  const { view, setView, currentDate, setCurrentDate, goToday, goPrev, goNext } = useCalendarState();
  const prefersReducedMotion = useReducedMotion();

  function handleStopTimer(id: string) {
    removeTimer(id);
  }

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [editTarget, setEditTarget] = React.useState<Objective | null>(null);
  const [addTarget, setAddTarget] = React.useState<Date | null>(null);
  const [activeDrag, setActiveDrag] = React.useState<DragData | null>(null);
  const [mobileRailOpen, setMobileRailOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const visibleObjectives = React.useMemo(
    () => objectives.filter((o) => o.status !== "recycled"),
    [objectives]
  );

  const events = React.useMemo(() => {
    const list: ScheduledEvent[] = [];
    for (const objective of visibleObjectives) {
      const event = getScheduledEvent(objective);
      if (event) list.push(event);
    }
    return list;
  }, [visibleObjectives]);

  const unscheduledCount = React.useMemo(
    () =>
      visibleObjectives.filter(
        (o) => !o.scheduledStart && o.status !== "done" && o.status !== "recycled"
      ).length,
    [visibleObjectives]
  );

  function handleReschedule(objective: Objective, input: ScheduleInput) {
    scheduleObjective(objective.id, input);
  }

  function handleUnschedule(objective: Objective) {
    unscheduleObjective(objective.id);
  }

  function handleStartFocusSession(objective: Objective) {
    startFocusSession(
      objective,
      { timers, startObjectiveSession, startTimer, resumeTimer },
      objective.scheduledDurationMinutes
    );
  }

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current as DragData | undefined;
    if (data) setActiveDrag(data);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDrag(null);
    const data = e.active.data.current as DragData | undefined;
    if (!data || !e.over) return;
    const overId = String(e.over.id);
    if (!overId.startsWith("day:")) return;

    const targetDay = parseDateInputValue(overId.slice(4));
    let newMinutes = DEFAULT_UNSCHEDULED_MINUTES;

    if (!data.fromUnscheduled && data.originalStart) {
      newMinutes = minutesSinceMidnight(new Date(data.originalStart));
      if (view !== "month") {
        const deltaMinutes = e.delta.y / PX_PER_MINUTE;
        newMinutes = snapMinutes(
          clampMinutes(newMinutes + deltaMinutes, 0, MINUTES_IN_DAY - data.durationMinutes)
        );
      }
    }

    const newStart = withMinutesSinceMidnight(targetDay, newMinutes);
    scheduleObjective(data.objective.id, {
      start: newStart.toISOString(),
      durationMinutes: data.durationMinutes,
    });
  }

  function handleAddAt(day: Date, minutes: number) {
    setAddTarget(withMinutesSinceMidnight(day, minutes));
  }

  const isLoading = !hydrated || !timersHydrated;

  const rail = (
    <>
      <AgendaPanel
        objectives={visibleObjectives}
        timers={timers}
        hoveredId={hoveredId}
        onHover={setHoveredId}
        onSelect={setEditTarget}
        onPauseTimer={pauseTimer}
        onResumeTimer={resumeTimer}
        onStopTimer={handleStopTimer}
      />
      <UnscheduledRail
        objectives={visibleObjectives}
        defaultStart={currentDate}
        onSchedule={handleReschedule}
      />
    </>
  );

  return (
    <div className="relative">
      <FeatureIntro feature="calendar" />
      <CalendarHeader
        view={view}
        onViewChange={(v) => setView(v)}
        currentDate={currentDate}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onAddExisting={() => setAddTarget(withMinutesSinceMidnight(currentDate, DEFAULT_UNSCHEDULED_MINUTES))}
        scheduledObjectives={visibleObjectives}
      />

      {isLoading ? (
        <CalendarSkeleton />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : DURATION.section, ease: EASE }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]"
          >
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                <motion.div key={view}>
                  {view === "month" && (
                    <MonthView
                      currentDate={currentDate}
                      events={events}
                      timers={timers}
                      hoveredId={hoveredId}
                      onHover={setHoveredId}
                      onStartFocusSession={handleStartFocusSession}
                      onResumeTimer={resumeTimer}
                      onReschedule={handleReschedule}
                      onUnschedule={handleUnschedule}
                      onViewEdit={setEditTarget}
                      onAddForDay={(day) =>
                        setAddTarget(withMinutesSinceMidnight(day, DEFAULT_UNSCHEDULED_MINUTES))
                      }
                    />
                  )}
                  {view === "week" && (
                    <WeekView
                      currentDate={currentDate}
                      events={events}
                      timers={timers}
                      hoveredId={hoveredId}
                      onHover={setHoveredId}
                      onStartFocusSession={handleStartFocusSession}
                      onResumeTimer={resumeTimer}
                      onReschedule={handleReschedule}
                      onUnschedule={handleUnschedule}
                      onViewEdit={setEditTarget}
                      onAddAt={handleAddAt}
                    />
                  )}
                  {view === "day" && (
                    <DayView
                      currentDate={currentDate}
                      events={events}
                      timers={timers}
                      hoveredId={hoveredId}
                      onHover={setHoveredId}
                      onStartFocusSession={handleStartFocusSession}
                      onResumeTimer={resumeTimer}
                      onReschedule={handleReschedule}
                      onUnschedule={handleUnschedule}
                      onViewEdit={setEditTarget}
                      onAddAt={handleAddAt}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <aside className="flex flex-col gap-3 lg:gap-4">
              <button
                type="button"
                onClick={() => setMobileRailOpen((open) => !open)}
                className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-left light:border-border light:bg-card lg:hidden"
                aria-expanded={mobileRailOpen}
              >
                <span className="text-[13px] font-medium text-foreground">
                  Agenda
                  <span className="ml-1.5 font-mono text-[11px] font-medium text-muted-foreground">
                    · {unscheduledCount} unscheduled
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    mobileRailOpen && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "flex flex-col gap-3",
                  mobileRailOpen ? "flex" : "hidden lg:flex"
                )}
              >
                {rail}
              </div>
            </aside>
          </motion.div>

          <DragOverlay>
            {activeDrag ? (
              <div className="pointer-events-none w-56 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-elevation-2)]">
                <span className="flex items-center gap-1.5">
                  <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
                  {activeDrag.objective.title}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <ObjectiveDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        mode="edit"
        objective={editTarget ?? undefined}
        dependencyCandidates={objectives}
        onSubmit={(input) => {
          if (editTarget) updateObjective(editTarget.id, input);
        }}
      />

      {addTarget && (
        <AddObjectiveDialog
          open={addTarget !== null}
          onOpenChange={(open) => !open && setAddTarget(null)}
          objectives={visibleObjectives}
          targetDate={addTarget}
          onPick={(objective, start) => {
            const duration =
              objective.scheduledDurationMinutes ??
              (objective.estimatedStudyTime && objective.estimatedStudyTime > 0
                ? objective.estimatedStudyTime
                : 30);
            scheduleObjective(objective.id, {
              start: start.toISOString(),
              durationMinutes: duration,
            });
            setAddTarget(null);
          }}
          onCreateEvent={(input) => {
            addObjective({
              title: input.title,
              subject: input.subject,
              priority: input.priority,
              progress: 0,
              labels: [],
              status: "todo",
              estimatedStudyTime: input.durationMinutes,
              scheduledStart: input.start?.toISOString(),
              scheduledDurationMinutes: input.start ? input.durationMinutes : undefined,
              showOnKanban: input.showOnKanban,
              color: input.color,
              notes: input.notes,
              location: input.location,
              recurrence: input.recurrence,
            });
            setAddTarget(null);
          }}
        />
      )}
    </div>
  );
}
