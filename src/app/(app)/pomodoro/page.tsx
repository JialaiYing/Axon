"use client";

import * as React from "react";
import { Flame, Timer as TimerIcon, Play } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ConfettiBurst } from "@/components/ui/confetti";
import { ObjectivePickerSkeleton } from "@/components/ui/skeleton";
import { TimerCard } from "@/components/pomodoro/timer-card";
import { ObjectivePicker } from "@/components/pomodoro/objective-picker";
import { PersonalTimerForm } from "@/components/pomodoro/personal-timer-form";
import { FinishSessionDialog } from "@/components/pomodoro/finish-session-dialog";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroTimers, remainingSecondsOf } from "@/hooks/use-pomodoro-timers";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { remainingMinutes } from "@/lib/kanban-utils";
import type { Objective, TimerDisplayMode, TimerSource } from "@/types";

export default function PomodoroPage() {
  const { objectives, hydrated, addObjective, updateObjective, deleteObjective, startObjectiveSession, logStudyTime, completeObjective } =
    useObjectives();
  const { logSession, todaySessions, todayFocusMinutes } = usePomodoroSessions();
  const { timers, hydrated: timersHydrated, startTimer, pauseTimer, resumeTimer, stopTimer, removeTimer, extendTimer, markLogged } =
    usePomodoroTimers();
  const [displayMode, setDisplayMode] = useLocalStorage<TimerDisplayMode>(
    "axon:pomodoro:displayMode",
    "digital"
  );

  const [source, setSource] = React.useState<TimerSource>("objective");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [personalLabel, setPersonalLabel] = React.useState("");
  const [personalMinutes, setPersonalMinutes] = React.useState(25);
  const [celebrateKey, setCelebrateKey] = React.useState(0);
  const [finishQueue, setFinishQueue] = React.useState<string[]>([]);
  const [addToKanban, setAddToKanban] = React.useState(false);
  const [personalLinkedObjectiveId, setPersonalLinkedObjectiveId] = React.useState<string | null>(null);

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
        (o) => (o.status === "todo" || o.status === "in-progress") && !activeObjectiveIds.has(o.id)
      ),
    [objectives, activeObjectiveIds]
  );
  const selectedObjective = React.useMemo(
    () => eligibleObjectives.find((o) => o.id === selectedId) ?? null,
    [eligibleObjectives, selectedId]
  );

  // Keep the queued card's title/estimated time in sync with the personal
  // timer form while it's still sitting untouched in "todo". If it's been
  // moved elsewhere (started via another path), leave it alone.
  React.useEffect(() => {
    if (!addToKanban || !personalLinkedObjectiveId) return;
    const linked = objectives.find((o) => o.id === personalLinkedObjectiveId);
    if (!linked || linked.status !== "todo") return;
    const nextTitle = personalLabel.trim() || "Personal focus session";
    if (linked.title === nextTitle && linked.estimatedStudyTime === personalMinutes) return;
    updateObjective(personalLinkedObjectiveId, {
      title: nextTitle,
      estimatedStudyTime: personalMinutes,
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
        estimatedStudyTime: personalMinutes,
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

  // Log a finished timer's time exactly once, then (for objective-linked
  // timers) queue up the "are you finished?" dialog.
  React.useEffect(() => {
    if (!timersHydrated) return;
    timers.forEach((t) => {
      if (t.status !== "finished" || t.loggedCompletion) return;
      const minutes = Math.round(t.durationSeconds / 60);
      if (t.source === "objective" && t.objectiveId) {
        if (minutes > 0) logStudyTime(t.objectiveId, minutes);
        markLogged(t.id);
        setFinishQueue((q) => (q.includes(t.id) ? q : [...q, t.id]));
      } else {
        logSession({
          durationMinutes: minutes,
          type: "work",
          completed: true,
          label: t.label || "Personal focus session",
        });
        markLogged(t.id);
        setCelebrateKey((k) => k + 1);
      }
    });
  }, [timers, timersHydrated, logStudyTime, logSession, markLogged]);

  const activeFinishId = finishQueue[0] ?? null;
  const activeFinishTimer = React.useMemo(
    () => timers.find((t) => t.id === activeFinishId) ?? null,
    [timers, activeFinishId]
  );
  const activeFinishObjective = React.useMemo(
    () => (activeFinishTimer?.objectiveId ? objectives.find((o) => o.id === activeFinishTimer.objectiveId) : null),
    [objectives, activeFinishTimer]
  );

  function dequeueFinish(id: string) {
    setFinishQueue((q) => q.filter((x) => x !== id));
  }

  function handleStartNewTimer() {
    if (source === "objective") {
      if (!selectedObjective) return;
      startObjectiveSession(selectedObjective.id);
      const remaining = remainingMinutes(selectedObjective);
      const minutes = remaining && remaining > 0 ? remaining : selectedObjective.estimatedStudyTime || 25;
      startTimer({
        source: "objective",
        label: selectedObjective.title,
        objectiveId: selectedObjective.id,
        durationSeconds: minutes * 60,
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
        durationSeconds: personalMinutes * 60,
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

  const canStart = source === "objective" ? Boolean(selectedObjective) : personalMinutes > 0;

  return (
    <div className="relative">
      <PageHeader
        title="Pomodoro"
        description="Timed focus sessions — linked to your objectives, or entirely off the record. Run as many at once as you like."
      />

      <ScrollReveal className="mb-6 grid grid-cols-2 gap-3 sm:max-w-sm">
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <TimerIcon className="h-3 w-3" /> Focused today
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{todayFocusMinutes}m</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Flame className="h-3 w-3 text-warning" /> Sessions today
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{todaySessions.length}</p>
        </Card>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ScrollReveal>
          {timers.length === 0 ? (
            <Card className="glass flex flex-col items-center gap-2 p-10 text-center">
              <p className="text-sm font-medium text-foreground">No timers running yet</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Configure a focus session on the right, then start it — you can stack up as many
                as you like.
              </p>
            </Card>
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
                  />
                ))}
              </div>
            </>
          )}
        </ScrollReveal>

        <ScrollReveal>
          <Card className="p-5">
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
                    objectives={eligibleObjectives}
                    selectedId={selectedId}
                    onSelect={(o: Objective) => setSelectedId(o.id)}
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
          </Card>
        </ScrollReveal>
      </div>

      <ConfettiBurst triggerKey={celebrateKey} />

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
    </div>
  );
}