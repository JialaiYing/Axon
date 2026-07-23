"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Gauge,
  Repeat,
  Star,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppPage } from "@/components/layout/app-page";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakFlame } from "@/components/ui/streak-flame";
import { useUserStats } from "@/hooks/use-user-stats";
import {
  MAX_LEVEL,
  LEVELS_PER_RANK,
  RANK_NAMES,
  rankTrophyClass,
} from "@/lib/progress/ranks";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TIER_LABELS = ["I", "II", "III"] as const;

function StatTile({
  icon: Icon,
  iconNode,
  label,
  value,
  suffix,
  hint,
}: {
  icon?: LucideIcon;
  iconNode?: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        {iconNode ?? (Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null)}
      </div>
      <p className="font-mono text-xl font-semibold tabular-nums text-foreground">
        <AnimatedCounter value={value} />
        {suffix}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function RankLadder({ level }: { level: number }) {
  return (
    <section className="space-y-4 border-t border-border/50 pt-5 light:border-border">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Rank ladder</h2>
        <p className="text-[12px] text-muted-foreground">10 ranks · 3 tiers each · 30 levels</p>
      </div>
      <div className="space-y-1">
        {RANK_NAMES.map((name, rankIndex) => {
          const baseLevel = rankIndex * LEVELS_PER_RANK;
          const isCurrentRank = level > baseLevel && level <= baseLevel + LEVELS_PER_RANK;
          const isPastRank = level > baseLevel + LEVELS_PER_RANK;
          return (
            <div
              key={name}
              className={cn(
                "flex flex-col gap-2 rounded-md px-3 py-2.5 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between",
                isCurrentRank
                  ? "bg-foreground/[0.08] light:bg-black/[0.06]"
                  : "hover:bg-foreground/[0.03] light:hover:bg-black/[0.03]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Trophy
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-opacity duration-200",
                    rankTrophyClass(rankIndex + 1),
                    isCurrentRank
                      ? "opacity-100"
                      : isPastRank
                        ? "opacity-80"
                        : "opacity-30"
                  )}
                  aria-hidden
                />
                <p
                  className={cn(
                    "text-[13px] font-medium",
                    level > baseLevel ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 pl-6 sm:pl-0">
                {TIER_LABELS.map((tierLabel, tierIdx) => {
                  const tierLevel = baseLevel + tierIdx + 1;
                  const state =
                    tierLevel < level
                      ? "done"
                      : tierLevel === level
                        ? "current"
                        : "locked";
                  const metal = rankTrophyClass(rankIndex + 1);
                  return (
                    <span
                      key={tierLabel}
                      title={`Level ${tierLevel}`}
                      className={cn(
                        "flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-semibold tabular-nums transition-colors duration-200",
                        state === "done" &&
                          cn(
                            "bg-foreground/[0.06] light:bg-black/[0.05]",
                            metal,
                            "opacity-70"
                          ),
                        state === "current" &&
                          cn(
                            "bg-foreground/[0.1] ring-1 ring-inset ring-foreground/15 light:bg-black/[0.08] light:ring-black/10",
                            metal
                          ),
                        state === "locked" && "text-muted-foreground/35"
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
    </section>
  );
}

export function RankOverview() {
  const prefersReducedMotion = useReducedMotion();
  const { stats, progression, rank, todayXp, hydrated } = useUserStats();

  if (!hydrated) {
    return (
      <AppPage title="Rank" description="Your full level ladder, streaks, and how XP is earned." feature="rank">
        <div className="space-y-5">
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-64 rounded-md" />
        </div>
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
        transition={{ duration: prefersReducedMotion ? 0 : DURATION.section, ease: EASE }}
        className="space-y-6"
      >
        {/* Hero strip */}
        <section className="border-y border-border/50 py-5 light:border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Trophy
                className={cn("h-5 w-5 shrink-0", rankTrophyClass(rank.rankIndex))}
                aria-hidden
              />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Current rank</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {rank.label}
                </p>
                <p className="mt-1 font-mono text-[12px] tabular-nums text-muted-foreground">
                  Level {progression.level} / {MAX_LEVEL}
                  {todayXp > 0 && (
                    <span className="ml-2 text-foreground">· +{todayXp} XP today</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{progression.isMaxLevel ? "Max level reached" : "XP to next level"}</span>
              {!progression.isMaxLevel && (
                <span className="font-mono tabular-nums text-foreground">
                  {progression.xpIntoLevel.toLocaleString()} /{" "}
                  {progression.xpForNextLevel?.toLocaleString()}
                </span>
              )}
            </div>
            <ProgressBar value={progression.progressPercent} />
          </div>

          <p className="mt-3 text-[12px] text-muted-foreground">
            {stats.xp.toLocaleString()} lifetime XP · unlock dashboard backgrounds as you rank up in{" "}
            <Link
              href="/settings"
              className="text-muted-foreground underline decoration-border underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              Settings
            </Link>
            .
          </p>
        </section>

        {/* Supporting stats — one divided band */}
        <div className="grid grid-cols-2 divide-y divide-border/60 border-y border-border/50 lg:grid-cols-4 lg:divide-x lg:divide-y-0 light:divide-border light:border-border">
          <StatTile
            iconNode={<StreakFlame days={stats.currentStreak} size="sm" />}
            label="Current streak"
            value={stats.currentStreak}
            suffix=" d"
            hint="Consecutive active days"
          />
          <StatTile
            iconNode={<StreakFlame days={stats.longestStreak} size="sm" animated={false} />}
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

        <RankLadder level={progression.level} />

        <section className="border-t border-border/50 pt-5 light:border-border">
          <h2 className="mb-3 text-[13px] font-semibold text-foreground">How XP is earned</h2>
          <ul className="space-y-2.5 text-[13px] text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                <Star
                  className="h-3.5 w-3.5 fill-warning/25 text-warning"
                  aria-hidden
                />
              </span>
              XP earned per completed objective and focused Pomodoro interval
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                <Flame
                  className="h-3.5 w-3.5 fill-warning/25 text-warning"
                  aria-hidden
                />
              </span>
              Daily and weekly streaks tracked automatically from real sessions
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                <Trophy
                  className="h-3.5 w-3.5 fill-warning/20 text-warning"
                  aria-hidden
                />
              </span>
              Ranks and dashboard backgrounds unlocked as your level climbs
            </li>
          </ul>
          <Link
            href="/settings"
            className="mt-4 inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage backgrounds in Settings <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </motion.div>
    </AppPage>
  );
}
