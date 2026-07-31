"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
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

/** Matches Dashboard `statCellBorderClass` — 2×2 on mobile, single row at `md`. */
function statCellBorderClass(index: number) {
  return cn(
    index % 2 === 1 && "border-l border-border/60 light:border-border",
    index >= 2 && "border-t border-border/60 light:border-border",
    "md:border-t-0",
    index > 0 && "md:border-l md:border-border/60 light:md:border-border"
  );
}

/** Matches Dashboard `StatCell` so Rank’s strip reads the same. */
function StatCell({
  icon: Icon,
  iconNode,
  label,
  value,
  suffix,
  hint,
  iconClassName,
  className,
}: {
  icon?: LucideIcon;
  iconNode?: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between p-3.5 sm:p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-muted">{label}</p>
        {iconNode ??
          (Icon ? (
            <Icon className={cn("h-3.5 w-3.5", iconClassName ?? "text-muted")} />
          ) : null)}
      </div>
      <div className="mt-3">
        <p className="font-mono text-3xl font-medium tabular-nums tracking-tight text-foreground sm:text-4xl">
          <AnimatedCounter value={value} suffix={suffix} />
        </p>
        <p className="mt-1 text-[14px] text-muted-foreground">{hint}</p>
      </div>
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
          const metal = rankTrophyClass(rankIndex + 1);
          return (
            <div
              key={name}
              className={cn(
                "flex flex-col gap-2 rounded-md px-3 py-2.5 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between",
                isCurrentRank ? "bg-wash-strong" : "hover:bg-wash"
              )}
            >
              <div className="flex items-center gap-3">
                <Trophy
                  className={cn(
                    "h-5 w-5 shrink-0 fill-current transition-opacity duration-200",
                    metal,
                    isCurrentRank
                      ? "opacity-100"
                      : isPastRank
                        ? "opacity-80"
                        : "opacity-35"
                  )}
                  aria-hidden
                />
                <p
                  className={cn(
                    "text-[15px] font-medium",
                    level > baseLevel ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 pl-8 sm:pl-0">
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
                        "flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 font-mono text-[12px] font-semibold tabular-nums transition-colors duration-200",
                        state === "done" && cn("bg-wash opacity-70", metal),
                        state === "current" &&
                          cn("bg-wash-strong ring-1 ring-inset ring-border", metal),
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
  const [xpOpen, setXpOpen] = React.useState(false);
  const trophyMetal = rankTrophyClass(rank.rankIndex);

  if (!hydrated) {
    return (
      <AppPage title="Rank" feature="rank">
        <div className="space-y-5">
          <Skeleton className="h-32 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-64 rounded-md" />
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage title="Rank & Progress" feature="rank">
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
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-wash",
                  trophyMetal
                )}
              >
                <Trophy className="h-4 w-4 fill-current" aria-hidden />
              </span>
              <div>
                <p className="text-[14px] font-medium text-muted">Current rank</p>
                <p className="mt-0.5 text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
                  {rank.label}
                </p>
                <p className="mt-1 font-mono text-[14px] tabular-nums text-muted-foreground">
                  Level {progression.level} / {MAX_LEVEL}
                  {todayXp > 0 && (
                    <span className="ml-2 text-foreground">· +{todayXp} XP today</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[14px] text-muted-foreground">
              <span>{progression.isMaxLevel ? "Max level reached" : "XP to next level"}</span>
              {!progression.isMaxLevel && (
                <span className="font-mono tabular-nums text-foreground">
                  {progression.xpIntoLevel.toLocaleString()} /{" "}
                  {progression.xpForNextLevel?.toLocaleString()}
                </span>
              )}
            </div>
            <ProgressBar value={progression.progressPercent} size="sm" />
          </div>

          <p className="mt-3 text-[14px] text-muted-foreground">
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

        {/* Stats strip — same chrome as Dashboard */}
        <div className="grid grid-cols-2 border-y border-border/50 md:grid-cols-4 light:border-border">
          {[
            {
              label: "Current streak",
              value: stats.currentStreak,
              suffix: stats.currentStreak === 1 ? " day" : " days",
              hint: "Consecutive active days",
              iconNode: <StreakFlame days={stats.currentStreak} size="sm" />,
            },
            {
              label: "Longest streak",
              value: stats.longestStreak,
              suffix: stats.longestStreak === 1 ? " day" : " days",
              hint: "Personal best",
              iconNode: (
                <StreakFlame days={stats.longestStreak} size="sm" animated={false} />
              ),
            },
            {
              icon: Repeat,
              label: "Intervals",
              value: stats.intervalsCompleted,
              hint: "All-time completed",
              iconClassName: "text-muted",
            },
            {
              icon: Gauge,
              label: "Productivity",
              value: stats.productivityIndex,
              suffix: "%",
              hint: "Last 7 days",
              iconClassName: "text-muted",
            },
          ].map((cell, index) => (
            <StatCell key={cell.label} {...cell} className={statCellBorderClass(index)} />
          ))}
        </div>

        <RankLadder level={progression.level} />

        <section className="border-t border-border/50 pt-5 light:border-border">
          <button
            type="button"
            aria-expanded={xpOpen}
            onClick={() => setXpOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left transition-colors hover:text-foreground"
          >
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  xpOpen && "rotate-90"
                )}
              />
              How XP is earned
            </span>
          </button>

          {xpOpen && (
            <div className="mt-4">
              <ul className="space-y-2.5 text-[14px] text-muted-foreground">
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
                      className={cn("h-3.5 w-3.5 fill-current", trophyMetal)}
                      aria-hidden
                    />
                  </span>
                  Ranks and dashboard backgrounds unlocked as your level climbs
                </li>
              </ul>
              <Link
                href="/settings"
                className="mt-4 inline-flex items-center gap-1 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Manage backgrounds in Settings <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </section>
      </motion.div>
    </AppPage>
  );
}
