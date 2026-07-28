"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, ListTodo, Plus, Trash2, X } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakFlame } from "@/components/ui/streak-flame";
import { useGoals, DAILY_OBJECTIVES_GOAL_ID, WEEKLY_OBJECTIVES_GOAL_ID } from "@/hooks/use-goals";
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

function LoadingState() {
  return (
    <div className="w-full space-y-10">
      <Skeleton className="h-10 w-64" />
      <div className="space-y-8">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function statusClass(status: GoalPaceStatus) {
  if (status === "done") return "text-success";
  if (status === "on-track") return "text-warning";
  return "text-danger";
}

function progressBarClass(status: GoalPaceStatus) {
  if (status === "done") return "bg-success";
  if (status === "on-track") return "bg-accent";
  return "bg-danger/70";
}

function onTrackSummaryClass(onTrack: number, total: number) {
  if (total <= 0 || onTrack <= 0) return "text-danger";
  if (onTrack >= total) return "text-success";
  return "text-warning";
}

function StudyGoalRow({
  goal,
  status,
  resetLabel,
}: {
  goal: Goal;
  status: GoalPaceStatus;
  resetLabel: string;
}) {
  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
  const remaining = Math.max(0, goal.target - goal.progress);

  return (
    <div className="py-8">
      <div className="flex items-baseline justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[15px] text-muted-foreground">
            {goal.type === "daily" ? "Daily" : "Weekly"}
            <span className="text-muted-foreground/40"> · </span>
            <span className={cn("font-medium", statusClass(status))}>
              {PACE_LABEL[status]}
            </span>
          </p>
          <h2 className="mt-1.5 text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
            {goal.title}
          </h2>
        </div>
        <p
          className={cn(
            "shrink-0 font-mono text-3xl font-medium tabular-nums tracking-tight sm:text-4xl",
            status === "done" ? "text-success" : "text-foreground"
          )}
        >
          {goal.progress}
          <span className="text-xl text-muted-foreground sm:text-2xl">/{goal.target}</span>
        </p>
      </div>

      <ProgressBar
        value={percent}
        size="md"
        className="mt-5"
        barClassName={progressBarClass(status)}
      />

      <p className="mt-3 text-[14px] text-muted-foreground">
        <span className={remaining === 0 ? "text-success" : undefined}>
          {remaining === 0 ? "Done" : `${remaining} left`}
        </span>
        <span className="text-muted-foreground/40"> · </span>
        Resets {resetLabel}
      </p>
    </div>
  );
}

function PersonalGoalRow({
  goal,
  onIncrement,
  onReset,
  onDelete,
}: {
  goal: Goal;
  onIncrement: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const percent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
  const done = goal.completed || percent >= 100;
  const status: GoalPaceStatus = done ? "done" : goal.progress > 0 ? "on-track" : "behind";
  const remaining = Math.max(0, goal.target - goal.progress);
  const streakCount = goal.streak ?? 0;
  const streakLabel = goal.type === "weekly" ? "week" : "day";

  return (
    <li className="group py-8">
      <div className="flex items-baseline justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[15px] text-muted-foreground">
            {goal.type === "daily" ? "Daily" : "Weekly"}
            <span className="text-muted-foreground/40"> · </span>
            <span className={cn("font-medium", statusClass(status))}>
              {PACE_LABEL[status]}
            </span>
          </p>
          <h2 className="mt-1.5 text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
            {goal.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p
            className={cn(
              "font-mono text-3xl font-medium tabular-nums tracking-tight sm:text-4xl",
              done ? "text-success" : "text-foreground"
            )}
          >
            {goal.progress}
            <span className="text-xl text-muted-foreground sm:text-2xl">/{goal.target}</span>
          </p>
          <button
            type="button"
            aria-label="Delete goal"
            onClick={onDelete}
            className="rounded-sm p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-wash hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ProgressBar
        value={percent}
        size="md"
        className="mt-5"
        barClassName={progressBarClass(status)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {streakCount > 0 ? (
          <>
            <p className="inline-flex items-center gap-1.5 text-[14px]">
              <StreakFlame days={streakCount} size="md" />
              <span className="font-medium tabular-nums text-warning">
                {streakCount} {streakLabel}
                {streakCount === 1 ? "" : "s"} streak
              </span>
            </p>
            <span className="text-muted-foreground/40">·</span>
          </>
        ) : null}
        <p className="text-[14px] text-muted-foreground">
          <span className={remaining === 0 ? "text-success" : undefined}>
            {remaining === 0 ? "Done" : `${remaining} left`}
          </span>
          <span className="text-muted-foreground/40"> · </span>
          Resets {goal.type === "daily" ? "at midnight" : "Mondays"}
        </p>
      </div>

      <div className="mt-3 flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-[14px] text-muted-foreground shadow-none hover:text-foreground"
          onClick={onIncrement}
          disabled={goal.progress >= goal.target}
        >
          +1
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-[14px] text-muted-foreground shadow-none hover:text-foreground"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
    </li>
  );
}

function HistoryStrip({
  label,
  entries,
  emptyHint,
}: {
  label: string;
  entries: GoalHistoryEntry[];
  emptyHint: string;
}) {
  return (
    <div>
      <p className="mb-4 text-[15px] font-medium text-foreground">{label}</p>
      {entries.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-7">
          {entries.map((entry) => (
            <div
              key={entry.id}
              title={`${formatPeriodLabel(entry.type, entry.periodKey)} — ${entry.progress}/${entry.target}`}
              className={cn(
                "rounded-sm px-3 py-2.5 text-center",
                entry.hit ? "bg-success-muted/40" : "bg-wash"
              )}
            >
              <p className="font-mono text-[12px] tabular-nums text-muted-foreground">
                {formatPeriodLabel(entry.type, entry.periodKey).replace(/^Week of /, "")}
              </p>
              <p
                className={cn(
                  "mt-1 font-mono text-[15px] font-medium tabular-nums",
                  entry.hit ? "text-success" : "text-muted-foreground"
                )}
              >
                {entry.progress}/{entry.target}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GoalsOverview() {
  const {
    dailyGoal,
    weeklyGoal,
    personalGoals,
    history,
    addPersonalGoal,
    deleteGoal,
    setManualProgress,
    hydrated,
  } = useGoals();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftType, setDraftType] = React.useState<"daily" | "weekly">("daily");
  const [draftTarget, setDraftTarget] = React.useState("1");

  const now = new Date();
  const dailyStatus = dailyGoal ? goalPaceStatus(dailyGoal, dayElapsedFraction(now)) : null;
  const weeklyStatus = weeklyGoal ? goalPaceStatus(weeklyGoal, weekElapsedFraction(now)) : null;

  const onTrackCount = [dailyStatus, weeklyStatus].filter(
    (s) => s === "on-track" || s === "done"
  ).length;
  const totalTracked = [dailyGoal, weeklyGoal].filter(Boolean).length;

  const dailyHistory = React.useMemo(
    () =>
      history
        .filter((e) => e.type === "daily" && e.goalId === DAILY_OBJECTIVES_GOAL_ID)
        .slice(0, 14),
    [history]
  );
  const weeklyHistory = React.useMemo(
    () =>
      history
        .filter((e) => e.type === "weekly" && e.goalId === WEEKLY_OBJECTIVES_GOAL_ID)
        .slice(0, 8),
    [history]
  );

  const dailyStreak = React.useMemo(
    () => streakFromHistory(history, "daily", DAILY_OBJECTIVES_GOAL_ID),
    [history]
  );
  const weeklyStreak = React.useMemo(
    () => streakFromHistory(history, "weekly", WEEKLY_OBJECTIVES_GOAL_ID),
    [history]
  );

  const isEmpty =
    dailyGoal?.progress === 0 &&
    weeklyGoal?.progress === 0 &&
    dailyHistory.length === 0 &&
    weeklyHistory.length === 0;

  return (
    <AppPage
      feature="goals"
      title="Goals"
      actions={
        <Button
          size="sm"
          variant="ghost"
          className="text-[15px] text-muted-foreground shadow-none hover:text-foreground"
          onClick={() => setCreateOpen((v) => !v)}
        >
          <Plus className="h-4 w-4" />
          Personal
        </Button>
      }
    >
      {!hydrated ? (
        <LoadingState />
      ) : (
        <div className="w-full">
          {isEmpty ? (
            <div className="py-20 text-center">
              <p className="text-xl font-medium text-foreground">Nothing completed yet</p>
              <p className="mx-auto mt-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="text-foreground">3</span> today
                <span className="text-muted-foreground/40"> · </span>
                <span className="text-foreground">15</span> this week
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-8 text-[15px] shadow-none">
                <Link href="/kanban">
                  <ListTodo className="h-4 w-4" />
                  Open board
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
                <span className={cn("font-medium", onTrackSummaryClass(onTrackCount, totalTracked))}>
                  {onTrackCount} of {totalTracked} on track
                </span>
                {dailyStreak.current > 0 ? (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-warning">
                      <StreakFlame days={dailyStreak.current} size="md" />
                      {dailyStreak.current} day streak
                    </span>
                  </>
                ) : null}
              </p>

              <div className="mt-3 divide-y divide-border/40 light:divide-border">
                {dailyGoal && dailyStatus && (
                  <StudyGoalRow
                    goal={dailyGoal}
                    status={dailyStatus}
                    resetLabel="at midnight"
                  />
                )}
                {weeklyGoal && weeklyStatus && (
                  <StudyGoalRow
                    goal={weeklyGoal}
                    status={weeklyStatus}
                    resetLabel="Mondays"
                  />
                )}
              </div>

              <div className="mt-3">
                <Link
                  href="/kanban"
                  className="inline-flex items-center gap-1.5 text-[15px] text-accent transition-colors hover:text-foreground"
                >
                  Open board
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </>
          )}

          {createOpen && (
            <div className="mt-12 space-y-5 border-t border-border/40 pt-10 light:border-border">
              <p className="text-xl font-medium text-foreground">New personal goal</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="personal-title" className="text-[14px] text-muted-foreground">
                    Title
                  </Label>
                  <Input
                    id="personal-title"
                    value={draftTitle}
                    maxLength={120}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Drink 8 glasses of water"
                    className="h-11 border-0 border-b border-border/40 bg-transparent px-0 text-[16px] shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal-type" className="text-[14px] text-muted-foreground">
                    Cadence
                  </Label>
                  <select
                    id="personal-type"
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as "daily" | "weekly")}
                    className="flex h-11 w-full border-0 border-b border-border/40 bg-transparent px-0 text-[16px] text-foreground focus:outline-none light:border-border"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal-target" className="text-[14px] text-muted-foreground">
                    Target
                  </Label>
                  <Input
                    id="personal-target"
                    type="number"
                    min={1}
                    max={9999}
                    value={draftTarget}
                    onChange={(e) => setDraftTarget(e.target.value)}
                    className="h-11 border-0 border-b border-border/40 bg-transparent px-0 text-[16px] shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  className="shadow-none"
                  onClick={() => {
                    const created = addPersonalGoal({
                      title: draftTitle,
                      type: draftType,
                      target: Number(draftTarget) || 1,
                    });
                    if (created) {
                      setDraftTitle("");
                      setDraftTarget("1");
                      setCreateOpen(false);
                    }
                  }}
                >
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCreateOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {personalGoals.length > 0 && (
            <div className="mt-14">
              <p className="text-[15px] font-medium text-foreground">Personal</p>
              <ul className="mt-3 divide-y divide-border/40 light:divide-border">
                {personalGoals.map((goal) => (
                  <PersonalGoalRow
                    key={goal.id}
                    goal={goal}
                    onIncrement={() => setManualProgress(goal.id, goal.progress + 1)}
                    onReset={() => setManualProgress(goal.id, 0)}
                    onDelete={() => deleteGoal(goal.id)}
                  />
                ))}
              </ul>
            </div>
          )}

          {!isEmpty && (
            <section className="mt-16 border-t border-border/40 pt-10 light:border-border">
              <button
                type="button"
                aria-expanded={historyOpen}
                onClick={() => setHistoryOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 text-left transition-colors hover:text-foreground"
              >
                <span className="inline-flex items-center gap-2 text-xl font-medium text-foreground">
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200",
                      historyOpen && "rotate-90"
                    )}
                  />
                  History
                </span>
                <span className="text-[15px] text-muted-foreground">
                  Best daily{" "}
                  <span className="font-medium tabular-nums text-warning">{dailyStreak.best}</span>
                  <span className="text-muted-foreground/40"> · </span>
                  Best weekly{" "}
                  <span className="font-medium tabular-nums text-accent">{weeklyStreak.best}</span>
                </span>
              </button>

              {historyOpen && (
                <div className="mt-8 space-y-10">
                  <HistoryStrip
                    label="Daily"
                    entries={dailyHistory}
                    emptyHint="No closed days yet."
                  />
                  <HistoryStrip
                    label="Weekly"
                    entries={weeklyHistory}
                    emptyHint="No closed weeks yet."
                  />
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </AppPage>
  );
}
