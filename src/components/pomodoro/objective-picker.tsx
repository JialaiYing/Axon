"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { priorityBadgeVariant, remainingMinutes, formatEstimatedTime } from "@/lib/kanban-utils";
import type { Objective } from "@/types";

interface ObjectivePickerProps {
  objectives: Objective[];
  selectedId: string | null;
  onSelect: (objective: Objective) => void;
}

export function ObjectivePicker({ objectives, selectedId, onSelect }: ObjectivePickerProps) {
  if (objectives.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No queued or in-progress objectives. Add one from the Kanban board to time it here.
      </div>
    );
  }

  return (
    <ul className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
      {objectives.map((objective) => {
        const isSelected = objective.id === selectedId;
        const remaining = remainingMinutes(objective);
        return (
          <li key={objective.id}>
            <button
              type="button"
              onClick={() => onSelect(objective)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                isSelected
                  ? "border-accent/60 bg-accent-muted/40 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                  : "border-border bg-surface hover:border-border-strong hover:bg-card"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isSelected ? "border-accent bg-accent" : "border-border-strong"
                )}
              >
                {isSelected && <CheckCircle2 className="h-4 w-4 text-accent-foreground" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{objective.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant={priorityBadgeVariant(objective.priority)} className="capitalize">
                    {objective.priority}
                  </Badge>
                  <Badge variant="outline">{objective.subject}</Badge>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      objective.status === "in-progress"
                        ? "bg-accent-muted text-accent"
                        : "bg-surface text-muted-foreground"
                    )}
                  >
                    {objective.status === "in-progress" ? "In progress" : "Queued"}
                  </span>
                </div>
                {remaining !== null && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {remaining > 0
                      ? `${formatEstimatedTime(remaining)} remaining`
                      : "Estimated time used up"}
                  </p>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}