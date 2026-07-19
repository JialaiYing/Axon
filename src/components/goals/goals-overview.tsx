"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  ListTodo,
  Pencil,
  Sparkles,
  Target,
  Timer,
  X,
} from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
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

function paceBadgeVariant(status: GoalPaceStatus): "success" | "warning" | "default" {
  if (status === "done") return "success";
  if (status === "behind") return "warning";
  return "default";
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
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
    <Panel variant="glass" className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {goal.type === "daily" ? "Daily" : "Weekly"}
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">{goal.title}</h2>
        </div>
        <Badge variant={paceBadgeVariant(status)}>{PACE_LABEL[status]}</Badge>
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {goal.progress}
            <span className="text-lg font-medium text-muted-foreground">
              /{goal.target}
              {goal.unit ? ` ${goal.unit}` : ""}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {remaining === 0 ? "Complete" : `${remaining} ${goal.unit || ""} left`.trim()}
          </p>
        </div>
        <ProgressBar value={percent} className="mt-3" />
        <p className="mt-2 text-xs text-muted-foreground">Resets {resetLabel}</p>
      </div>

      {editing ? (
        <div className="mt-5 space-y-3 rounded-lg border border-border/50 bg-card/30 p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`target-${goal.id}`}>Target</Label>
            <Input
              id={`target-${goal.id}`}
              type="number"
              min={1}
              step={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="max-w-[140px]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
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
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Button asChild size="sm">
            <Link href={actionHref}>
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={onStartEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit target
          </Button>
        </div>
      )}
    </Panel>
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
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {entries.map((entry) => {
            const pct = entry.target > 0 ? Math.round((entry.progress / entry.target) * 100) : 0;
            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-lg border px-2.5 py-2.5",
                  entry.hit
                    ? "border-success/25 bg-success-muted/40"
                    : "border-border/50 bg-card/30"
                )}
              >
                <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                  {formatPeriodLabel(entry.type, entry.periodKey)}
                </p>
                <p className="mt-1 text-xs font-medium tabular-nums text-foreground">
                  {entry.progress}/{entry.target}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[11px]",
                    entry.hit ? "text-success" : "text-muted-foreground"
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
  const { dailyGoal, weeklyGoal, history, updateTarget, hydrated } = useGoals();
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const now = new Date();
  const dailyStatus = dailyGoal ? goalPaceStatus(dailyGoal, dayElapsedFraction(now)) : null;
  const weeklyStatus = weeklyGoal ? goalPaceStatus(weeklyGoal, weekElapsedFraction(now)) : null;

  const onTrackCount = [dailyStatus, weeklyStatus].filter(
    (s) => s === "on-track" || s === "done"
  ).length;
  const totalTracked = [dailyGoal, weeklyGoal].filter(Boolean).length;

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
      title="Goals"
      description="Daily and weekly targets that update from your real focus and completed objectives."
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditingId(dailyGoal?.id ?? weeklyGoal?.id ?? null)}
          disabled={!hydrated || (!dailyGoal && !weeklyGoal)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit targets
        </Button>
      }
    >
      {!hydrated ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          {/* Overview header */}
          <Panel variant="glass" className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-success-muted text-success">
                  <Target className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {onTrackCount} of {totalTracked} goals on track
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Progress comes from Pomodoro focus time and Kanban completions — no check-ins.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">Daily hit rate {dailyHitRate}%</Badge>
                <Badge variant="secondary">Weekly hit rate {weeklyHitRate}%</Badge>
              </div>
            </div>
          </Panel>

          {/* Active goals */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {dailyGoal && dailyStatus && (
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
            )}
            {weeklyGoal && weeklyStatus && (
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
            )}
          </div>

          {/* History */}
          <Panel variant="glass" className="space-y-6 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Goal history</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Closed periods after each daily and weekly reset.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-warning" />
                  Daily streak {dailyStreak.current}
                  <span className="text-white/30">·</span>
                  best {dailyStreak.best}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Weekly streak {weeklyStreak.current}
                  <span className="text-white/30">·</span>
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
          </Panel>

          {/* Insights */}
          <Panel variant="glass" className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-accent-muted text-accent">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">Insights</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{insight.message}</p>
                <p className="mt-3 rounded-lg border border-border/50 bg-card/30 px-3 py-2.5 text-sm text-foreground">
                  {insight.suggestion}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/pomodoro">
                      <Timer className="h-3.5 w-3.5" />
                      Focus
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
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
          </Panel>
        </div>
      )}
    </AppPage>
  );
}
