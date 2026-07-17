"use client";

import * as React from "react";
import { CalendarPlus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  priorityBadgeVariant,
  formatEstimatedTime,
  formatScheduledDateTime,
} from "@/lib/kanban-utils";
import { formatDayTitle, formatTimeLabel, minutesSinceMidnight } from "@/lib/calendar-utils";
import type { Objective } from "@/types";

interface AddObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: Objective[];
  targetDate: Date;
  onPick: (objective: Objective) => void;
}

type CompletionFilter = "all" | "active" | "done";
type ScheduledFilter = "all" | "scheduled" | "unscheduled";

export function AddObjectiveDialog({ open, onOpenChange, objectives, targetDate, onPick }: AddObjectiveDialogProps) {
  const [search, setSearch] = React.useState("");
  const [subject, setSubject] = React.useState("all");
  const [completion, setCompletion] = React.useState<CompletionFilter>("active");
  const [scheduled, setScheduled] = React.useState<ScheduledFilter>("all");

  React.useEffect(() => {
    if (open) {
      setSearch("");
      setScheduled("all");
    }
  }, [open]);

  const subjects = React.useMemo(
    () => Array.from(new Set(objectives.map((o) => o.subject).filter(Boolean))).sort(),
    [objectives]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return objectives.filter((o) => {
      if (query && !o.title.toLowerCase().includes(query) && !o.subject.toLowerCase().includes(query)) return false;
      if (subject !== "all" && o.subject !== subject) return false;
      if (completion === "active" && o.status === "done") return false;
      if (completion === "done" && o.status !== "done") return false;
      if (scheduled === "scheduled" && !o.scheduledStart) return false;
      if (scheduled === "unscheduled" && o.scheduledStart) return false;
      return true;
    });
  }, [objectives, search, subject, completion, scheduled]);

  const slotLabel = `${formatDayTitle(targetDate)} · ${formatTimeLabel(minutesSinceMidnight(targetDate))}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add existing objective</DialogTitle>
          <DialogDescription>
            Pick an objective to schedule into <span className="font-medium text-foreground">{slotLabel}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search objectives..."
              className="pl-8"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={completion} onValueChange={(v) => setCompletion(v as CompletionFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="done">Completed</SelectItem>
                <SelectItem value="all">Any status</SelectItem>
              </SelectContent>
            </Select>

            <Select value={scheduled} onValueChange={(v) => setScheduled(v as ScheduledFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Scheduling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any scheduling</SelectItem>
                <SelectItem value="unscheduled">Unscheduled</SelectItem>
                <SelectItem value="scheduled">Already scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ul className="mt-3 flex max-h-[45vh] flex-col gap-1.5 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No objectives match these filters.
            </li>
          )}
          {filtered.map((objective) => {
            const scheduledLabel = formatScheduledDateTime(objective.scheduledStart);
            return (
              <li key={objective.id}>
                <button
                  type="button"
                  onClick={() => onPick(objective)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-all duration-200",
                    "hover:border-accent/40 hover:bg-card"
                  )}
                >
                  <CalendarPlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{objective.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={priorityBadgeVariant(objective.priority)} className="capitalize">
                        {objective.priority}
                      </Badge>
                      <Badge variant="outline">{objective.subject}</Badge>
                      {objective.estimatedStudyTime ? (
                        <span className="text-[11px] text-muted-foreground">
                          {formatEstimatedTime(objective.estimatedStudyTime)}
                        </span>
                      ) : null}
                      {scheduledLabel && (
                        <span className="text-[11px] text-warning">already {scheduledLabel}</span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
