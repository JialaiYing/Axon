import { Flame, Trophy, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

export function Gamification() {
  return (
    <section className="bg-black px-6 py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <ScrollReveal className="text-left">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Progress you can actually see
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55 md:text-base">
            XP, ranks, and streaks aren&apos;t decoration — they&apos;re a direct readout of
            finished objectives, completed intervals, and reviewed flashcards.
          </p>
          <ul className="mt-7 space-y-3.5 text-sm text-white/55">
            <li className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-white" /> XP earned per completed objective and session
            </li>
            <li className="flex items-center gap-2.5">
              <Flame className="h-4 w-4 text-white" /> Daily and weekly streaks tracked automatically
            </li>
            <li className="flex items-center gap-2.5">
              <Trophy className="h-4 w-4 text-white" /> Ranks and milestones unlocked from real activity
            </li>
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="rounded-xl border border-white/10 bg-white/[0.03] p-7 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/45">Current rank</p>
                <p className="text-lg font-semibold text-white">Scholar II</p>
              </div>
              <Badge className="border-white/20 bg-white/10 text-white">Level 8</Badge>
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-white/45">
                <span>XP to next level</span>
                <span className="text-white/70">640 / 940</span>
              </div>
              <ProgressBar value={68} barClassName="bg-white bg-none shadow-none" />
            </div>

            <ScrollRevealGroup className="mt-6 grid grid-cols-3 gap-3" stagger={0.1}>
              <ScrollRevealItem>
                <div className="rounded-md border border-white/10 bg-black/40 p-3 text-center">
                  <Flame className="mx-auto h-4 w-4 text-white" />
                  <p className="mt-1.5 text-sm font-semibold text-white">
                    <AnimatedCounter value={12} />
                  </p>
                  <p className="text-[11px] text-white/45">day streak</p>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem>
                <div className="rounded-md border border-white/10 bg-black/40 p-3 text-center">
                  <Trophy className="mx-auto h-4 w-4 text-white" />
                  <p className="mt-1.5 text-sm font-semibold text-white">
                    <AnimatedCounter value={9} />
                  </p>
                  <p className="text-[11px] text-white/45">milestones</p>
                </div>
              </ScrollRevealItem>
              <ScrollRevealItem>
                <div className="rounded-md border border-white/10 bg-black/40 p-3 text-center">
                  <Star className="mx-auto h-4 w-4 text-white" />
                  <p className="mt-1.5 text-sm font-semibold text-white">
                    <AnimatedCounter value={340} />
                  </p>
                  <p className="text-[11px] text-white/45">objectives</p>
                </div>
              </ScrollRevealItem>
            </ScrollRevealGroup>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
}
