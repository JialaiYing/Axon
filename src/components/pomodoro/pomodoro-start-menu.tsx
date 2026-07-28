"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ObjectivePickerSkeleton } from "@/components/ui/skeleton";
import { ObjectivePicker } from "@/components/pomodoro/objective-picker";
import { PersonalTimerForm } from "@/components/pomodoro/personal-timer-form";
import type { Objective, TimerSource } from "@/types";

interface PomodoroStartMenuProps {
  source: TimerSource;
  onSourceChange: (source: TimerSource) => void;
  hydrated: boolean;
  objectives: Objective[];
  selectedId: string | null;
  onSelect: (objective: Objective) => void;
  personalLabel: string;
  onPersonalLabelChange: (label: string) => void;
  workMinutes: number;
  addToKanban: boolean;
  onAddToKanbanChange: (value: boolean) => void;
  canStart: boolean;
  onStart: () => void;
}

/** Objective / Personal picker + start control. */
export function PomodoroStartMenu({
  source,
  onSourceChange,
  hydrated,
  objectives,
  selectedId,
  onSelect,
  personalLabel,
  onPersonalLabelChange,
  workMinutes,
  addToKanban,
  onAddToKanbanChange,
  canStart,
  onStart,
}: PomodoroStartMenuProps) {
  return (
    <div className="flex min-h-[220px] flex-1 flex-col justify-end sm:min-h-[260px]">
      <Tabs
        value={source}
        onValueChange={(v) => onSourceChange(v as TimerSource)}
        className="flex w-full flex-col"
      >
        <TabsList className="mb-4 flex h-10 w-full shrink-0 items-stretch justify-center gap-0 rounded-none border-0 border-b border-border/40 bg-transparent p-0 shadow-none light:border-border">
          <TabsTrigger
            value="objective"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-none border-b-2 border-transparent px-2 text-center text-[14px] font-medium text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Objective
          </TabsTrigger>
          <TabsTrigger
            value="personal"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-none border-b-2 border-transparent px-2 text-center text-[14px] font-medium text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Personal
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[5.75rem]">
          <TabsContent value="objective" className="mt-0">
            {!hydrated ? (
              <ObjectivePickerSkeleton />
            ) : (
              <ObjectivePicker
                objectives={objectives}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            )}
          </TabsContent>

          <TabsContent value="personal" className="mt-0">
            <PersonalTimerForm
              label={personalLabel}
              onLabelChange={onPersonalLabelChange}
              workMinutes={workMinutes}
              addToKanban={addToKanban}
              onAddToKanbanChange={onAddToKanbanChange}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Button
        className="mt-3 w-full shrink-0 shadow-none"
        size="lg"
        onClick={onStart}
        disabled={!canStart}
      >
        <Play className="h-4 w-4" />
        Start {workMinutes}m
      </Button>
    </div>
  );
}
