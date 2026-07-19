"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Counter from "@/components/effects/counter";
import { cn } from "@/lib/utils";
import {
  MAX_PERSONAL_TIMER_MINUTES,
  MIN_PERSONAL_TIMER_MINUTES,
  PERSONAL_TIMER_PRESETS,
  clampPersonalMinutes,
  formatClock,
  parsePersonalMinutes,
} from "@/lib/pomodoro-utils";

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
  const safeMinutes = clampPersonalMinutes(minutes);
  const [minuteDraft, setMinuteDraft] = React.useState(String(safeMinutes));

  React.useEffect(() => {
    setMinuteDraft(String(clampPersonalMinutes(minutes)));
  }, [minutes]);

  function applyMinutes(next: number) {
    const clamped = clampPersonalMinutes(next);
    setMinuteDraft(String(clamped));
    onMinutesChange(clamped);
  }

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="personal-timer-label">What are you working on?</Label>
        <Input
          id="personal-timer-label"
          placeholder="e.g. Reading, chores, side project..."
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Optional — this session won&apos;t be recorded against any kanban objective
          unless you add it below.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Duration</Label>
        <div className="grid w-full grid-cols-3 gap-2">
          {PERSONAL_TIMER_PRESETS.map((preset) => (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => applyMinutes(preset.minutes)}
              className={cn(
                "w-full cursor-pointer rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200",
                safeMinutes === preset.minutes
                  ? "border-accent/60 bg-accent-muted/40 text-accent-foreground"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-1.5">
          <Label htmlFor="personal-timer-minutes" className="text-[11px] text-muted-foreground">
            Custom minutes
          </Label>
          <Input
            id="personal-timer-minutes"
            type="number"
            inputMode="numeric"
            min={MIN_PERSONAL_TIMER_MINUTES}
            max={MAX_PERSONAL_TIMER_MINUTES}
            step={1}
            value={minuteDraft}
            onChange={(event) => {
              const raw = event.target.value;
              setMinuteDraft(raw);
              const parsed = parsePersonalMinutes(raw);
              if (parsed !== null) onMinutesChange(parsed);
            }}
            onBlur={() => {
              const parsed = parsePersonalMinutes(minuteDraft);
              applyMinutes(parsed ?? safeMinutes);
            }}
            className="cursor-text font-mono tabular-nums"
          />
        </div>

        <div
          aria-label={`${safeMinutes} minutes`}
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-border bg-card/60 px-4 py-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <Counter
            value={safeMinutes}
            minDigits={2}
            fontSize={32}
            padding={3}
            gap={2}
            horizontalPadding={0}
            textColor="#f4f5f7"
            fontWeight={600}
            gradientFrom="transparent"
            gradientTo="transparent"
          />
          <span className="mx-1 font-mono text-3xl font-semibold text-muted-foreground">:</span>
          <span className="font-mono text-[32px] font-semibold leading-none tabular-nums text-foreground">
            {formatClock(safeMinutes * 60).slice(-2)}
          </span>
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
            "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
            addToKanban ? "bg-accent" : "bg-border"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200",
              addToKanban && "translate-x-5"
            )}
          />
        </button>
      </div>
    </div>
  );
}
