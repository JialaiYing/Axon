import { Flame, Trophy, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

export function Gamification() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Progress you can actually see
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
            XP, ranks, and streaks aren&apos;t decoration — they&apos;re a
            direct readout of finished objectives, completed intervals, and
            reviewed flashcards. No made-up multipliers, no gambling
            mechanics, just a visible trail of what you got done.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> XP earned per completed objective and session
            </li>
            <li className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-warning" /> Daily and weekly streaks tracked automatically
            </li>
            <li className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-secondary" /> Ranks and milestones unlocked from real activity
            </li>
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current rank</p>
                <p className="text-lg font-semibold text-foreground">Scholar II</p>
              </div>
              <Badge variant="accent">Level 7</Badge>
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                <span>XP to next level</span>
                <span>1,240 / 1,800</span>
              </div>
              <ProgressBar value={68} />
            </div>

            <ScrollRevealGroup className="mt-6 grid grid-cols-3 gap-3" stagger={0.1}>
              <ScrollRevealItem>
                <div className="rounded-md border border-border bg-card p-3 text-center">
                  <Flame className="mx-auto h-4 w-4 text-warning" />
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    <AnimatedCounter value={12} />
                  </p>
                  <p className="text-[11px] text-muted-foreground">day streak</p>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem>
                <div className="rounded-md border border-border bg-card p-3 text-center">
                  <Trophy className="mx-auto h-4 w-4 text-secondary" />
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    <AnimatedCounter value={9} />
                  </p>
                  <p className="text-[11px] text-muted-foreground">milestones</p>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem>
                <div className="rounded-md border border-border bg-card p-3 text-center">
                  <Star className="mx-auto h-4 w-4 text-accent" />
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    <AnimatedCounter value={340} />
                  </p>
                  <p className="text-[11px] text-muted-foreground">objectives</p>
                </div>
              </ScrollRevealItem>
            </ScrollRevealGroup>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
}