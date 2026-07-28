"use client";

import { cn } from "@/lib/utils";
import { sortByPriority } from "@/lib/kanban-utils";
import type { Objective } from "@/types";

interface ObjectivePickerProps {
  objectives: Objective[];
  selectedId: string | null;
  onSelect: (objective: Objective) => void;
}

/** Title-only list, higher priority first. */
export function ObjectivePicker({
  objectives,
  selectedId,
  onSelect,
}: ObjectivePickerProps) {
  const sorted = sortByPriority(objectives);

  return (
    <div className="flex w-full flex-col">
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-muted-foreground">
          No objectives yet.
        </p>
      ) : (
        <ul className="flex max-h-[5.75rem] flex-col overflow-y-auto overscroll-contain">
          {sorted.map((objective) => {
            const isSelected = objective.id === selectedId;
            return (
              <li key={objective.id}>
                <button
                  type="button"
                  onClick={() => onSelect(objective)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-100",
                    isSelected
                      ? "bg-wash-strong text-foreground"
                      : "text-foreground/90 hover:bg-wash/80"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      isSelected ? "bg-foreground" : "bg-border-strong"
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[15px] leading-snug tracking-[-0.01em]">
                    {objective.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
