"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Gauge,
  Repeat,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useUserStats } from "@/hooks/use-user-stats";
import { MAX_LEVEL, LEVELS_PER_RANK, RANK_NAMES } from "@/lib/progress/ranks";
import { cn } from "@/lib/utils";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;
const TIER_LABELS = ["I", "II", "III"] as const;

function StatTile({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
}) {
  return (
    <Panel variant="interactive" className="p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-foreground/6 text-foreground/60">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-medium text-foreground/60">{label}</p>
      </div>
      <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">
        <AnimatedCounter value={value} />
        {suffix}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </Panel>
  );
}

function RankLadder({ level }: { level: number }) {
  return (
    <Panel variant="glass" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Rank ladder</h2>
        <p className="text-[11px] text-muted-foreground">10 ranks · 3 tiers each · 30 levels</p>
      </div>
      <div className="space-y-2">
        {RANK_NAMES.map((name, rankIndex) => {
          const baseLevel = rankIndex * LEVELS_PER_RANK;
          const isCurrentRank = level > baseLevel && level <= baseLevel + LEVELS_PER_RANK;
          return (
            <div
              key={name}
              className={cn(
                "flex flex-col gap-2.5 rounded-xl border p-3 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between",
                isCurrentRank
                  ? "border-accent/30 bg-accent-muted/20"
                  : "border-border bg-surface/40"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    isCurrentRank
                      ? "bg-accent-muted text-accent"
                      : level > baseLevel + LEVELS_PER_RANK
                        ? "bg-secondary-muted text-secondary"
                        : "bg-surface text-muted-foreground/60"
                  )}
                >
                  <Trophy className="h-4 w-4" />
                </span>
                <p
                  className={cn(
                    "text-sm font-medium",
                    level > baseLevel ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 pl-[42px] sm:pl-0">
                {TIER_LABELS.map((tierLabel, tierIdx) => {
                  const tierLevel = baseLevel + tierIdx + 1;
                  const state =
                    tierLevel < level
                      ? "done"
                      : tierLevel === level
                        ? "current"
                        : "locked";
                  return (
                    <span
                      key={tierLabel}
                      title={`Level ${tierLevel}`}
                      className={cn(
                        "flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-semibold tabular-nums transition-colors duration-200",
                        state === "done" && "bg-secondary-muted text-secondary",
                        state === "current" &&
                          "bg-accent text-accent-foreground shadow-[0_0_0_3px_var(--color-accent-muted)]",
                        state === "locked" && "bg-surface text-muted-foreground/50"
                      )}
                    >
                      {tierLabel}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function RankOverview() {
  const prefersReducedMotion = useReducedMotion();
  const { stats, progression, rank, todayXp, hydrated } = useUserStats();

  if (!hydrated) {
    return (
      <AppPage title="Rank" description="Your full level ladder, streaks, and how XP is earned." feature="rank">
        <div className="h-64 animate-pulse rounded-2xl bg-surface/60" />
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Rank & Progress"
      description="Your full level ladder, streaks, and how XP is earned — in one place."
      feature="rank"
    >
      <motion.div
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="space-y-4"
      >
        {/* Hero */}
        <Panel variant="glass" className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/6 text-accent">
                <Trophy className="h-7 w-7" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/45">
                  Current rank
                </p>
                <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
                  {rank.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {todayXp > 0 && (
                <Badge variant="accent" className="gap-1">
                  <Sparkles className="h-3 w-3" /> +{todayXp} XP today
                </Badge>
              )}
              <Badge variant="secondary">Level {progression.level} / {MAX_LEVEL}</Badge>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between text-xs text-foreground/55">
              <span>{progression.isMaxLevel ? "Max level reached" : "XP to next level"}</span>
              {!progression.isMaxLevel && (
                <span className="font-mono tabular-nums text-foreground/70">
                  {progression.xpIntoLevel.toLocaleString()} / {progression.xpForNextLevel?.toLocaleString()}
                </span>
              )}
            </div>
            <ProgressBar value={progression.progressPercent} />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {stats.xp.toLocaleString()} lifetime XP · unlock new dashboard backgrounds as you rank
            up in{" "}
            <Link href="/settings" className="text-accent underline">
              Settings
            </Link>
            .
          </p>
        </Panel>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            icon={Flame}
            label="Current streak"
            value={stats.currentStreak}
            suffix=" d"
            hint="Consecutive active days"
          />
          <StatTile
            icon={Trophy}
            label="Longest streak"
            value={stats.longestStreak}
            suffix=" d"
            hint="Personal best"
          />
          <StatTile
            icon={Repeat}
            label="Intervals"
            value={stats.intervalsCompleted}
            hint="All-time completed"
          />
          <StatTile
            icon={Gauge}
            label="Productivity"
            value={stats.productivityIndex}
            suffix="%"
            hint="Last 7 days"
          />
        </div>

        {/* Ladder */}
        <RankLadder level={progression.level} />

        {/* How XP works */}
        <Panel variant="interactive" className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">How XP is earned</h2>
          <ul className="space-y-2.5 text-sm text-muted">
            <li className="flex items-center gap-2.5">
              <Star className="h-4 w-4 shrink-0 text-accent" /> XP earned per completed objective and
              focused Pomodoro interval
            </li>
            <li className="flex items-center gap-2.5">
              <Flame className="h-4 w-4 shrink-0 text-warning" /> Daily and weekly streaks tracked
              automatically from real sessions
            </li>
            <li className="flex items-center gap-2.5">
              <Trophy className="h-4 w-4 shrink-0 text-secondary" /> Ranks and dashboard backgrounds
              unlocked as your level climbs
            </li>
          </ul>
          <Link
            href="/settings"
            className="mt-4 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Manage backgrounds in Settings <ArrowRight className="h-3 w-3" />
          </Link>
        </Panel>
      </motion.div>
    </AppPage>
  );
}
