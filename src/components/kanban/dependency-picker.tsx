"use client";

import { GitBranch } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Objective } from "@/types";

interface DependencyPickerProps {
  /** Current objective id (excluded from the picker). */
  currentId?: string;
  /** All selectable objectives. */
  candidates: Objective[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function DependencyPicker({
  currentId,
  candidates,
  selectedIds,
  onChange,
}: DependencyPickerProps) {
  const options = candidates.filter(
    (o) => o.id !== currentId && o.status !== "recycled"
  );

  if (options.length === 0) {
    return (
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-muted" />
          Blocked by
        </Label>
        <p className="text-xs text-muted-foreground">No other objectives to depend on yet.</p>
      </div>
    );
  }

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <GitBranch className="h-3.5 w-3.5 text-muted" />
        Blocked by
      </Label>
      <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border/50 bg-surface/30 p-2">
        {options.map((objective) => {
          const checked = selectedIds.includes(objective.id);
          return (
            <button
              key={objective.id}
              type="button"
              onClick={() => toggle(objective.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                checked
                  ? "bg-accent-muted text-accent-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[9px]",
                  checked ? "border-accent bg-accent text-accent-foreground" : "border-border"
                )}
              >
                {checked ? "✓" : ""}
              </span>
              <span className="min-w-0 truncate">{objective.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
