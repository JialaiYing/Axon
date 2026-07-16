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
}

export function PersonalTimerForm({
  label,
  onLabelChange,
  minutes,
  onMinutesChange,
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
    </div>
  );
}