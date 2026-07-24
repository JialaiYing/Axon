"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ListTodo,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakFlame } from "@/components/ui/streak-flame";
import { DAILY_FOCUS_GOAL_ID, useGoals } from "@/hooks/use-goals";
import {
  dayElapsedFraction,
  formatPeriodLabel,
  goalPaceStatus,
  PACE_LABEL,
  streakFromHistory,
  weekElapsedFraction,
  type GoalPaceStatus,
} from "@/lib/goals-utils";
import type { Goal, GoalHistoryEntry } from "@/types";
import { cn } from "@/lib/utils";

function paceBadgeVariant(status: GoalPaceStatus): "success" | "warning" | "danger" {
  if (status === "done") return "success";
  if (status === "on-track") return "warning";
  return "danger";
}

/** Icon/label tone for "x of y goals on track" — red / amber / green by ratio. */
function onTrackTone(onTrack: number, total: number) {
  if (total <= 0 || onTrack <= 0) return "danger" as const;
  if (onTrack >= total) return "success" as const;
  return "warning" as const;
}

/** Missed-history % readout: red → amber → green by how close they got. */
function missedPctClass(pct: number) {
  if (pct >= 75) return "text-success";
  if (pct >= 40) return "text-warning";
  return "text-danger";
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 rounded-md" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
      </div>
      <Skeleton className="h-56 rounded-md" />
      <Skeleton className="h-28 rounded-md" />
    </div>
  );
}

function ActiveGoalCard({
  goal,
  status,
  resetLabel,
  actionHref,
  actionLabel,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaveTarget,
}: {
  goal: Goal;
  status: GoalPaceStatus;
  resetLabel: string;
  actionHref: string;
  actionLabel: string;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveTarget: (target: number) => void;
}) {
  const [draft, setDraft] = React.useState(String(goal.target));
  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
  const remaining = Math.max(0, goal.target - goal.progress);

  React.useEffect(() => {
    if (editing) setDraft(String(goal.target));
  }, [editing, goal.target]);

  return (
    <div className="flex h-full flex-col py-4 lg:px-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">
            {goal.type === "daily" ? "Daily" : "Weekly"}
          </p>
          <h2 className="mt-1 text-[15px] font-semibold text-foreground">{goal.title}</h2>
        </div>
        <Badge variant={paceBadgeVariant(status)}>{PACE_LABEL[status]}</Badge>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <p className="font-mono text-2xl font-semibold tabular-nums text-foreground md:text-3xl">
            {goal.progress}
            <span className="text-base font-medium text-muted-foreground md:text-lg">
              /{goal.target}
              {goal.unit ? ` ${goal.unit}` : ""}
            </span>
          </p>
          <p className="text-[12px] text-muted-foreground">
            {remaining === 0 ? "Complete" : `${remaining} ${goal.unit || ""} left`.trim()}
          </p>
        </div>
        <ProgressBar
          value={percent}
          className="mt-3"
          barClassName={status === "done" ? "bg-success" : undefined}
        />
        <p className="mt-2 text-[12px] text-muted-foreground">Resets {resetLabel}</p>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3 rounded-md border border-border/50 p-3 light:border-border">
          <div className="space-y-1.5">
            <Label htmlFor={`target-${goal.id}`}>Target</Label>
            <Input
              id={`target-${goal.id}`}
              type="number"
              min={1}
              step={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="max-w-[140px] shadow-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="shadow-none"
              onClick={() => {
                const next = Number(draft);
                if (!Number.isFinite(next) || next < 1) return;
                onSaveTarget(next);
              }}
            >
              Save target
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button asChild size="sm" className="shadow-none">
            <Link href={actionHref}>
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="shadow-none" onClick={onStartEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit target
          </Button>
        </div>
      )}
    </div>
  );
}

