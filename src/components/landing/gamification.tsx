import { Flame, Trophy, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import ScrollFloat from "@/components/effects/scroll-float";
import BlurText from "@/components/effects/blur-text";

export function Gamification() {
  return (
    <section className="px-6 py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <ScrollReveal>
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            textClassName="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Progress you can actually see
          </ScrollFloat>
          <BlurText
            text="XP, ranks, and streaks aren't decoration — they're a direct readout of finished objectives, completed intervals, and reviewed flashcards."
            delay={40}
            animateBy="words"
            direction="bottom"
            as="p"
            className="mt-4 text-sm leading-relaxed text-muted md:text-base"
          />
          <ul className="mt-7 space-y-3.5 text-sm text-muted">
            <li className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-accent" /> XP earned per completed objective and session
            </li>
            <li className="flex items-center gap-2.5">
              <Flame className="h-4 w-4 text-warning" /> Daily and weekly streaks tracked automatically
            </li>
            <li className="flex items-center gap-2.5">
              <Trophy className="h-4 w-4 text-secondary" /> Ranks and milestones unlocked from real activity
            </li>
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="glass rounded-xl p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current rank</p>
                <p className="text-lg font-semibold text-foreground">Scholar II</p>
              </div>
              <Badge variant="accent">Level 8</Badge>
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                <span>XP to next level</span>
                <span>640 / 940</span>
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