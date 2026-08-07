"use client";

import { Lock } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import {
  HairlineGrid,
  LandingContainer,
  LandingHeader,
  LandingSection,
} from "@/components/landing/landing-primitives";
import { colorForSubject } from "@/lib/subject-colors";
import { PALETTES, STARTER_PALETTE_IDS } from "@/lib/palettes/catalog";
import { cn } from "@/lib/utils";

/** Illustrative — last value matches the "Focus today" stat shown in the hero preview. */
const FOCUS_MINUTES_14D = [35, 50, 20, 65, 42, 58, 72, 45, 68, 80, 55, 70, 62, 96];
const MAX_FOCUS_MINUTES = Math.max(...FOCUS_MINUTES_14D);

const SUBJECT_MASTERY = [
  { subject: "Calculus", value: 82 },
  { subject: "Chemistry", value: 64 },
  { subject: "Physics", value: 58 },
  { subject: "Biology", value: 45 },
];

const STATS = [
  { label: "Objectives completed", value: "24", hint: "This week" },
  { label: "Focus sessions", value: "31", hint: "This week" },
  { label: "Current streak", value: "12", hint: "Days" },
  { label: "Rank", value: "Scholar II", hint: "Level 8" },
];

/**
 * Progress beat — motivation from finished work.
 * Left: fixed stat grid. Right: focus histogram + subject mastery + a quiet
 * palette teaser (unlock ≠ auto-equip, still true here).
 */
export function ProgressMotivation() {
  return (
    <LandingSection id="progress" className="bg-background">
      <LandingContainer>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <ScrollReveal>
              <LandingHeader
                eyebrow="Progress"
                title="Motivation from finished work."
                description="Streaks, a fixed daily clear, and rank update when you complete real sessions and objectives — not check-ins."
              />
            </ScrollReveal>

            <ScrollRevealGroup className="mt-8">
              <HairlineGrid cols={2}>
                {STATS.map((stat) => (
                  <ScrollRevealItem key={stat.label} className="bg-background p-4 sm:p-5">
                    <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 font-mono text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.hint}</p>
                  </ScrollRevealItem>
                ))}
              </HairlineGrid>
            </ScrollRevealGroup>
          </div>

          <ScrollReveal delay={0.06}>
            <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
              {/* Focus time histogram */}
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Focus time</p>
                  <p className="mt-0.5 text-[15px] font-medium tracking-tight text-foreground">
                    Last 14 days
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                  +18%
                </span>
              </div>

              <div className="mt-5 flex h-24 items-end gap-1.5">
                {FOCUS_MINUTES_14D.map((minutes, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-[2px]",
                      i === FOCUS_MINUTES_14D.length - 1 ? "bg-accent" : "bg-white/[0.1]"
                    )}
                    style={{ height: `${Math.max(6, (minutes / MAX_FOCUS_MINUTES) * 100)}%` }}
                  />
                ))}
              </div>

              {/* Subject mastery */}
              <div className="mt-6 border-t border-border/60 pt-5">
                <p className="text-[11px] font-medium text-muted-foreground">By subject</p>
                <div className="mt-3 space-y-2.5">
                  {SUBJECT_MASTERY.map((row) => (
                    <div key={row.subject} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 truncate text-[12px] text-muted-foreground sm:w-24">
                        {row.subject}
                      </span>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-pill bg-wash">
                        <div
                          className="h-full rounded-pill"
                          style={{
                            width: `${row.value}%`,
                            backgroundColor: colorForSubject(row.subject),
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                        {row.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Palette teaser */}
              <div className="mt-6 border-t border-border/60 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Palettes</p>
                  <div className="flex items-center gap-2">
                    {PALETTES.map((palette) => {
                      const unlocked = STARTER_PALETTE_IDS.includes(palette.id);
                      return (
                        <span
                          key={palette.id}
                          title={
                            unlocked
                              ? palette.name
                              : `${palette.name} · unlocks at level ${palette.unlockLevel}`
                          }
                          className={cn(
                            "relative flex h-5 w-5 items-center justify-center rounded-full border",
                            unlocked ? "border-border-strong" : "border-border/60 opacity-50"
                          )}
                          style={{ backgroundColor: palette.preview.background }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: palette.preview.accent }}
                          />
                          {!unlocked && (
                            <Lock
                              className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-surface text-muted-foreground"
                              aria-hidden
                            />
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  Quiet dark palettes unlock by level — you equip them in Settings; unlock never
                  auto-applies.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
