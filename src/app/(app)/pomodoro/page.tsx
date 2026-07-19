"use client";

import * as React from "react";
import { Flame, Timer as TimerIcon, Play } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfettiBurst } from "@/components/ui/confetti";
import { ObjectivePickerSkeleton } from "@/components/ui/skeleton";
import { TimerCard } from "@/components/pomodoro/timer-card";
import { TimerFullscreenOverlay } from "@/components/pomodoro/timer-fullscreen";
import { ObjectivePicker } from "@/components/pomodoro/objective-picker";
import { PersonalTimerForm } from "@/components/pomodoro/personal-timer-form";
import { FinishSessionDialog } from "@/components/pomodoro/finish-session-dialog";
import {
  SessionSummaryDialog,
  type SessionSummaryStats,
} from "@/components/pomodoro/session-summary-dialog";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroTimers, remainingSecondsOf } from "@/hooks/use-pomodoro-timers";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useUserStats } from "@/hooks/use-user-stats";
import { useFocusPreferences } from "@/hooks/use-focus-preferences";
import { useLocalStorage, asArray } from "@/hooks/use-local-storage";
import { clampPersonalMinutes, startFocusSession } from "@/lib/pomodoro-utils";
import { focusSessionXp } from "@/lib/progress/xp-rules";
import { isToday as isTodayDate } from "@/lib/goals-utils";
import type { Objective, TimerDisplayMode, TimerSource } from "@/types";