function HistoryGrid({
  title,
  entries,
  emptyHint,
}: {
  title: string;
  entries: GoalHistoryEntry[];
  emptyHint: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold text-foreground">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {entries.map((entry) => {
            const pct = entry.target > 0 ? Math.round((entry.progress / entry.target) * 100) : 0;
            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-md border px-2 py-2",
                  entry.hit
                    ? "border-success/25 bg-success-muted/30"
                    : "border-border/50 light:border-border"
                )}
              >
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {formatPeriodLabel(entry.type, entry.periodKey)}
                </p>
                <p className="mt-1 font-mono text-[12px] font-medium tabular-nums text-foreground">
                  {entry.progress}/{entry.target}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[11px]",
                    entry.hit ? "text-success" : missedPctClass(pct)
                  )}
                >
                  {entry.hit ? "Hit" : "Missed"} · {pct}%
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildInsight(
  dailyHistory: GoalHistoryEntry[],
  weeklyHistory: GoalHistoryEntry[],
  dailyGoal: Goal | null,
  weeklyGoal: Goal | null
): { message: string; suggestion: string } {
  const recentDaily = dailyHistory.slice(0, 14);
  const weekdayHits = recentDaily.filter((e) => {
    const day = new Date(`${e.periodKey}T12:00:00`).getDay();
    return day >= 1 && day <= 5 && e.hit;
  }).length;
  const weekdayTotal = recentDaily.filter((e) => {
    const day = new Date(`${e.periodKey}T12:00:00`).getDay();
    return day >= 1 && day <= 5;
  }).length;
  const weekendHits = recentDaily.filter((e) => {
    const day = new Date(`${e.periodKey}T12:00:00`).getDay();
    return (day === 0 || day === 6) && e.hit;
  }).length;
  const weekendTotal = recentDaily.filter((e) => {
    const day = new Date(`${e.periodKey}T12:00:00`).getDay();
    return day === 0 || day === 6;
  }).length;

  const dailyHitRate =
    recentDaily.length > 0 ? recentDaily.filter((e) => e.hit).length / recentDaily.length : 0;
  const weeklyHitRate =
    weeklyHistory.length > 0
      ? weeklyHistory.slice(0, 8).filter((e) => e.hit).length / Math.min(8, weeklyHistory.length)
      : 0;

  let message = "Keep logging focus sessions and completing objectives — goals update from real activity.";
  if (weekdayTotal >= 3 && weekdayHits / weekdayTotal >= 0.6 && (weekendTotal === 0 || weekendHits / weekendTotal < 0.4)) {
    message = "You usually hit your focus target on weekdays.";
  } else if (dailyHitRate >= 0.7) {
    message = "Your daily focus goal is sticking — consistency is compounding.";
  } else if (weeklyHitRate >= 0.6) {
    message = "You’re closing objectives at a steady weekly pace.";
  } else if (recentDaily.length >= 5 && dailyHitRate < 0.35) {
    message = "Daily focus has been hard to hit lately — smaller targets often rebuild momentum.";
  }

  let suggestion = "Stay the course and reassess targets after another week of data.";
  if (dailyGoal && dailyHitRate >= 0.8) {
    const bump = Math.round(dailyGoal.target * 1.15);
    suggestion = `Consider raising daily focus from ${dailyGoal.target} to ${bump} min.`;
  } else if (dailyGoal && recentDaily.length >= 5 && dailyHitRate < 0.35) {
    const drop = Math.max(25, Math.round(dailyGoal.target * 0.75));
    suggestion = `Try lowering daily focus from ${dailyGoal.target} to ${drop} min for a week.`;
  } else if (weeklyGoal && weeklyHitRate >= 0.75) {
    suggestion = `You’re ready for a tougher weekly target — try ${weeklyGoal.target + 1} objectives.`;
  } else if (weeklyGoal && weeklyHistory.length >= 3 && weeklyHitRate < 0.35) {
    suggestion = `Dial weekly objectives back to ${Math.max(1, weeklyGoal.target - 1)} until the hit rate recovers.`;
  }

  return { message, suggestion };
}

