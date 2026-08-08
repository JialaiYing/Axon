"use client";

import * as React from "react";
import { Repeat, Target, Trophy } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StreakFlame } from "@/components/ui/streak-flame";
import {
  LandingContainer,
  LandingHeader,
  LandingSection,
  landingFocusRingClassName,
  landingPreviewHaloStyle,
} from "@/components/landing/landing-primitives";
import {
  LEVELS_PER_RANK,
  RANK_NAMES,
  rankTrophyClass,
} from "@/lib/progress/ranks";
import { PALETTES, type PaletteId } from "@/lib/palettes/catalog";
import { cn } from "@/lib/utils";

/** Landing Rank mock defaults to Axon Dark. */
const PREVIEW_DEFAULT_PALETTE: PaletteId = "axon";

/** Demo snapshot — matches DashboardPreview / hero rank strip. */
const DEMO = {
  rankLabel: "Scholar II",
  rankIndex: 3, // Scholar
  level: 8,
  maxLevel: 30,
  todayXp: 42,
  xpInto: 640,
  xpNext: 940,
  xpPercent: 68,
  lifetimeXp: 4820,
  currentStreak: 12,
  longestStreak: 18,
  intervals: 147,
} as const;

/** Level-gated only — never `isPaletteUnlocked` (that reads localStorage via
 *  `isDevUnlockAll` and mismatches SSR). */
function isDemoUnlocked(unlockLevel: number): boolean {
  return DEMO.level >= unlockLevel;
}

const TIER_LABELS = ["I", "II", "III"] as const;

const BULLETS = [
  {
    icon: <StreakFlame days={DEMO.currentStreak} size="sm" animated={false} className="mt-0.5 shrink-0" />,
    title: "Daily streaks",
    description: "Tracked from real focus days, not empty check-ins.",
  },
  {
    icon: <Target className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />,
    title: "Daily clear · 3 objectives",
    description: "A fixed study target that updates when you finish work on the board.",
  },
  {
    icon: <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-warning/55" aria-hidden />,
    title: "Rank and XP",
    description:
      "Earned from finished work. Quiet dark palettes unlock by level — you equip them in Settings; unlock never auto-applies.",
  },
];

/**
 * Interactive Rank page mock — mirrors `/rank`. Palette chips recolor this
 * frame only (local data-palette); they do not change the marketing page
 * or the visitor's saved preference.
 */
