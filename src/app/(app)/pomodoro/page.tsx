"use client";

import * as React from "react";
import { Maximize2, Target, Coffee } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/ui/confetti";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import { TimerFullscreenOverlay } from "@/components/pomodoro/timer-fullscreen";
import { FinishSessionDialog } from "@/components/pomodoro/finish-session-dialog";
import { SessionSummaryDialog } from "@/components/pomodoro/session-summary-dialog";
import { PhaseTransitionDialog } from "@/components/pomodoro/phase-transition-dialog";
import { PomodoroIdleStatus } from "@/components/pomodoro/pomodoro-idle-status";
import { PomodoroStartMenu } from "@/components/pomodoro/pomodoro-start-menu";
import { useShellChrome } from "@/components/layout/shell-chrome";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroTimers, remainingSecondsOf } from "@/hooks/use-pomodoro-timers";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useFocusPreferences } from "@/hooks/use-focus-preferences";
import { useUserStats } from "@/hooks/use-user-stats";
import { isToday } from "@/lib/goals-utils";
import { isAwaitingPhaseTransition, phaseLabel, startFocusSession } from "@/lib/pomodoro-utils";
import { focusSessionXp } from "@/lib/progress/xp-rules";
import type { Objective, TimerSource } from "@/types";

export default function PomodoroPage() {
  const { objectives, hydrated, addObjective, updateObjective, deleteObjective, startObjectiveSession, logStudyTime, completeObjective } =
    useObjectives();
  const { logSession } = usePomodoroSessions();
  const {
    timers,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    removeTimer,
    extendTimer,
    restartTimer,
    advancePhase,
  } = usePomodoroTimers();
  const { preferences: focusPreferences } = useFocusPreferences();
  const { setFocusLock } = useShellChrome();
  const { stats: userStats } = useUserStats();

  const [source, setSource] = React.useState<TimerSource>("objective");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [personalLabel, setPersonalLabel] = React.useState("");
  const [celebrateKey, setCelebrateKey] = React.useState(0);
  const [finishQueue, setFinishQueue] = React.useState<string[]>([]);
  const [summaryQueue, setSummaryQueue] = React.useState<string[]>([]);
  const [phasePromptId, setPhasePromptId] = React.useState<string | null>(null);
  const [addToKanban, setAddToKanban] = React.useState(false);
  const [personalLinkedObjectiveId, setPersonalLinkedObjectiveId] = React.useState<string | null>(null);
  const [fullscreenTimerId, setFullscreenTimerId] = React.useState<string | null>(null);
  const dismissedPhasePromptIds = React.useRef<Set<string>>(new Set());

  const activeTimer = timers[0] ?? null;
  const hasActiveTimer = activeTimer !== null;

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

  const fullscreenTimer = React.useMemo(
    () => timers.find((t) => t.id === fullscreenTimerId) ?? null,
    [timers, fullscreenTimerId]
  );

  React.useEffect(() => {
    if (fullscreenTimerId && !timers.some((t) => t.id === fullscreenTimerId)) {
      setFullscreenTimerId(null);
    }
  }, [timers, fullscreenTimerId]);

  React.useEffect(() => {
    if (!addToKanban || !personalLinkedObjectiveId) return;
    const linked = objectives.find((o) => o.id === personalLinkedObjectiveId);
    if (!linked || linked.status !== "todo") return;
    const nextTitle = personalLabel.trim() || "Personal focus session";
    const nextMinutes = focusPreferences.workMinutes;
    if (linked.title === nextTitle && linked.estimatedStudyTime === nextMinutes) return;
    updateObjective(personalLinkedObjectiveId, {
      title: nextTitle,
      estimatedStudyTime: nextMinutes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalLabel, addToKanban, personalLinkedObjectiveId, objectives, focusPreferences.workMinutes]);

  function handleAddToKanbanChange(next: boolean) {
    setAddToKanban(next);
    if (next) {
      const created = addObjective({
        title: personalLabel.trim() || "Personal focus session",
        subject: "Personal",
        priority: "medium",
        estimatedStudyTime: focusPreferences.workMinutes,
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

  const exitFocusMode = React.useCallback(() => {
    setFullscreenTimerId(null);
  }, []);

  const focusWasRunningRef = React.useRef(false);
  React.useEffect(() => {
    if (!fullscreenTimerId) {
      focusWasRunningRef.current = false;
      return;
    }
    const active = timers.find((t) => t.id === fullscreenTimerId);
    if (!active) {
      setFullscreenTimerId(null);
      focusWasRunningRef.current = false;
      return;
    }
    if (active.status === "running") {
      focusWasRunningRef.current = true;
      return;
    }
    if (focusWasRunningRef.current && isAwaitingPhaseTransition(active)) {
      focusWasRunningRef.current = false;
      setFullscreenTimerId(null);
    }
  }, [timers, fullscreenTimerId]);

  React.useEffect(() => {
    setFocusLock(Boolean(fullscreenTimerId));
    return () => setFocusLock(false);
  }, [fullscreenTimerId, setFocusLock]);

  React.useEffect(() => {
    // Drop dismiss markers for timers that left Ready or were removed.
    for (const id of [...dismissedPhasePromptIds.current]) {
      const t = timers.find((x) => x.id === id);
      if (!t || !isAwaitingPhaseTransition(t)) dismissedPhasePromptIds.current.delete(id);
    }

    if (phasePromptId && timers.some((t) => t.id === phasePromptId && isAwaitingPhaseTransition(t))) {
      return;
    }
    if (phasePromptId && !timers.some((t) => t.id === phasePromptId)) {
      setPhasePromptId(null);
    }
    const awaiting = timers.find((t) => isAwaitingPhaseTransition(t));
    if (
      awaiting &&
      !dismissedPhasePromptIds.current.has(awaiting.id) &&
      !finishQueue.includes(awaiting.id) &&
      !summaryQueue.includes(awaiting.id)
    ) {
      setPhasePromptId(awaiting.id);
    }
  }, [timers, phasePromptId, finishQueue, summaryQueue]);

  const phasePromptTimer = React.useMemo(
    () => timers.find((t) => t.id === phasePromptId) ?? null,
    [timers, phasePromptId]
  );

  const activeFinishId = finishQueue[0] ?? null;
  const activeFinishTimer = React.useMemo(
    () => timers.find((t) => t.id === activeFinishId) ?? null,
    [timers, activeFinishId]
  );
  const activeFinishObjective = React.useMemo(
    () => (activeFinishTimer?.objectiveId ? objectives.find((o) => o.id === activeFinishTimer.objectiveId) : null),
    [objectives, activeFinishTimer]
  );

  const activeSummaryId = summaryQueue[0] ?? null;
  const activeSummaryTimer = React.useMemo(
    () => timers.find((t) => t.id === activeSummaryId) ?? null,
    [timers, activeSummaryId]
  );
  const tasksDoneToday = React.useMemo(
    () => objectives.filter((o) => o.status === "done" && isToday(o.completedAt)).length,
    [objectives]
  );
  const summaryStats = React.useMemo(() => {
    if (!activeSummaryTimer) return null;
    const focusedMinutes = Math.max(1, Math.round(focusPreferences.workMinutes));
    return {
      focusedMinutes,
      sessionXp: focusSessionXp(focusedMinutes),
      streakDays: userStats.currentStreak,
      tasksDoneToday,
      label: activeSummaryTimer.label,
    };
  }, [activeSummaryTimer, userStats.currentStreak, tasksDoneToday, focusPreferences.workMinutes]);

  function dequeueFinish(id: string) {
    setFinishQueue((q) => q.filter((x) => x !== id));
  }

  function dequeueSummary(id: string) {
    setSummaryQueue((q) => q.filter((x) => x !== id));
  }

  function handleStartNewTimer() {
    if (source === "objective") {
      if (!selectedObjective) return;
      const started = startFocusSession(selectedObjective, {
        timers,
        startObjectiveSession,
        startTimer,
        resumeTimer,
        stopTimer,
        removeTimer,
        onDisplacedWork: (timer, elapsedMinutes) => {
          if (timer.objectiveId) logStudyTime(timer.objectiveId, elapsedMinutes);
          logSession({
            durationMinutes: elapsedMinutes,
            type: "work",
            completed: false,
            objectiveId: timer.objectiveId,
            label: timer.label,
          });
        },
      });
      setSelectedId(null);
      if (focusPreferences.autoEnterFocusMode && started.status === "running") {
        setFullscreenTimerId(started.id);
      }
    } else {
      let objectiveId: string | undefined;
      if (addToKanban && personalLinkedObjectiveId) {
        const linked = objectives.find((o) => o.id === personalLinkedObjectiveId);
        const alreadyActiveElsewhere = activeObjectiveIds.has(personalLinkedObjectiveId);
        if (linked && !alreadyActiveElsewhere) {
          startObjectiveSession(personalLinkedObjectiveId);
          objectiveId = personalLinkedObjectiveId;
        }
      }
      const started = startTimer({
        source: "personal",
        label: personalLabel || "Personal focus session",
        objectiveId,
        durationSeconds: focusPreferences.workMinutes * 60,
        phase: "work",
        cycleIndex: 0,
      });
      setPersonalLabel("");
      setAddToKanban(false);
      setPersonalLinkedObjectiveId(null);
      if (focusPreferences.autoEnterFocusMode) {
        setFullscreenTimerId(started.id);
      }
    }
  }

  function handleStop(id: string) {
    const timer = timers.find((t) => t.id === id);
    if (fullscreenTimerId === id) setFullscreenTimerId(null);
    if (phasePromptId === id) setPhasePromptId(null);
    if (!timer) return;

    if (isAwaitingPhaseTransition(timer) && (timer.phase ?? "work") === "work" && timer.objectiveId) {
      setFinishQueue((q) => (q.includes(id) ? q : [...q, id]));
      return;
    }

    if (isAwaitingPhaseTransition(timer) && (timer.phase ?? "work") === "work" && !timer.objectiveId) {
      setSummaryQueue((q) => (q.includes(id) ? q : [...q, id]));
      return;
    }

    if (isAwaitingPhaseTransition(timer)) {
      removeTimer(id);
      dequeueFinish(id);
      dequeueSummary(id);
      return;
    }

    const elapsedMinutes = stopTimer(id);
    if (elapsedMinutes > 0 && (timer.phase ?? "work") === "work") {
      if (timer.objectiveId) logStudyTime(timer.objectiveId, elapsedMinutes);
      logSession({
        durationMinutes: elapsedMinutes,
        type: "work",
        completed: false,
        objectiveId: timer.objectiveId,
        label: timer.label,
      });
    }
    dequeueFinish(id);
    dequeueSummary(id);
  }

  function handleStopSessionFromPhasePrompt() {
    if (!phasePromptTimer) return;
    const id = phasePromptTimer.id;
    setPhasePromptId(null);
    handleStop(id);
  }

  function handleStartBreak() {
    if (!phasePromptTimer) return;
    const id = phasePromptTimer.id;
    setPhasePromptId(null);
    advancePhase(id, "start-break");
  }

  function handleSkipBreak() {
    if (!phasePromptTimer) return;
    const id = phasePromptTimer.id;
    setPhasePromptId(null);
    advancePhase(id, "skip-break");
  }

  function handleStartWork() {
    if (!phasePromptTimer) return;
    const id = phasePromptTimer.id;
    setPhasePromptId(null);
    advancePhase(id, "start-work");
  }

  function handleSummaryContinue() {
    if (!activeSummaryTimer) return;
    removeTimer(activeSummaryTimer.id);
    dequeueSummary(activeSummaryTimer.id);
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

  function handleRestartTimer(id: string) {
    restartTimer(id);
    setPhasePromptId(null);
    dequeueFinish(id);
    dequeueSummary(id);
  }

  function handleContinuePhase(id: string) {
    const timer = timers.find((t) => t.id === id);
    if (!timer || !isAwaitingPhaseTransition(timer)) return;
    dismissedPhasePromptIds.current.delete(id);
    setPhasePromptId(id);
  }

  const canStart = source === "objective" ? Boolean(selectedObjective) : true;

  const activePhase = activeTimer?.phase ?? "work";
  const cyclesBeforeLong = focusPreferences.cyclesBeforeLongBreak;
  const cycleDisplay = activeTimer
    ? activePhase === "work"
      ? `${Math.min(activeTimer.cycleIndex + 1, cyclesBeforeLong)}/${cyclesBeforeLong}`
      : `${activeTimer.cycleIndex}/${cyclesBeforeLong}`
    : null;

  const nextBreakIsLong = Boolean(
    phasePromptTimer &&
      phasePromptTimer.phase === "work" &&
      phasePromptTimer.cycleIndex + 1 >= cyclesBeforeLong
  );

  const startPanel = (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pt-6">
      <PomodoroIdleStatus />
      <PomodoroStartMenu
        source={source}
        onSourceChange={setSource}
        hydrated={hydrated}
        objectives={eligibleObjectives}
        selectedId={selectedId}
        onSelect={(o: Objective) => setSelectedId(o.id)}
        personalLabel={personalLabel}
        onPersonalLabelChange={setPersonalLabel}
        workMinutes={focusPreferences.workMinutes}
        addToKanban={addToKanban}
        onAddToKanbanChange={handleAddToKanbanChange}
        canStart={canStart}
        onStart={handleStartNewTimer}
      />
    </div>
  );

  const activeTimerView = activeTimer ? (
    <div className="flex w-full max-w-xl flex-col items-center gap-5 px-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground">
          {activePhase === "work" ? (
            activeTimer.source === "objective" ? (
              <Target className="h-3.5 w-3.5" />
            ) : (
              <Coffee className="h-3.5 w-3.5" />
            )
          ) : (
            <Coffee className="h-3.5 w-3.5" />
          )}
          {phaseLabel(activePhase)}
          {cycleDisplay ? (
            <span className="font-mono tabular-nums text-muted-foreground/80">· {cycleDisplay}</span>
          ) : null}
        </span>
        {isAwaitingPhaseTransition(activeTimer) && (
          <span className="text-[14px] font-medium text-success">Ready</span>
        )}
      </div>

      <h2
        className="max-w-xl truncate px-2 text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        title={activeTimer.label}
      >
        {activeTimer.label}
      </h2>

      <TimerDisplay
        remainingSeconds={
          activeTimer.status === "finished"
            ? activeTimer.durationSeconds
            : remainingSecondsOf(activeTimer)
        }
        totalSeconds={activeTimer.durationSeconds || 1}
        size={440}
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <TimerControls
          status={activeTimer.status}
          showRestart={isAwaitingPhaseTransition(activeTimer)}
          onContinue={
            isAwaitingPhaseTransition(activeTimer) && phasePromptId !== activeTimer.id
              ? () => handleContinuePhase(activeTimer.id)
              : undefined
          }
          onPause={() => pauseTimer(activeTimer.id)}
          onResume={() => resumeTimer(activeTimer.id)}
          onStop={() => handleStop(activeTimer.id)}
          onRestart={() => handleRestartTimer(activeTimer.id)}
        />
        {!isAwaitingPhaseTransition(activeTimer) && activeTimer.status !== "finished" && (
          <Button
            size="sm"
            variant="outline"
            className="shadow-none"
            onClick={() => setFullscreenTimerId(activeTimer.id)}
            aria-label="Open focus mode"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Focus mode
          </Button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <AppPage feature="pomodoro" title="Pomodoro" hideHeader={hasActiveTimer}>
      <div
        className={
          hasActiveTimer
            ? "flex min-h-[calc(100dvh-6rem)] w-full flex-col items-center justify-center py-4"
            : "flex w-full flex-col items-center py-2"
        }
      >
        {!hasActiveTimer ? startPanel : activeTimerView}
      </div>

      <ConfettiBurst triggerKey={celebrateKey} />

      <TimerFullscreenOverlay
        timer={fullscreenTimer}
        remainingSeconds={fullscreenTimer ? remainingSecondsOf(fullscreenTimer) : 0}
        lockdown
        onPause={() => fullscreenTimer && pauseTimer(fullscreenTimer.id)}
        onResume={() => fullscreenTimer && resumeTimer(fullscreenTimer.id)}
        onStop={() => {
          if (!fullscreenTimer) return;
          handleStop(fullscreenTimer.id);
        }}
        onExit={exitFocusMode}
      />

      <PhaseTransitionDialog
        open={phasePromptTimer !== null && activeFinishId === null && activeSummaryId === null}
        onOpenChange={(open) => {
          if (!open && phasePromptTimer) {
            dismissedPhasePromptIds.current.add(phasePromptTimer.id);
            setPhasePromptId(null);
          }
        }}
        phase={phasePromptTimer?.phase ?? "work"}
        label={phasePromptTimer?.label ?? ""}
        nextBreakIsLong={nextBreakIsLong}
        onStartBreak={handleStartBreak}
        onSkipBreak={handleSkipBreak}
        onStartWork={handleStartWork}
        onStopSession={handleStopSessionFromPhasePrompt}
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

      <SessionSummaryDialog
        open={activeSummaryId !== null && summaryStats !== null}
        onOpenChange={(open) => {
          if (!open && activeSummaryTimer) handleSummaryContinue();
        }}
        stats={summaryStats}
        onContinue={handleSummaryContinue}
      />
    </AppPage>
  );
}
