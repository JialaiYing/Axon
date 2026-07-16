"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PERSONAL_TIMER_PRESETS } from "@/lib/pomodoro-utils";

interface PersonalTimerFormProps {
  label: string;
  onLabelChange: (label: string) => void;
  minutes: number;
  onMinutesChange: (minutes: number) => void;
  addToKanban: boolean;
  onAddToKanbanChange: (value: boolean) => void;
}

export function PersonalTimerForm({
  label,
  onLabelChange,
  minutes,
  onMinutesChange,
  addToKanban,
  onAddToKanbanChange,
}: PersonalTimerFormProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="personal-timer-label">What are you working on?</Label>
        <Input
          id="personal-timer-label"
          placeholder="e.g. Reading, chores, side project..."
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Optional — this session won&apos;t be recorded against any kanban objective.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Duration</Label>
        <div className="flex flex-wrap gap-2">
          {PERSONAL_TIMER_PRESETS.map((preset) => (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => onMinutesChange(preset.minutes)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                minutes === preset.minutes
                  ? "border-accent/60 bg-accent-muted/40 text-accent-foreground"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          ))}
          <Input
            type="number"
            min={1}
            max={240}
            value={minutes}
            onChange={(e) => onMinutesChange(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
            className="h-[30px] w-20 px-2 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
        <div>
          <p className="text-xs font-medium text-foreground">Add to Kanban board?</p>
          <p className="text-[11px] text-muted-foreground">
            Creates a queued objective card you can track alongside this timer.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={addToKanban}
          onClick={() => onAddToKanbanChange(!addToKanban)}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
            addToKanban ? "bg-accent" : "bg-card border border-border-strong"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
              addToKanban ? "translate-x-[18px]" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
    </div>
  );
}