function RankPreview() {
  const [previewPalette, setPreviewPalette] =
    React.useState<PaletteId>(PREVIEW_DEFAULT_PALETTE);
  const trophyMetal = rankTrophyClass(DEMO.rankIndex);

  return (
    <div className="relative rounded-md" style={landingPreviewHaloStyle}>
      <div
        data-theme="dark"
        data-palette={previewPalette}
        className="overflow-hidden rounded-md border border-border/50 bg-background shadow-none transition-colors duration-300"
      >
      {/* Hero strip — matches RankOverview */}
      <section className="border-b border-border/50 px-4 py-5 sm:px-5">
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
            <p className="text-[13px] font-medium text-muted">Current rank</p>
            <p className="mt-0.5 text-xl font-medium tracking-tight text-foreground sm:text-2xl">
              {DEMO.rankLabel}
            </p>
            <p className="mt-1 font-mono text-[13px] tabular-nums text-muted-foreground">
              Level {DEMO.level} / {DEMO.maxLevel}
              <span className="ml-2 text-foreground">· +{DEMO.todayXp} XP today</span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[13px] text-muted-foreground">
            <span>XP to next level</span>
            <span className="font-mono tabular-nums text-foreground">
              {DEMO.xpInto.toLocaleString()} / {DEMO.xpNext.toLocaleString()}
            </span>
          </div>
          <ProgressBar value={DEMO.xpPercent} size="sm" />
        </div>

        <p className="mt-3 text-[13px] text-muted-foreground">
          {DEMO.lifetimeXp.toLocaleString()} lifetime XP · click a palette to preview it here.
        </p>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Preview a dark palette"
        >
          {PALETTES.map((palette) => {
            const unlocked = isDemoUnlocked(palette.unlockLevel);
            const selected = palette.id === previewPalette;
            return (
              <button
                key={palette.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPreviewPalette(palette.id)}
                title={
                  unlocked
                    ? selected
                      ? `${palette.name} · previewing`
                      : `Preview ${palette.name}`
                    : `${palette.name} · unlocks at level ${palette.unlockLevel} · click to preview`
                }
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors",
                  landingFocusRingClassName,
                  selected
                    ? "border-foreground/40 bg-wash"
                    : "border-border/50 hover:border-border-strong hover:bg-wash/60",
                  !unlocked && !selected && "opacity-55"
                )}
              >
                <span
                  className="flex h-4 w-6 shrink-0 overflow-hidden rounded-sm border border-border/50"
                  aria-hidden
                >
                  <span
                    className="h-full w-2/3"
                    style={{ backgroundColor: palette.preview.background }}
                  />
                  <span
                    className="h-full w-1/3"
                    style={{ backgroundColor: palette.preview.accent }}
                  />
                </span>
                <span className="text-[12px] text-foreground">{palette.name}</span>
                {selected ? (
                  <span className="text-[11px] text-muted-foreground">Active</span>
                ) : !unlocked ? (
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    L{palette.unlockLevel}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* Stats strip */}
      <div className="grid grid-cols-3 border-b border-border/50">
        {[
          {
            label: "Current streak",
            value: `${DEMO.currentStreak}`,
            suffix: " days",
            hint: "Consecutive active days",
            icon: <StreakFlame days={DEMO.currentStreak} size="sm" animated={false} />,
          },
          {
            label: "Longest streak",
            value: `${DEMO.longestStreak}`,
            suffix: " days",
            hint: "Personal best",
            icon: <StreakFlame days={DEMO.longestStreak} size="sm" animated={false} />,
          },
          {
            label: "Intervals",
            value: `${DEMO.intervals}`,
            suffix: "",
            hint: "All-time completed",
            icon: <Repeat className="h-3.5 w-3.5 text-muted" aria-hidden />,
          },
        ].map((cell, index) => (
          <div
            key={cell.label}
            className={cn(
              "flex flex-col justify-between p-3 sm:p-3.5",
              index > 0 && "border-l border-border/60"
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-[12px] font-medium text-muted sm:text-[13px]">{cell.label}</p>
              {cell.icon}
            </div>
            <div className="mt-2">
              <p className="font-mono text-xl font-medium tabular-nums tracking-tight text-foreground sm:text-2xl">
                {cell.value}
                <span className="text-sm font-medium text-muted-foreground">{cell.suffix}</span>
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{cell.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rank ladder — first 5 ranks keep the mock compact */}
      <section className="space-y-3 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-[13px] font-semibold text-foreground">Rank ladder</h3>
          <p className="text-[12px] text-muted-foreground">10 ranks · 3 tiers each · 30 levels</p>
        </div>
        <div className="space-y-1">
          {RANK_NAMES.slice(0, 5).map((name, rankIndex) => {
            const baseLevel = rankIndex * LEVELS_PER_RANK;
            const isCurrentRank =
              DEMO.level > baseLevel && DEMO.level <= baseLevel + LEVELS_PER_RANK;
            const isPastRank = DEMO.level > baseLevel + LEVELS_PER_RANK;
            const metal = rankTrophyClass(rankIndex + 1);
            return (
              <div
                key={name}
                className={cn(
                  "flex flex-col gap-2 rounded-md px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
                  isCurrentRank && "bg-wash-strong"
                )}
              >
                <div className="flex items-center gap-3">
                  <Trophy
                    className={cn(
                      "h-4 w-4 shrink-0 fill-current",
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
                      "text-[14px] font-medium",
                      DEMO.level > baseLevel ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 pl-7 sm:pl-0">
                  {TIER_LABELS.map((tierLabel, tierIdx) => {
                    const tierLevel = baseLevel + tierIdx + 1;
                    const state =
                      tierLevel < DEMO.level
                        ? "done"
                        : tierLevel === DEMO.level
                          ? "current"
                          : "locked";
                    return (
                      <span
                        key={tierLabel}
                        className={cn(
                          "flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 font-mono text-[12px] font-semibold tabular-nums",
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
      </div>
    </div>
  );
}

/**
 * Progress beat — motivation from finished work.
 * Left: honest copy. Right: Rank page mock (real chrome, illustrative data).
 */
export function ProgressMotivation() {
  return (
    <LandingSection id="progress" className="bg-background">
      <LandingContainer>
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <ScrollReveal>
            <LandingHeader
              eyebrow="Progress"
              title="Motivation from finished work."
              description="Streaks, a fixed daily clear, and rank update when you complete real sessions and objectives — not check-ins."
            />
            <ScrollRevealGroup className="mt-8 space-y-0 divide-y divide-border/50 border-y border-border/50">
              {BULLETS.map((bullet) => (
                <ScrollRevealItem key={bullet.title}>
                  <div className="flex items-start gap-3 py-3.5">
                    {bullet.icon}
                    <div>
                      <p className="text-sm font-medium text-foreground">{bullet.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{bullet.description}</p>
                    </div>
                  </div>
                </ScrollRevealItem>
              ))}
            </ScrollRevealGroup>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <RankPreview />
          </ScrollReveal>
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
