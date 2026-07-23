"use client";

import * as React from "react";
import { Check, ListChecks, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Subtask } from "@/types";

interface SubtaskEditorProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SubtaskEditor({ subtasks, onChange }: SubtaskEditorProps) {
  const [draft, setDraft] = React.useState("");

  const doneCount = subtasks.filter((s) => s.done).length;

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    onChange([...subtasks, { id: createId(), title, done: false }]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5 text-muted" />
          Checklist
        </Label>
        {subtasks.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {doneCount}/{subtasks.length} done
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <ul className="space-y-1.5 rounded-md border border-border bg-wash p-2">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={subtask.done ? "Mark incomplete" : "Mark complete"}
                onClick={() =>
                  onChange(
                    subtasks.map((s) =>
                      s.id === subtask.id ? { ...s, done: !s.done } : s
                    )
                  )
                }
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                  subtask.done
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card hover:border-accent/50"
                )}
              >
                {subtask.done && <Check className="h-3 w-3" />}
              </button>
              <input
                type="text"
                value={subtask.title}
                onChange={(e) =>
                  onChange(
                    subtasks.map((s) =>
                      s.id === subtask.id ? { ...s, title: e.target.value } : s
                    )
                  )
                }
                className={cn(
                  "min-w-0 flex-1 bg-transparent text-sm outline-none",
                  subtask.done && "text-muted line-through"
                )}
              />
              <button
                type="button"
                aria-label="Remove subtask"
                onClick={() => onChange(subtasks.filter((s) => s.id !== subtask.id))}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-muted hover:text-danger"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a checklist item..."
          className="h-8 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!draft.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle?: (subtaskId: string) => void;
  readOnly?: boolean;
}

/** Compact read/toggle view used outside the full editor. */
export function SubtaskList({ subtasks, onToggle, readOnly = false }: SubtaskListProps) {
  if (subtasks.length === 0) return null;
  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <ListChecks className="h-3 w-3" />
        {doneCount}/{subtasks.length} checklist
      </p>
      <ul className="space-y-1">
        {subtasks.map((subtask) => (
          <li key={subtask.id} className="flex items-center gap-2 text-xs">
            <button
              type="button"
              disabled={readOnly || !onToggle}
              aria-label={subtask.done ? "Mark incomplete" : "Mark complete"}
              onClick={() => onToggle?.(subtask.id)}
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                subtask.done
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card",
                (readOnly || !onToggle) && "cursor-default"
              )}
            >
              {subtask.done ? <Check className="h-2.5 w-2.5" /> : null}
              {!subtask.done && !readOnly ? <X className="h-2.5 w-2.5 opacity-0" /> : null}
            </button>
            <span className={cn(subtask.done && "text-muted line-through")}>{subtask.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