export function GoalsOverview() {
  const {
    dailyGoal,
    weeklyGoal,
    personalGoals,
    history,
    updateTarget,
    addPersonalGoal,
    deleteGoal,
    setManualProgress,
    hydrated,
  } = useGoals();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftType, setDraftType] = React.useState<"daily" | "weekly">("daily");
  const [draftTarget, setDraftTarget] = React.useState("1");
  const [draftUnit, setDraftUnit] = React.useState("");

  const now = new Date();
  const dailyStatus = dailyGoal ? goalPaceStatus(dailyGoal, dayElapsedFraction(now)) : null;
  const weeklyStatus = weeklyGoal ? goalPaceStatus(weeklyGoal, weekElapsedFraction(now)) : null;

  const onTrackCount = [dailyStatus, weeklyStatus].filter(
    (s) => s === "on-track" || s === "done"
  ).length;
  const totalTracked = [dailyGoal, weeklyGoal].filter(Boolean).length;
  const trackTone = onTrackTone(onTrackCount, totalTracked);

  const dailyHistory = React.useMemo(
    () => history.filter((e) => e.type === "daily").slice(0, 14),
    [history]
  );
  const weeklyHistory = React.useMemo(
    () => history.filter((e) => e.type === "weekly").slice(0, 8),
    [history]
  );

  const dailyStreak = React.useMemo(() => streakFromHistory(history, "daily"), [history]);
  const weeklyStreak = React.useMemo(() => streakFromHistory(history, "weekly"), [history]);

  const dailyHitRate =
    dailyHistory.length > 0
      ? Math.round((dailyHistory.filter((e) => e.hit).length / dailyHistory.length) * 100)
      : 0;
  const weeklyHitRate =
    weeklyHistory.length > 0
      ? Math.round((weeklyHistory.filter((e) => e.hit).length / weeklyHistory.length) * 100)
      : 0;

  const insight = React.useMemo(
    () => buildInsight(dailyHistory, weeklyHistory, dailyGoal, weeklyGoal),
    [dailyHistory, weeklyHistory, dailyGoal, weeklyGoal]
  );

  return (
    <AppPage
      feature="goals"
      title="Goals"
      description="Daily and weekly targets that update from your real focus and completed objectives."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="shadow-none" onClick={() => setCreateOpen((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />
            Personal goal
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shadow-none"
            onClick={() => setEditingId(dailyGoal?.id ?? weeklyGoal?.id ?? null)}
            disabled={!hydrated || (!dailyGoal && !weeklyGoal)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit study targets
          </Button>
        </div>
      }
    >
      {!hydrated ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          {/* First-run: no activity yet (goals are seeded, so empty = no progress) */}
          {dailyGoal?.progress === 0 &&
            weeklyGoal?.progress === 0 &&
            dailyHistory.length === 0 &&
            weeklyHistory.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border/60 px-6 py-8 text-center light:border-border">
                <Timer className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-semibold text-foreground">No activity yet</p>
                  <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted-foreground">
                    Daily focus minutes come from Pomodoro sessions. Weekly objective counts come
                    from Kanban completions. Start either to see these goals move.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild size="sm" className="shadow-none">
                    <Link href="/pomodoro">
                      <Timer className="h-3.5 w-3.5" />
                      Start focus
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="shadow-none">
                    <Link href="/kanban">
                      <ListTodo className="h-3.5 w-3.5" />
                      Open board
                    </Link>
                  </Button>
                </div>
              </div>
            )}

          {/* Overview strip */}
          <div className="flex flex-col gap-3 border-y border-border/50 py-4 light:border-border sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Target
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  trackTone === "success" && "text-success",
                  trackTone === "warning" && "text-warning",
                  trackTone === "danger" && "text-danger"
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-[13px] font-semibold",
                    trackTone === "success" && "text-success",
                    trackTone === "warning" && "text-warning",
                    trackTone === "danger" && "text-danger"
                  )}
                >
                  {onTrackCount} of {totalTracked} goals on track
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Progress comes from Pomodoro focus time and Kanban completions — no check-ins.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              <span>
                Daily hit{" "}
                <span className="font-mono tabular-nums text-foreground">{dailyHitRate}%</span>
              </span>
              <span className="hidden text-border sm:inline">·</span>
              <span>
                Weekly hit{" "}
                <span className="font-mono tabular-nums text-foreground">{weeklyHitRate}%</span>
              </span>
            </div>
          </div>

          {/* Active goals — one divided band */}
          <div className="grid grid-cols-1 divide-y divide-border/60 border-y border-border/50 lg:grid-cols-2 lg:divide-x lg:divide-y-0 light:divide-border light:border-border">
            {dailyGoal && dailyStatus && (
              <div className="lg:pr-6">
                <ActiveGoalCard
                  goal={dailyGoal}
                  status={dailyStatus}
                  resetLabel="at local midnight"
                  actionHref="/pomodoro"
                  actionLabel="Start focus"
                  editing={editingId === dailyGoal.id}
                  onStartEdit={() => setEditingId(dailyGoal.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveTarget={(target) => {
                    updateTarget(dailyGoal.id, target);
                    setEditingId(null);
                  }}
                />
              </div>
            )}
            {weeklyGoal && weeklyStatus && (
              <div className="lg:pl-6">
                <ActiveGoalCard
                  goal={weeklyGoal}
                  status={weeklyStatus}
                  resetLabel="every Monday"
                  actionHref="/kanban"
                  actionLabel="Open board"
                  editing={editingId === weeklyGoal.id}
                  onStartEdit={() => setEditingId(weeklyGoal.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveTarget={(target) => {
                    updateTarget(weeklyGoal.id, target);
                    setEditingId(null);
                  }}
                />
              </div>
            )}
          </div>

          {createOpen && (
            <div className="space-y-3 rounded-md border border-border/50 p-4 light:border-border light:bg-card">
              <h2 className="text-[13px] font-semibold text-foreground">New personal goal</h2>
              <p className="text-[12px] text-muted-foreground">
                Open-ended daily or weekly goals outside of study tracking — habits, chores,
                fitness, anything you want to hit.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="personal-title">Title</Label>
                  <Input
                    id="personal-title"
                    value={draftTitle}
                    maxLength={120}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="e.g. Drink 8 glasses of water"
                    className="shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="personal-type">Cadence</Label>
                  <select
                    id="personal-type"
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as "daily" | "weekly")}
                    className="flex h-10 w-full rounded-md border border-border/60 bg-transparent px-3 text-[13px] text-foreground light:border-border"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="personal-target">Target</Label>
                  <Input
                    id="personal-target"
                    type="number"
                    min={1}
                    max={9999}
                    value={draftTarget}
                    onChange={(e) => setDraftTarget(e.target.value)}
                    className="shadow-none"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="personal-unit">Unit (optional)</Label>
                  <Input
                    id="personal-unit"
                    value={draftUnit}
                    maxLength={24}
                    onChange={(e) => setDraftUnit(e.target.value)}
                    placeholder="times, pages, km…"
                    className="shadow-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="shadow-none"
                  onClick={() => {
                    const created = addPersonalGoal({
                      title: draftTitle,
                      type: draftType,
                      target: Number(draftTarget) || 1,
                      unit: draftUnit,
                    });
                    if (created) {
                      setDraftTitle("");
                      setDraftTarget("1");
                      setDraftUnit("");
                      setCreateOpen(false);
                    }
                  }}
                >
                  Create goal
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {personalGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[13px] font-semibold text-foreground">Personal goals</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {personalGoals.map((goal) => {
                  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
                  return (
                    <div
                      key={goal.id}
                      className="rounded-md border border-border/50 p-4 light:border-border light:bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {goal.type} · personal
                          </p>
                          <p className="mt-1.5 text-[15px] font-semibold text-foreground">
                            {goal.title}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Delete goal"
                          onClick={() => deleteGoal(goal.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-danger-muted hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-3 font-mono text-xl font-semibold tabular-nums text-foreground">
                        {goal.progress}
                        <span className="text-base text-muted-foreground">
                          /{goal.target}
                          {goal.unit ? ` ${goal.unit}` : ""}
                        </span>
                      </p>
                      <ProgressBar
                        value={percent}
                        className="mt-3"
                        barClassName={goal.completed || percent >= 100 ? "bg-success" : undefined}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="shadow-none"
                          onClick={() => setManualProgress(goal.id, goal.progress + 1)}
                          disabled={goal.progress >= goal.target}
                        >
                          +1 progress
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setManualProgress(goal.id, 0)}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* History */}
          <section className="space-y-5 border-t border-border/50 pt-5 light:border-border">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">Goal history</h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Closed periods after each daily and weekly reset.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <StreakFlame days={dailyStreak.current} size="sm" />
                  Daily streak {dailyStreak.current}
                  <span className="text-muted-foreground/50">·</span>
                  best {dailyStreak.best}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Weekly streak {weeklyStreak.current}
                  <span className="text-muted-foreground/50">·</span>
                  best {weeklyStreak.best}
                </span>
              </div>
            </div>

            <HistoryGrid
              title="Daily focus"
              entries={dailyHistory}
              emptyHint="Complete a day of focus sessions to start building history."
            />
            <HistoryGrid
              title="Weekly objectives"
              entries={weeklyHistory}
              emptyHint="Finish objectives this week to start weekly history."
            />
          </section>

          {/* Insights */}
          <section className="border-t border-border/50 pt-5 light:border-border">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] font-semibold text-foreground">Insights</h2>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{insight.message}</p>
                <p className="mt-3 rounded-md bg-wash px-3 py-2.5 text-[13px] text-foreground">
                  {insight.suggestion}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="shadow-none">
                    <Link href="/pomodoro">
                      <Timer className="h-3.5 w-3.5" />
                      Focus
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="shadow-none">
                    <Link href="/kanban">
                      <ListTodo className="h-3.5 w-3.5" />
                      Board
                    </Link>
                  </Button>
                  {dailyGoal?.id === DAILY_FOCUS_GOAL_ID && (
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(dailyGoal.id)}>
                      Adjust targets
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppPage>
  );
}
