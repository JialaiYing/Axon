"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PersonalTimerFormProps {
  label: string;
  onLabelChange: (label: string) => void;
  workMinutes: number;
  addToKanban: boolean;
  onAddToKanbanChange: (value: boolean) => void;
}

export function PersonalTimerForm({
  label,
  onLabelChange,
  addToKanban,
  onAddToKanbanChange,
}: PersonalTimerFormProps) {
  return (
    <div className="w-full space-y-2.5">
      <Input
        id="personal-timer-label"
        placeholder="Untitled"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="h-10 border-0 border-b border-border/40 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] text-foreground">Add to board</p>
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
