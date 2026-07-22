"use client";

import { CheckCircle2, Clock, Minus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { priorityBadgeVariant, remainingMinutes, formatEstimatedTime } from "@/lib/kanban-utils";
import type { Objective } from "@/types";

interface ObjectivePickerProps {
  objectives: Objective[];
  selectedId: string | null;
  onSelect: (objective: Objective) => void;
  /** Hides an objective from this list only — purely local to the Pomodoro section, never touches Kanban. */
  onHide?: (objective: Objective) => void;
  hiddenCount?: number;
  showHidden?: boolean;
  onToggleShowHidden?: () => void;
}

export function ObjectivePicker({
  objectives,
  selectedId,
  onSelect,
  onHide,
  hiddenCount = 0,
  showHidden = false,
  onToggleShowHidden,
}: ObjectivePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {objectives.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {showHidden
            ? "No hidden objectives."
            : "No queued or in-progress objectives. Add one from the Kanban board to time it here."}
        </div>
      ) : (
        <ul className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
          {objectives.map((objective) => {
            const isSelected = objective.id === selectedId;
            const remaining = remainingMinutes(objective);
            return (
              <li key={objective.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(objective)}
                  disabled={showHidden}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                    isSelected
                      ? "border-accent/60 bg-accent-muted/40 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_25%,transparent)]"
                      : "border-border bg-surface hover:border-border-strong hover:bg-card",
                    showHidden && "opacity-70"
                  )}
                >
                  {!showHidden && (
                    <div
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isSelected ? "border-accent bg-accent" : "border-border-strong"
                      )}
                    >
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-accent-foreground" />}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pr-6">
                    <p className="truncate text-sm font-medium text-foreground">{objective.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={priorityBadgeVariant(objective.priority)} className="capitalize">
                        {objective.priority}
                      </Badge>
                      <Badge variant="outline">{objective.subject}</Badge>
                      <span
                        className={cn(
                          "rounded-pill px-2 py-0.5 text-[10px] font-medium",
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

                {onHide && (
                  <button
                    type="button"
                    aria-label={showHidden ? `Unhide ${objective.title}` : `Hide ${objective.title} from this list`}
                    title={showHidden ? "Unhide" : "Hide from this list"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onHide(objective);
                    }}
                    className={cn(
                      "absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md text-muted transition-all duration-150 hover:bg-danger-muted hover:text-danger active:scale-90",
                      showHidden ? "opacity-100 hover:text-accent hover:bg-accent-muted" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {showHidden ? <Eye className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {onToggleShowHidden && (hiddenCount > 0 || showHidden) && (
        <button
          type="button"
          onClick={onToggleShowHidden}
          className="self-start text-[11px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          {showHidden ? "Back to objectives" : `${hiddenCount} hidden — show`}
        </button>
      )}
    </div>
  );
}