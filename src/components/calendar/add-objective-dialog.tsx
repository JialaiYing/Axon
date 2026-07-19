"use client";

import * as React from "react";
import { CalendarPlus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import type { Objective, Priority } from "@/types";

interface AddObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: Objective[];
  targetDate: Date;
  onPick: (objective: Objective) => void;
  /** Creates a brand-new calendar event (optionally also on the Kanban board). */
  onCreateEvent: (input: {
    title: string;
    subject: string;
    priority: Priority;
    durationMinutes: number;
    showOnKanban: boolean;
  }) => void;
}

type CompletionFilter = "all" | "active" | "done";
type ScheduledFilter = "all" | "scheduled" | "unscheduled";

export function AddObjectiveDialog({
  open,
  onOpenChange,
  objectives,
  targetDate,
  onPick,
  onCreateEvent,
}: AddObjectiveDialogProps) {
  const [tab, setTab] = React.useState<"existing" | "new">("new");
  const [search, setSearch] = React.useState("");
  const [subject, setSubject] = React.useState("all");
  const [completion, setCompletion] = React.useState<CompletionFilter>("active");
  const [scheduled, setScheduled] = React.useState<ScheduledFilter>("all");

  const [title, setTitle] = React.useState("");
  const [eventSubject, setEventSubject] = React.useState("Personal");
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [durationMinutes, setDurationMinutes] = React.useState(30);
  const [addToKanban, setAddToKanban] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTab("new");
    setSearch("");
    setScheduled("all");
    setTitle("");
    setEventSubject("Personal");
    setPriority("medium");
    setDurationMinutes(30);
    setAddToKanban(false);
  }, [open]);

  const subjects = React.useMemo(
    () => Array.from(new Set(objectives.map((o) => o.subject).filter(Boolean))).sort(),
    [objectives]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return objectives.filter((o) => {
      if (query && !o.title.toLowerCase().includes(query) && !o.subject.toLowerCase().includes(query))
        return false;
      if (subject !== "all" && o.subject !== subject) return false;
      if (completion === "active" && o.status === "done") return false;
      if (completion === "done" && o.status !== "done") return false;
      if (scheduled === "scheduled" && !o.scheduledStart) return false;
      if (scheduled === "unscheduled" && o.scheduledStart) return false;
      return true;
    });
  }, [objectives, search, subject, completion, scheduled]);

  const slotLabel = `${formatDayTitle(targetDate)} · ${formatTimeLabel(minutesSinceMidnight(targetDate))}`;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateEvent({
      title: title.trim(),
      subject: eventSubject.trim() || "Personal",
      priority,
      durationMinutes: Math.max(5, Math.round(durationMinutes) || 30),
      showOnKanban: addToKanban,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add to calendar</DialogTitle>
          <DialogDescription>
            Schedule into <span className="font-medium text-foreground">{slotLabel}</span>.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "existing" | "new")}>
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="new" className="flex-1 cursor-pointer">
              New event
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex-1 cursor-pointer">
              Existing objective
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="cal-event-title">Title</Label>
                <Input
                  id="cal-event-title"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dentist, Study group, Lab report..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="cal-event-subject">Subject</Label>
                  <Input
                    id="cal-event-subject"
                    value={eventSubject}
                    onChange={(e) => setEventSubject(e.target.value)}
                    placeholder="Personal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cal-event-duration">Duration (minutes)</Label>
                <Input
                  id="cal-event-duration"
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={480}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">Add to Kanban board?</p>
                  <p className="text-[11px] text-muted-foreground">
                    Off = calendar-only event. On = also appears as a queued card.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={addToKanban}
                  onClick={() => setAddToKanban((v) => !v)}
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!title.trim()}>
                  <CalendarPlus className="h-4 w-4" />
                  Create event
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="existing">
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
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

                <Select
                  value={completion}
                  onValueChange={(v) => setCompletion(v as CompletionFilter)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="done">Completed</SelectItem>
                    <SelectItem value="all">Any status</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={scheduled}
                  onValueChange={(v) => setScheduled(v as ScheduledFilter)}
                >
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

            <ul className="mt-3 flex max-h-[40vh] flex-col gap-1.5 overflow-y-auto pr-1">
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
                        "flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-all duration-200",
                        "hover:border-accent/40 hover:bg-card"
                      )}
                    >
                      <CalendarPlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {objective.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={priorityBadgeVariant(objective.priority)}
                            className="capitalize"
                          >
                            {objective.priority}
                          </Badge>
                          <Badge variant="outline">{objective.subject}</Badge>
                          {objective.showOnKanban === false && (
                            <Badge variant="secondary">Calendar only</Badge>
                          )}
                          {objective.estimatedStudyTime ? (
                            <span className="text-[11px] text-muted-foreground">
                              {formatEstimatedTime(objective.estimatedStudyTime)}
                            </span>
                          ) : null}
                          {scheduledLabel && (
                            <span className="text-[11px] text-warning">
                              already {scheduledLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
