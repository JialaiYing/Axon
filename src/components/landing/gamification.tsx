import { Flame, Trophy, Star, Sparkles, Target } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

/**
 * Landing “Progress you can actually see” — right column mirrors the real
 * dashboard RankHero + personal-goals pair (same chrome as the hero preview).
 * Scoped to dark tokens so light-mode visitors still see a readable product shot
 * on the black marketing canvas.
 */
export function Gamification() {
  return (
    <section className="border-t border-white/[0.06] bg-black px-6 py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <ScrollReveal className="text-left">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Progress you can actually see
          </h2>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
            Progress
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base">
            XP, ranks, and streaks aren&apos;t decoration — they&apos;re a direct readout of
            finished objectives, completed intervals, and reviewed flashcards.
          </p>
          <ul className="mt-7 space-y-3.5 text-sm text-white/60">
            <li className="flex items-center gap-2.5">
              <Star className="h-4 w-4 shrink-0 text-white/80" aria-hidden />
              XP earned per completed objective and session
            </li>
            <li className="flex items-center gap-2.5">
              <Flame className="h-4 w-4 shrink-0 text-white/80" aria-hidden />
              Daily and weekly streaks tracked automatically
            </li>
            <li className="flex items-center gap-2.5">
              <Trophy className="h-4 w-4 shrink-0 text-white/80" aria-hidden />
              Ranks and milestones unlocked from real activity
            </li>
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div data-theme="dark" className="space-y-3">
            {/* RankHero — matches dashboard-overview RankHero */}
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-elevation-2)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                  <Trophy className="h-8 w-8 shrink-0 text-foreground/70" aria-hidden />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/60">
                      Current rank
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
                      Scholar II
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-background px-2.5 py-1">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    +42 XP today
                  </span>
                  <span className="h-3 w-px bg-border" aria-hidden />
                  <span className="text-xs font-medium text-muted-foreground">Level 8 / 30</span>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs text-foreground/55">
                  <span>XP to next level</span>
                  <span className="tabular-nums text-foreground/70">640 / 940</span>
                </div>
                <ProgressBar value={68} />
              </div>
            </div>

            {/* Personal goals mini + streak strip — same language as dashboard */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-elevation-2)]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/55">
                    Personal goals
                  </p>
                  <Target className="h-3.5 w-3.5 text-success" aria-hidden />
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-[10px] text-foreground/55">
                      <span>Finish problem sets</span>
                      <span className="tabular-nums text-foreground/70">3/5</span>
                    </div>
                    <ProgressBar value={60} size="sm" />
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-[10px] text-foreground/55">
                      <span>Review decks</span>
                      <span className="tabular-nums text-foreground/70">1/2</span>
                    </div>
                    <ProgressBar value={50} size="sm" />
                  </div>
                </div>
              </div>

              <ScrollRevealGroup className="grid grid-cols-3 gap-2 sm:grid-cols-1" stagger={0.08}>
                <ScrollRevealItem>
                  <div className="rounded-[var(--radius-lg)] border border-border bg-card p-3 text-center shadow-[var(--shadow-elevation-1)] sm:flex sm:items-center sm:gap-2.5 sm:text-left">
                    <Flame className="mx-auto h-4 w-4 text-warning sm:mx-0" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        <AnimatedCounter value={12} />
                      </p>
                      <p className="text-[10px] text-muted-foreground">day streak</p>
                    </div>
                  </div>
                </ScrollRevealItem>
                <ScrollRevealItem>
                  <div className="rounded-[var(--radius-lg)] border border-border bg-card p-3 text-center shadow-[var(--shadow-elevation-1)] sm:flex sm:items-center sm:gap-2.5 sm:text-left">
                    <Trophy className="mx-auto h-4 w-4 text-foreground/70 sm:mx-0" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        <AnimatedCounter value={9} />
                      </p>
                      <p className="text-[10px] text-muted-foreground">milestones</p>
                    </div>
                  </div>
                </ScrollRevealItem>
                <ScrollRevealItem>
                  <div className="rounded-[var(--radius-lg)] border border-border bg-card p-3 text-center shadow-[var(--shadow-elevation-1)] sm:flex sm:items-center sm:gap-2.5 sm:text-left">
                    <Star className="mx-auto h-4 w-4 text-foreground/70 sm:mx-0" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        <AnimatedCounter value={340} />
                      </p>
                      <p className="text-[10px] text-muted-foreground">objectives</p>
                    </div>
                  </div>
                </ScrollRevealItem>
              </ScrollRevealGroup>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
