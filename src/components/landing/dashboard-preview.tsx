"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Tilt from "react-parallax-tilt";
import CountUp from "react-countup";
import {
  Circle,
  Flame,
  Gauge,
  ListTodo,
  Repeat,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";

/** Mirrors the real dashboard: greeting → agenda → up next → stats strip → goals + rank. */

const AGENDA_ROWS = [
  { title: "Focus session — Calc II", meta: "9:30 – 10:00", tone: "default" as const },
  { title: "Lab report due", meta: "Due today", tone: "default" as const },
  { title: "Org chem problem set", meta: "Overdue", tone: "danger" as const },
];

const UP_NEXT = [
  { title: "Read ch. 6 — thermodynamics", priority: "medium" },
  { title: "Review flashcard deck", priority: "low" },
  { title: "Office hours prep", priority: "high" },
];

const STATS = [
  { label: "Streak", value: 12, suffix: " days", icon: Flame, iconClass: "text-warning" },
  { label: "Focus today", value: 96, suffix: " min", icon: Timer, iconClass: "text-accent" },
  { label: "Intervals", value: 34, suffix: "", icon: Repeat, iconClass: "text-foreground/60" },
  { label: "Productivity", value: 82, suffix: "%", icon: Gauge, iconClass: "text-foreground/60" },
];

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-success",
};

const PRIORITY_TEXT: Record<string, string> = {
  high: "text-danger",
  medium: "text-warning",
  low: "text-success",
};

function PreviewChrome({
  prefersReducedMotion,
  tiltMax = 4,
}: {
  prefersReducedMotion: boolean | null;
  tiltMax?: number;
}) {
  return (
    <Tilt
      tiltEnable={!prefersReducedMotion}
      tiltMaxAngleX={tiltMax}
      tiltMaxAngleY={tiltMax}
      perspective={1200}
      transitionSpeed={1200}
      glareEnable={false}
      className="will-change-transform"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-elevation-3)]">
        {/* Fake app chrome — traffic lights only, no extra plate */}
        <div className="flex items-center gap-1.5 border-b border-border bg-surface px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>

        <div className="space-y-4 bg-background p-4 sm:p-5">
          {/* Greeting */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/60">
                Tuesday, July 21
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Good morning, Alex
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/70">
                New objective
              </span>
              <span className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                Start focus
              </span>
            </div>
          </div>

          {/* Today agenda — matches TodayAgendaPanel */}
          <ScrollRevealGroup
            className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elevation-2)]"
            stagger={0.06}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Today
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">Your agenda</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                  <Flame className="h-3.5 w-3.5 text-warning" />
                  12-day streak
                </span>
                <span className="h-3 w-px bg-border" aria-hidden />
                <span className="text-[11px] font-medium text-muted-foreground">Scholar II</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-1.5">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-foreground/55">
                  <ListTodo className="h-3 w-3" /> Due &amp; scheduled
                </p>
                {AGENDA_ROWS.map((row) => (
                  <ScrollRevealItem key={row.title}>
                    <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-card-hover">
                      <p
                        className={cn(
                          "min-w-0 truncate text-xs font-medium",
                          row.tone === "danger" ? "text-danger" : "text-foreground"
                        )}
                      >
                        {row.title}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 text-[10px]",
                          row.tone === "danger" ? "text-danger/80" : "text-muted-foreground"
                        )}
                      >
                        {row.meta}
                      </span>
                    </div>
                  </ScrollRevealItem>
                ))}
              </div>

              <div className="space-y-2.5 rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-foreground/55">
                  <Target className="h-3 w-3 text-success" /> Goals
                </p>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>Focus time</span>
                    <span className="tabular-nums text-foreground/70">96/120 min</span>
                  </div>
                  <ProgressBar value={80} size="sm" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>Objectives</span>
                    <span className="tabular-nums text-foreground/70">2/5</span>
                  </div>
                  <ProgressBar value={40} size="sm" />
                </div>
              </div>
            </div>
          </ScrollRevealGroup>

          {/* Up next — flat list like the real dashboard */}
          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-foreground/60">Up next</p>
            <ul className="overflow-hidden rounded-xl border border-border bg-card">
              {UP_NEXT.map((item, index) => (
                <li
                  key={item.title}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5",
                    index > 0 && "border-t border-border"
                  )}
                >
                  <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {item.title}
                  </p>
                  <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium capitalize">
                    <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[item.priority])} />
                    <span className={PRIORITY_TEXT[item.priority]}>{item.priority}</span>
                  </span>
                  <Circle className="h-3.5 w-3.5 shrink-0 text-foreground/40" />
                </li>
              ))}
            </ul>
          </div>

          {/* Stats strip — one panel, internal dividers */}
          <ScrollRevealGroup
            className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card md:grid-cols-4"
            stagger={0.08}
          >
            {STATS.map((stat, index) => (
              <ScrollRevealItem key={stat.label}>
                <div
                  className={cn(
                    "flex flex-col justify-between p-3.5",
                    index % 2 === 1 && "border-l border-border",
                    index >= 2 && "border-t border-border md:border-t-0",
                    index === 2 && "md:border-l"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/60">
                      {stat.label}
                    </p>
                    <stat.icon className={cn("h-3.5 w-3.5", stat.iconClass)} />
                  </div>
                  <p className="mt-3 text-lg font-semibold tabular-nums text-foreground">
                    <CountUp end={stat.value} duration={1.4} suffix={stat.suffix} />
                  </p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>

          {/* Personal goals + Rank — mirrors dashboard pair */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elevation-2)]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/55">
                  Personal goals
                </p>
                <Target className="h-3.5 w-3.5 text-success" />
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

            <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elevation-2)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-6 w-6 shrink-0 text-foreground/70" />
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/60">
                      Current rank
                    </p>
                    <p className="text-sm font-semibold text-foreground">Scholar II</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1">
                  <span className="flex items-center gap-1 text-[10px] font-medium text-accent">
                    <Sparkles className="h-3 w-3" /> +42 XP
                  </span>
                  <span className="h-3 w-px bg-border" aria-hidden />
                  <span className="text-[10px] font-medium text-muted-foreground">Lvl 8</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[10px] text-foreground/55">
                  <span>XP to next level</span>
                  <span className="tabular-nums text-foreground/70">640 / 940</span>
                </div>
                <ProgressBar value={68} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Tilt>
  );
}

function EmbeddedPreview() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative w-full">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="origin-center"
      >
        <PreviewChrome prefersReducedMotion={prefersReducedMotion} tiltMax={2} />
      </motion.div>
    </div>
  );
}

function StandalonePreview() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.35, 0.55], [32, 8, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.55], [0.92, 0.98, 1]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={sectionRef} className="relative px-6 py-24 md:py-28">
      <ScrollReveal className="perspective-1200 mx-auto max-w-5xl">
        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : { rotateX, scale, y: parallaxY, transformStyle: "preserve-3d" }
          }
          className="origin-center"
        >
          <PreviewChrome prefersReducedMotion={prefersReducedMotion} />
        </motion.div>
      </ScrollReveal>
    </section>
  );
}

export function DashboardPreview({ embedded = false }: { embedded?: boolean }) {
  return embedded ? <EmbeddedPreview /> : <StandalonePreview />;
}