export default function PomodoroPage() {
  const { objectives, hydrated, addObjective, updateObjective, deleteObjective, startObjectiveSession, logStudyTime, completeObjective } =
    useObjectives();
  const { logSession, todaySessions, todayFocusMinutes } = usePomodoroSessions();
  const { timers, hydrated: timersHydrated, startTimer, pauseTimer, resumeTimer, stopTimer, removeTimer, extendTimer } =
    usePomodoroTimers();
  const { stats } = useUserStats();
  const { preferences: focusPreferences } = useFocusPreferences();
  const [displayMode, setDisplayMode] = useLocalStorage<TimerDisplayMode>(
    "axon:pomodoro:displayMode",
    "digital"
  );

  const [source, setSource] = React.useState<TimerSource>("objective");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [personalLabel, setPersonalLabel] = React.useState("");
  const [personalMinutes, setPersonalMinutes] = React.useState(25);
  const [celebrateKey, setCelebrateKey] = React.useState(0);
  const [summaryQueue, setSummaryQueue] = React.useState<string[]>([]);
  const [finishQueue, setFinishQueue] = React.useState<string[]>([]);
  const [addToKanban, setAddToKanban] = React.useState(false);
  const [personalLinkedObjectiveId, setPersonalLinkedObjectiveId] = React.useState<string | null>(null);
  const [fullscreenTimerId, setFullscreenTimerId] = React.useState<string | null>(null);
  const knownTimerIds = React.useRef<Set<string>>(new Set());
  const summarizedIds = React.useRef<Set<string>>(new Set());
  const [hiddenObjectiveIds, setHiddenObjectiveIds] = useLocalStorage<string[]>(
    "axon:pomodoro:hiddenObjectiveIds",
    []
  );
  const [showHidden, setShowHidden] = React.useState(false);

  // Objectives already being timed (running or paused) can't be picked again.
  const activeObjectiveIds = React.useMemo(
    () =>
      new Set(
        timers.filter((t) => t.status !== "finished" && t.objectiveId).map((t) => t.objectiveId as string)
      ),
    [timers]
  );
  const eligibleObjectives = React.useMemo(
    () =>
      objectives.filter(
        (o) =>
          (o.status === "todo" || o.status === "in-progress") &&
          o.showOnKanban !== false &&
          !activeObjectiveIds.has(o.id)
      ),
    [objectives, activeObjectiveIds]
  );
  const selectedObjective = React.useMemo(
    () => eligibleObjectives.find((o) => o.id === selectedId) ?? null,
    [eligibleObjectives, selectedId]
  );
  const hiddenIdSet = React.useMemo(
    () => new Set(asArray<string>(hiddenObjectiveIds)),
    [hiddenObjectiveIds]
  );
  const visibleEligibleObjectives = React.useMemo(
    () => eligibleObjectives.filter((o) => !hiddenIdSet.has(o.id)),
    [eligibleObjectives, hiddenIdSet]
  );
  const hiddenEligibleObjectives = React.useMemo(
    () => eligibleObjectives.filter((o) => hiddenIdSet.has(o.id)),
    [eligibleObjectives, hiddenIdSet]
  );

  function handleToggleHiddenObjective(objective: Objective) {
    setHiddenObjectiveIds((prev) => {
      const safePrev = asArray<string>(prev);
      return safePrev.includes(objective.id)
        ? safePrev.filter((id) => id !== objective.id)
        : [...safePrev, objective.id];
    });
  }

  const fullscreenTimer = React.useMemo(
    () => timers.find((t) => t.id === fullscreenTimerId) ?? null,
    [timers, fullscreenTimerId]
  );

  // If a fullscreened timer gets removed elsewhere (finish dialog, stop, or
  // the objective-edit edge case below), fall back to the regular grid view.
  React.useEffect(() => {
    if (fullscreenTimerId && !timers.some((t) => t.id === fullscreenTimerId)) {
      setFullscreenTimerId(null);
    }
  }, [timers, fullscreenTimerId]);

  // Auto-enter Focus Mode when a new running timer appears (preference-gated).
  React.useEffect(() => {
    if (!timersHydrated || !focusPreferences.autoEnterFocusMode) return;
    const currentIds = new Set(timers.map((t) => t.id));
    for (const timer of timers) {
      if (
        timer.status === "running" &&
        !knownTimerIds.current.has(timer.id)
      ) {
        setFullscreenTimerId(timer.id);
      }
    }
    knownTimerIds.current = currentIds;
  }, [timers, timersHydrated, focusPreferences.autoEnterFocusMode]);

  // Keep the queued card's title/estimated time in sync with the personal
  // timer form while it's still sitting untouched in "todo". If it's been
  // moved elsewhere (started via another path), leave it alone.
  React.useEffect(() => {
    if (!addToKanban || !personalLinkedObjectiveId) return;
    const linked = objectives.find((o) => o.id === personalLinkedObjectiveId);
    if (!linked || linked.status !== "todo") return;
    const nextTitle = personalLabel.trim() || "Personal focus session";
    const nextMinutes = clampPersonalMinutes(personalMinutes);
    if (linked.title === nextTitle && linked.estimatedStudyTime === nextMinutes) return;
    updateObjective(personalLinkedObjectiveId, {
      title: nextTitle,
      estimatedStudyTime: nextMinutes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalLabel, personalMinutes, addToKanban, personalLinkedObjectiveId, objectives]);

  function handleAddToKanbanChange(next: boolean) {
    setAddToKanban(next);
    if (next) {
      const created = addObjective({
        title: personalLabel.trim() || "Personal focus session",
        subject: "Personal",
        priority: "medium",
        estimatedStudyTime: clampPersonalMinutes(personalMinutes),
        progress: 0,
        labels: [],
        status: "todo",
      });
      setPersonalLinkedObjectiveId(created.id);
    } else if (personalLinkedObjectiveId) {
      const linked = objectives.find((o) => o.id === personalLinkedObjectiveId);
      if (linked && linked.status === "todo") {
        deleteObjective(personalLinkedObjectiveId);
      }
      setPersonalLinkedObjectiveId(null);
    }
  }

  // Session summary first for every finished timer, then the objective prompt.
  React.useEffect(() => {
    if (!timersHydrated) return;
    timers.forEach((t) => {
      if (t.status !== "finished") return;
      if (summarizedIds.current.has(t.id)) return;
      summarizedIds.current.add(t.id);
      setSummaryQueue((q) => (q.includes(t.id) ? q : [...q, t.id]));
      if (fullscreenTimerId === t.id) setFullscreenTimerId(null);
    });
  }, [timers, timersHydrated, fullscreenTimerId]);

  const activeSummaryId = summaryQueue[0] ?? null;
  const activeSummaryTimer = React.useMemo(
    () => timers.find((t) => t.id === activeSummaryId) ?? null,
    [timers, activeSummaryId]
  );
  const tasksDoneToday = React.useMemo(
    () =>
      objectives.filter(
        (o) => o.status === "done" && o.completedAt && isTodayDate(o.completedAt)
      ).length,
    [objectives]
  );
  const activeSummaryStats: SessionSummaryStats | null = React.useMemo(() => {
    if (!activeSummaryTimer) return null;
    const focusedMinutes = Math.max(0, Math.round(activeSummaryTimer.durationSeconds / 60));
    return {
      focusedMinutes,
      sessionXp: focusSessionXp(focusedMinutes),
      streakDays: stats.currentStreak,
      tasksDoneToday,
      label: activeSummaryTimer.label,
    };
  }, [activeSummaryTimer, stats.currentStreak, tasksDoneToday]);

  const activeFinishId = finishQueue[0] ?? null;
  const activeFinishTimer = React.useMemo(
    () => timers.find((t) => t.id === activeFinishId) ?? null,
    [timers, activeFinishId]
  );
  const activeFinishObjective = React.useMemo(
    () => (activeFinishTimer?.objectiveId ? objectives.find((o) => o.id === activeFinishTimer.objectiveId) : null),
    [objectives, activeFinishTimer]
  );

  function dequeueSummary(id: string) {
    setSummaryQueue((q) => q.filter((x) => x !== id));
  }

  function dequeueFinish(id: string) {
    setFinishQueue((q) => q.filter((x) => x !== id));
  }

  function handleSummaryContinue() {
    if (!activeSummaryTimer) return;
    const timer = activeSummaryTimer;
    dequeueSummary(timer.id);
    if (timer.source === "objective" && timer.objectiveId) {
      setFinishQueue((q) => (q.includes(timer.id) ? q : [...q, timer.id]));
    } else {
      removeTimer(timer.id);
    }
  }

  function handleStartNewTimer() {
    if (source === "objective") {
      if (!selectedObjective) return;
      startFocusSession(selectedObjective, {
        timers,
        startObjectiveSession,
        startTimer,
        resumeTimer,
      });
      setSelectedId(null);
    } else {
      let objectiveId: string | undefined;
      if (addToKanban && personalLinkedObjectiveId) {
        const linked = objectives.find((o) => o.id === personalLinkedObjectiveId);
        const alreadyActiveElsewhere = activeObjectiveIds.has(personalLinkedObjectiveId);
        // If the linked card was already started/moved via some other path
        // (e.g. picked from the Objective tab, or dragged on the board),
        // it already has its own timer — don't attach a duplicate here.
        if (linked && !alreadyActiveElsewhere) {
          startObjectiveSession(personalLinkedObjectiveId);
          objectiveId = personalLinkedObjectiveId;
        }
      }
      startTimer({
        source: "personal",
        label: personalLabel || "Personal focus session",
        objectiveId,
        durationSeconds: clampPersonalMinutes(personalMinutes) * 60,
      });
      setPersonalLabel("");
      setAddToKanban(false);
      setPersonalLinkedObjectiveId(null);
    }
  }

  function handleStop(id: string) {
    const timer = timers.find((t) => t.id === id);
    const elapsedMinutes = stopTimer(id);
    if (!timer || elapsedMinutes <= 0) return;
    if (timer.source === "objective" && timer.objectiveId) {
      logStudyTime(timer.objectiveId, elapsedMinutes);
      logSession({
        durationMinutes: elapsedMinutes,
        type: "work",
        completed: false,
        objectiveId: timer.objectiveId,
        label: timer.label,
      });
    } else {
      logSession({
        durationMinutes: elapsedMinutes,
        type: "work",
        completed: false,
        label: timer.label || "Personal focus session",
      });
    }
  }

  function handleFinished() {
    if (!activeFinishTimer) return;
    if (activeFinishTimer.objectiveId) {
      completeObjective(activeFinishTimer.objectiveId);
      setCelebrateKey((k) => k + 1);
    }
    removeTimer(activeFinishTimer.id);
    dequeueFinish(activeFinishTimer.id);
  }

  function handleKeepWorking(extraMinutes: number) {
    if (!activeFinishTimer) return;
    extendTimer(activeFinishTimer.id, extraMinutes * 60);
    dequeueFinish(activeFinishTimer.id);
  }

  function handleNotYet() {
    if (!activeFinishTimer) return;
    removeTimer(activeFinishTimer.id);
    dequeueFinish(activeFinishTimer.id);
  }

  /** Dismisses a finished timer card (top-left close button, or the fullscreen overlay's close). */
  function handleCloseTimer(id: string) {
    removeTimer(id);
    dequeueFinish(id);
  }

  const canStart =
    source === "objective"
      ? Boolean(selectedObjective)
      : clampPersonalMinutes(personalMinutes) > 0;

  return (
    <AppPage
      feature="pomodoro"
      title="Pomodoro"
      description="Timed focus sessions — linked to your objectives, or entirely off the record. Run as many at once as you like."
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-sm">
        <Panel variant="interactive" className="p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <TimerIcon className="h-3 w-3" /> Focused today
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{todayFocusMinutes}m</p>
        </Panel>
        <Panel variant="interactive" className="p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Flame className="h-3 w-3 text-warning" /> Sessions today
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{todaySessions.length}</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {timers.length === 0 ? (
            <Panel variant="glass" className="flex flex-col items-center gap-2 p-10 text-center">
              <p className="text-sm font-medium text-foreground">No timers running yet</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Configure a focus session on the right, then start it — you can stack up as many
                as you like.
              </p>
            </Panel>
          ) : (
            <>
              <div className="mb-3 inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
                <button
                  type="button"
                  onClick={() => setDisplayMode("digital")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    displayMode === "digital"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Digital
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode("blob")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    displayMode === "blob"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Blob
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {timers.map((timer) => (
                  <TimerCard
                    key={timer.id}
                    timer={timer}
                    displayMode={displayMode}
                    remainingSeconds={remainingSecondsOf(timer)}
                    onPause={() => pauseTimer(timer.id)}
                    onResume={() => resumeTimer(timer.id)}
                    onStop={() => handleStop(timer.id)}
                    onClose={() => handleCloseTimer(timer.id)}
                    onFullscreen={() => setFullscreenTimerId(timer.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <Panel variant="interactive" className="p-5">
          <Tabs value={source} onValueChange={(v) => setSource(v as TimerSource)}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="objective" className="flex-1">
                Objective focus
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex-1">
                Personal timer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="objective">
              {!hydrated ? (
                <ObjectivePickerSkeleton />
              ) : (
                <ObjectivePicker
                  objectives={showHidden ? hiddenEligibleObjectives : visibleEligibleObjectives}
                  selectedId={selectedId}
                  onSelect={(o: Objective) => setSelectedId(o.id)}
                  onHide={handleToggleHiddenObjective}
                  hiddenCount={hiddenEligibleObjectives.length}
                  showHidden={showHidden}
                  onToggleShowHidden={() => setShowHidden((prev) => !prev)}
                />
              )}
            </TabsContent>

            <TabsContent value="personal">
              <PersonalTimerForm
                label={personalLabel}
                onLabelChange={setPersonalLabel}
                minutes={personalMinutes}
                onMinutesChange={setPersonalMinutes}
                addToKanban={addToKanban}
                onAddToKanbanChange={handleAddToKanbanChange}
              />
            </TabsContent>
          </Tabs>

          <Button className="mt-4 w-full" onClick={handleStartNewTimer} disabled={!canStart}>
            <Play className="h-4 w-4" />
            Start new timer
          </Button>
        </Panel>
      </div>

      <ConfettiBurst triggerKey={celebrateKey} />

      <TimerFullscreenOverlay
        timer={fullscreenTimer}
        remainingSeconds={fullscreenTimer ? remainingSecondsOf(fullscreenTimer) : 0}
        displayMode={displayMode}
        lockdown
        showBlocklistReminder={focusPreferences.showBlocklistReminder}
        onPause={() => fullscreenTimer && pauseTimer(fullscreenTimer.id)}
        onResume={() => fullscreenTimer && resumeTimer(fullscreenTimer.id)}
        onStop={() => {
          if (!fullscreenTimer) return;
          handleStop(fullscreenTimer.id);
          setFullscreenTimerId(null);
        }}
        onCloseTimer={() => fullscreenTimer && handleCloseTimer(fullscreenTimer.id)}
        onExit={() => setFullscreenTimerId(null)}
      />

      <SessionSummaryDialog
        open={activeSummaryId !== null && activeFinishId === null}
        onOpenChange={(open) => {
          if (!open && activeSummaryTimer) handleSummaryContinue();
        }}
        stats={activeSummaryStats}
        onContinue={handleSummaryContinue}
      />

      <FinishSessionDialog
        open={activeFinishId !== null}
        onOpenChange={(open) => {
          if (!open && activeFinishTimer) handleNotYet();
        }}
        objectiveTitle={activeFinishObjective?.title ?? ""}
        onFinished={handleFinished}
        onKeepWorking={handleKeepWorking}
        onNotYet={handleNotYet}
      />
    </AppPage>
  );
}