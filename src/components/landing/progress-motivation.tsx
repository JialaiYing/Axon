"use client";

import { History, Target, Trophy } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StreakFlame } from "@/components/ui/streak-flame";
import {
  LandingContainer,
  LandingHeader,
  LandingSection,
  ProductChrome,
} from "@/components/landing/landing-primitives";

/**
 * Progress beat — motivation from finished work.
 * Single product frame; no icon-row filler.
 */
export function ProgressMotivation() {
  return (
    <LandingSection id="progress" className="bg-background">
      <LandingContainer>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <ScrollReveal>
            <LandingHeader
              eyebrow="Progress"
              title="Motivation from finished work."
              description="Streaks, goals, and rank update when you complete sessions and objectives. The numbers mean something because they come from what you actually did."
            />
            <ScrollRevealGroup className="mt-8 space-y-0 divide-y divide-border/50 border-y border-border/50">
              <ScrollRevealItem>
                <div className="flex items-start gap-3 py-3.5">
                  <StreakFlame days={12} size="sm" animated={false} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Daily streaks</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Tracked from real focus days, not check-ins.
                    </p>
                  </div>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem>
                <div className="flex items-start gap-3 py-3.5">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-foreground">Personal goals</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Tied to objectives and review, not vanity targets.
                    </p>
                  </div>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem>
                <div className="flex items-start gap-3 py-3.5">
                  <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-foreground">Rank and XP</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Earned from finished work — nothing else.
                    </p>
                  </div>
                </div>
              </ScrollRevealItem>
            </ScrollRevealGroup>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <ProductChrome title="Progress" bodyClassName="p-0">
              <div className="grid grid-cols-1 divide-y divide-border/60 md:grid-cols-3 md:divide-x md:divide-y-0">
                <section className="p-4 sm:p-5">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                    Personal goals
                  </p>
                  <div className="space-y-3.5">
                    <div>
                      <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
                        <span>Finish problem sets</span>
                        <span className="font-mono tabular-nums">3/5</span>
                      </div>
                      <ProgressBar value={60} size="sm" />
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
                        <span>Review decks</span>
                        <span className="font-mono tabular-nums">1/2</span>
                      </div>
                      <ProgressBar value={50} size="sm" />
                    </div>
                  </div>
                </section>

                <section className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                      Rank
                    </p>
                    <Trophy className="h-3.5 w-3.5 text-warning" aria-hidden />
                  </div>
                  <p className="text-[15px] font-semibold tracking-tight text-foreground">
                    Scholar II
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">+42 XP today</p>
                  <div className="mt-4 border-t border-border/50 pt-3.5">
                    <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
                      <span>XP to next level</span>
                      <span className="font-mono tabular-nums text-foreground/70">640 / 940</span>
                    </div>
                    <ProgressBar value={68} size="sm" />
                  </div>
                </section>

                <section className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                      Recent
                    </p>
                    <History className="h-3.5 w-3.5 text-muted" aria-hidden />
                  </div>
                  <ul className="divide-y divide-border/50 border-y border-border/50">
                    <li className="flex items-center gap-2 py-2.5">
                      <StreakFlame days={12} size="sm" animated={false} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          12-day streak
                        </p>
                        <p className="text-[11px] text-muted-foreground">On track</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-2 py-2.5">
                      <Target className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        Lab report done
                      </p>
                      <span className="font-mono text-[11px] text-muted-foreground">5h</span>
                    </li>
                  </ul>
                </section>
              </div>
            </ProductChrome>
          </ScrollReveal>
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
