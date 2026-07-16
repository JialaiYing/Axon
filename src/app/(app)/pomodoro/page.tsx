"use client";

import * as React from "react";
import { Flame, Timer as TimerIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ConfettiBurst } from "@/components/ui/confetti";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import { ObjectivePicker } from "@/components/pomodoro/objective-picker";
import { PersonalTimerForm } from "@/components/pomodoro/personal-timer-form";
import { FinishSessionDialog } from "@/components/pomodoro/finish-session-dialog";
import { useObjectives } from "@/hooks/use-objectives";
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { remainingMinutes } from "@/lib/kanban-utils";
import { formatClock } from "@/lib/pomodoro-utils";
import type { Objective, TimerDisplayMode, TimerSource } from "@/types";

export default function PomodoroPage() {
  const { objectives, hydrated, startObjectiveSession, logStudyTime, completeObjective } =
    useObjectives();
  const { logSession, todaySessions, todayFocusMinutes } = usePomodoroSessions();
  const [displayMode, setDisplayMode] = useLocalStorage<TimerDisplayMode>(
    "axon:pomodoro:displayMode",
    "digital"
  );

  const [source, setSource] = React.useState<TimerSource>("objective");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [personalLabel, setPersonalLabel] = React.useState("");
  const [personalMinutes, setPersonalMinutes] = React.useState(25);
  const [finishDialogOpen, setFinishDialogOpen] = React.useState(false);
  const [celebrateKey, setCelebrateKey] = React.useState(0);

  const eligibleObjectives = React.useMemo(
    () => objectives.filter((o) => o.status === "todo" || o.status === "in-progress"),
    [objectives]
  );
  const selectedObjective = React.useMemo(
    () => eligibleObjectives.find((o) => o.id === selectedId) ?? null,
    [eligibleObjectives, selectedId]
  );

  const timer = usePomodoroTimer({
    onComplete: (totalSeconds) => {
      const minutes = Math.round(totalSeconds / 60);
      if (source === "objective" && selectedObjective) {
        logStudyTime(selectedObjective.id, minutes);
        setFinishDialogOpen(true);
      } else {
        logSession({
          durationMinutes: minutes,
          type: "work",
          completed: true,
          label: personalLabel || "Personal focus session",
        });
        setCelebrateKey((k) => k + 1);
      }
    },
  });

  function handleStart() {
    if (source === "objective") {
      if (!selectedObjective) return;
      startObjectiveSession(selectedObjective.id);
      const remaining = remainingMinutes(selectedObjective);
      const minutes = remaining && remaining > 0 ? remaining : selectedObjective.estimatedStudyTime || 25;
      timer.start(minutes * 60);
    } else {
      timer.start(personalMinutes * 60);
    }
  }

  function handleStop() {
    const elapsedMinutes = timer.stop();
    if (elapsedMinutes <= 0) return;
    if (source === "objective" && selectedObjective) {
      logStudyTime(selectedObjective.id, elapsedMinutes);
    } else {
      logSession({
        durationMinutes: elapsedMinutes,
        type: "work",
        completed: false,
        label: personalLabel || "Personal focus session",
      });
    }
  }

  function handleFinished() {
    if (selectedObjective) {
      completeObjective(selectedObjective.id);
      setCelebrateKey((k) => k + 1);
    }
    setFinishDialogOpen(false);
    timer.reset();
    setSelectedId(null);
  }

  function handleKeepWorking(extraMinutes: number) {
    setFinishDialogOpen(false);
    timer.extend(extraMinutes * 60);
  }

  function handleNotYet() {
    setFinishDialogOpen(false);
    timer.reset();
  }

  const canStart =
    source === "objective"
      ? Boolean(selectedObjective) && timer.status === "idle"
      : timer.status === "idle";

  const idleDisplaySeconds =
    source === "objective"
      ? selectedObjective
        ? (remainingMinutes(selectedObjective) ?? selectedObjective.estimatedStudyTime ?? 25) * 60
        : 0
      : personalMinutes * 60;

  return (
    <div className="relative">
      <PageHeader
        title="Pomodoro"
        description="Timed focus sessions — linked to your objectives, or entirely off the record."
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
          <Card className="glass flex flex-col items-center gap-6 p-8">
            <TimerDisplay
              mode={displayMode}
              onModeChange={setDisplayMode}
              remainingSeconds={timer.status === "idle" ? idleDisplaySeconds : timer.remainingSeconds}
              totalSeconds={timer.totalSeconds || idleDisplaySeconds || 1}
              label={source === "objective" ? selectedObjective?.title : personalLabel || "Personal timer"}
            />

            <TimerControls
              status={timer.status}
              canStart={canStart}
              onStart={handleStart}
              onPause={timer.pause}
              onResume={timer.resume}
              onStop={handleStop}
            />

            {timer.status !== "idle" && (
              <p className="text-xs text-muted-foreground">
                {formatClock(timer.remainingSeconds)} left · {timer.elapsedMinutes}m logged so far
              </p>
            )}
          </Card>
        </ScrollReveal>

        <ScrollReveal>
          <Card className="p-5">
            <Tabs
              value={source}
              onValueChange={(v) => {
                if (timer.status === "idle") setSource(v as TimerSource);
              }}
            >
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="objective" className="flex-1" disabled={timer.status !== "idle"}>
                  Objective focus
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex-1" disabled={timer.status !== "idle"}>
                  Personal timer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="objective">
                {!hydrated ? (
                  <p className="text-sm text-muted-foreground">Loading your objectives...</p>
                ) : (
                  <ObjectivePicker
                    objectives={eligibleObjectives}
                    selectedId={selectedId}
                    onSelect={(o: Objective) => timer.status === "idle" && setSelectedId(o.id)}
                  />
                )}
              </TabsContent>

              <TabsContent value="personal">
                <PersonalTimerForm
                  label={personalLabel}
                  onLabelChange={setPersonalLabel}
                  minutes={personalMinutes}
                  onMinutesChange={setPersonalMinutes}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </ScrollReveal>
      </div>

      <ConfettiBurst triggerKey={celebrateKey} />

      <FinishSessionDialog
        open={finishDialogOpen}
        onOpenChange={setFinishDialogOpen}
        objectiveTitle={selectedObjective?.title ?? ""}
        onFinished={handleFinished}
        onKeepWorking={handleKeepWorking}
        onNotYet={handleNotYet}
      />
    </div>
  );
}