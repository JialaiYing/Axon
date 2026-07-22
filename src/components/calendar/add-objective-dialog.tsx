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
import {
  combineDateAndTime,
  formatDayTitle,
  formatTimeLabel,
  minutesSinceMidnight,
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/calendar-utils";
import { OBJECTIVE_COLORS } from "@/constants/kanban";
import { Textarea } from "@/components/ui/textarea";
import type { Objective, Priority, Recurrence } from "@/types";

interface AddObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: Objective[];
  targetDate: Date;
  onPick: (objective: Objective, start: Date) => void;
  /** Creates a brand-new calendar event (optionally also on the Kanban board). */
  onCreateEvent: (input: {
    title: string;
    subject: string;
    priority: Priority;
    durationMinutes: number;
    showOnKanban: boolean;
    color?: string;
    notes?: string;
    location?: string;
    recurrence?: Recurrence;
    /** Omit to create an unscheduled objective — assign a date later from the calendar. */
    start?: Date;
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
  const [tab, setTab] = React.useState<"existing" | "new">("existing");
  const [search, setSearch] = React.useState("");
  const [subjectFilter, setSubjectFilter] = React.useState("all");
  const [completion, setCompletion] = React.useState<CompletionFilter>("active");
  const [scheduled, setScheduled] = React.useState<ScheduledFilter>("all");

  const [title, setTitle] = React.useState("");
  const [eventSubject, setEventSubject] = React.useState("Personal");
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [durationMinutes, setDurationMinutes] = React.useState(30);
  const [addToKanban, setAddToKanban] = React.useState(false);
  const [color, setColor] = React.useState(OBJECTIVE_COLORS[0]!);
  const [notes, setNotes] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [recurrence, setRecurrence] = React.useState<Recurrence>("none");
  const [date, setDate] = React.useState(() => toDateInputValue(targetDate));
  const [time, setTime] = React.useState(() => toTimeInputValue(targetDate));
  const [dateError, setDateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTab("existing");
    setSearch("");
    setSubjectFilter("all");
    setCompletion("active");
    setScheduled("all");
    setTitle("");
    setEventSubject("Personal");
    setPriority("medium");
    setDurationMinutes(30);
    setAddToKanban(false);
    setColor(OBJECTIVE_COLORS[Math.floor(Math.random() * OBJECTIVE_COLORS.length)]!);
    setNotes("");
    setLocation("");
    setRecurrence("none");
    setDate(toDateInputValue(targetDate));
    setTime(toTimeInputValue(targetDate));
    setDateError(null);
    // Only re-seed when the dialog opens — not when targetDate identity changes mid-open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const subjects = React.useMemo(
    () => Array.from(new Set(objectives.map((o) => o.subject).filter(Boolean))).sort(),
    [objectives]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = objectives.filter((o) => {
      if (query && !o.title.toLowerCase().includes(query) && !o.subject.toLowerCase().includes(query))
        return false;
      if (subjectFilter !== "all" && o.subject !== subjectFilter) return false;
      if (completion === "active" && (o.status === "done" || o.status === "recycled")) return false;
      if (completion === "done" && o.status !== "done") return false;
      if (scheduled === "scheduled" && !o.scheduledStart) return false;
      if (scheduled === "unscheduled" && o.scheduledStart) return false;
      return true;
    });

    // Unscheduled first so Kanban queue items without a calendar date are easy to find.
    return list.sort((a, b) => {
      const aScheduled = a.scheduledStart ? 1 : 0;
      const bScheduled = b.scheduledStart ? 1 : 0;
      if (aScheduled !== bScheduled) return aScheduled - bScheduled;
      return a.title.localeCompare(b.title);
    });
  }, [objectives, search, subjectFilter, completion, scheduled]);

  const resolvedStart = React.useMemo(() => {
    if (!date || !time) return null;
    const start = combineDateAndTime(date, time);
    return Number.isNaN(start.getTime()) ? null : start;
  }, [date, time]);

  const slotLabel = resolvedStart
    ? `${formatDayTitle(resolvedStart)} · ${formatTimeLabel(minutesSinceMidnight(resolvedStart))}`
    : "unscheduled (optional)";

  function resolveStartOrError(required: boolean): Date | null | undefined {
    if (!date && !time) {
      if (required) {
        setDateError("Pick a date and start time.");
        return null;
      }
      setDateError(null);
      return undefined;
    }
    if (!date || !time) {
      setDateError("Pick both a date and a start time, or clear both to leave unscheduled.");
      return null;
    }
    const start = combineDateAndTime(date, time);
    if (Number.isNaN(start.getTime())) {
      setDateError("That date/time isn't valid.");
      return null;
    }
    setDateError(null);
    return start;
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const start = resolveStartOrError(false);
    if (start === null) return;
    onCreateEvent({
      title: title.trim(),
      subject: eventSubject.trim() || "Personal",
      priority,
      durationMinutes: Math.max(5, Math.round(durationMinutes) || 30),
      showOnKanban: addToKanban,
      color,
      notes: notes.trim() || undefined,
      location: !addToKanban && location.trim() ? location.trim() : undefined,
      recurrence,
      start,
    });
  }

  function handlePick(objective: Objective) {
    const start = resolveStartOrError(true);
    if (!start) return;
    onPick(objective, start);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Add to calendar</DialogTitle>
          <DialogDescription>
            {resolvedStart ? (
              <>
                Schedule into <span className="font-medium text-foreground">{slotLabel}</span>.
                Pick an existing Kanban objective below, or create a new event.
              </>
            ) : (
              <>
                Set a date and time, then pick an existing objective to schedule — or create a new
                event. Date is optional when creating new.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="cal-event-date">Date</Label>
              <Input
                id="cal-event-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setDateError(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cal-event-time">Start time</Label>
              <Input
                id="cal-event-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setDateError(null);
                }}
              />
            </div>
          </div>
          {(date || time) && (
            <button
              type="button"
              onClick={() => {
                setDate("");
                setTime("");
                setDateError(null);
              }}
              className="text-left text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear date &amp; time
            </button>
          )}
          {dateError && <p className="text-xs text-danger">{dateError}</p>}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "existing" | "new")}>
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="existing" className="flex-1 cursor-pointer">
              Existing objective
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1 cursor-pointer">
              New event
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-0">
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
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
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

              <ul className="flex max-h-[min(50vh,360px)] flex-col gap-1.5 overflow-y-auto overscroll-contain pr-1">
                {objectives.length === 0 && (
                  <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No objectives yet. Create one on the Kanban board, or use the New event tab.
                  </li>
                )}
                {objectives.length > 0 && filtered.length === 0 && (
                  <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No objectives match these filters ({objectives.length} total). Try “Any
                    scheduling”.
                  </li>
                )}
                {filtered.map((objective) => {
                  const scheduledLabel = formatScheduledDateTime(objective.scheduledStart);
                  return (
                    <li key={objective.id}>
                      <button
                        type="button"
                        onClick={() => handlePick(objective)}
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
                            {!objective.scheduledStart && (
                              <Badge variant="secondary">Needs date</Badge>
                            )}
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
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-0">
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

              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {OBJECTIVE_COLORS.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      aria-label={`Color ${swatch}`}
                      onClick={() => setColor(swatch)}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-transform",
                        color === swatch
                          ? "scale-110 border-foreground"
                          : "border-transparent opacity-80 hover:opacity-100"
                      )}
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Repeats</Label>
                <Select
                  value={recurrence}
                  onValueChange={(v) => setRecurrence(v as Recurrence)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!addToKanban && (
                <div className="space-y-1.5">
                  <Label htmlFor="cal-event-location">Location</Label>
                  <Input
                    id="cal-event-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Room, campus, link…"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="cal-event-notes">Notes</Label>
                <Textarea
                  id="cal-event-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What to bring, agenda, reminders…"
                  className="min-h-[72px]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">Add to Kanban board?</p>
                  <p className="text-[11px] text-muted-foreground">
                    Off = calendar-only event (supports location). On = also appears as a queued card.
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
