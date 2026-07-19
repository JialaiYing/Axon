"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Tilt from "react-parallax-tilt";
import CountUp from "react-countup";
import { CalendarClock, CheckCircle2, Circle, Flame, Sparkles, Target, Timer, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

const STATS = [
  { label: "Streak", value: 12, suffix: " days" },
  { label: "Focus today", value: 96, suffix: " min" },
  { label: "Intervals", value: 34, suffix: "" },
  { label: "Productivity", value: 82, suffix: "%" },
];

/** Mini Kanban-column slice — the same priority language as the real board. */
const BOARD_CARDS = [
  { title: "Org chem problem set", priority: "high" as const, status: "In progress" },
  { title: "Read ch. 6 — thermodynamics", priority: "medium" as const, status: "Queued" },
  { title: "Review flashcard deck", priority: "low" as const, status: "Done" },
];

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-success",
};

/** Mini "Today" agenda — focus session, calendar-only event, streak. */
const AGENDA_ITEMS = [
  { time: "9:30", label: "Focus session — Calc II", icon: Timer, empty: false },
  { time: "1:00", label: "Lab report due", icon: CalendarClock, empty: false },
];

/** Same daily/weekly goal pair (and pace language) the real Goals pulse card tracks. */
const GOAL_ROWS = [
  { title: "Focus time", pace: "On track" as const, progress: 96, target: 120, unit: "min" },
  { title: "Finish objectives", pace: "Behind" as const, progress: 2, target: 5, unit: "objectives" },
];

const PACE_COLOR: Record<string, string> = {
  Done: "text-success",
  "On track": "text-muted-foreground",
  Behind: "text-warning",
};

export function DashboardPreview() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Immersive perspective reveal: the panel starts pitched back like a
  // screen lying on a desk, then rises flat as it crosses the viewport —
  // an Apple-keynote-style product shot driven by scroll. Mouse-driven tilt
  // (via react-parallax-tilt) layers on top once it's settled.
  const rotateX = useTransform(scrollYProgress, [0, 0.35, 0.55], [32, 8, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.55], [0.92, 0.98, 1]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={sectionRef} className="px-6 py-24 md:py-28">
      <ScrollReveal className="perspective-1200 mx-auto max-w-5xl">
        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : { rotateX, scale, y: parallaxY, transformStyle: "preserve-3d" }
          }
          className="origin-center"
        >
          <Tilt
            tiltEnable={!prefersReducedMotion}
            tiltMaxAngleX={4}
            tiltMaxAngleY={4}
            perspective={1200}
            transitionSpeed={1200}
            glareEnable={false}
            className="will-change-transform"
          >
            <Card className="glass-panel glass-panel-hover overflow-hidden rounded-2xl p-2 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_20px_60px_-16px_rgba(59,130,246,0.35)]">
              <div className="rounded-xl bg-surface/60 p-6 md:p-8">
                <div className="mb-5 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                </div>

                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[1.1fr_0.9fr]">
                  {/* Board slice */}
                  <ScrollRevealGroup className="flex flex-col gap-2" stagger={0.08}>
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Up next
                    </p>
                    {BOARD_CARDS.map((card) => (
                      <ScrollRevealItem key={card.title}>
                        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 transition-colors duration-300 hover:border-border-strong hover:bg-card-hover">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[card.priority]}`} />
                          <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                            {card.title}
                          </p>
                          {card.status === "Done" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                      </ScrollRevealItem>
                    ))}
                  </ScrollRevealGroup>

                  {/* Agenda slice */}
                  <ScrollRevealGroup className="flex flex-col gap-2" stagger={0.08}>
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Today
                    </p>
                    {AGENDA_ITEMS.map((item) => (
                      <ScrollRevealItem key={item.label}>
                        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3">
                          <item.icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                          <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                            {item.label}
                          </p>
                          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                            {item.time}
                          </span>
                        </div>
                      </ScrollRevealItem>
                    ))}
                    <ScrollRevealItem>
                      <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-muted/25 p-3">
                        <Flame className="h-3.5 w-3.5 shrink-0 text-warning" />
                        <p className="text-xs font-medium text-foreground">12-day streak</p>
                        <Badge variant="accent" className="ml-auto">
                          Scholar II
                        </Badge>
                      </div>
                    </ScrollRevealItem>
                  </ScrollRevealGroup>
                </div>

                <ScrollRevealGroup className="mt-3.5 grid grid-cols-2 gap-3.5 md:grid-cols-4" stagger={0.1}>
                  {STATS.map((stat) => (
                    <ScrollRevealItem key={stat.label}>
                      <div className="rounded-lg border border-border bg-card p-4 transition-colors duration-300 hover:border-border-strong hover:bg-card-hover">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-1.5 text-lg font-semibold text-foreground">
                          <CountUp end={stat.value} duration={1.4} suffix={stat.suffix} />
                        </p>
                      </div>
                    </ScrollRevealItem>
                  ))}
                </ScrollRevealGroup>

                {/* Goals + Current rank — same pair as the dashboard */}
                <div className="mt-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Goals
                      </p>
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-success-muted text-success">
                        <Target className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="space-y-3">
                      {GOAL_ROWS.map((goal) => (
                        <div key={goal.title}>
                          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                            <span className="truncate">{goal.title}</span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span
                                className={`text-[10px] font-medium uppercase tracking-[0.08em] ${PACE_COLOR[goal.pace]}`}
                              >
                                {goal.pace}
                              </span>
                              <span className="tabular-nums text-foreground">
                                {goal.progress}/{goal.target} {goal.unit}
                              </span>
                            </span>
                          </div>
                          <ProgressBar
                            value={(goal.progress / goal.target) * 100}
                            size="sm"
                            className="mt-1.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        <Trophy className="h-3 w-3 text-accent" /> Current rank
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="accent" className="gap-1">
                          <Sparkles className="h-3 w-3" /> +42 XP today
                        </Badge>
                        <Badge variant="secondary">Level 8 / 30</Badge>
                      </div>
                    </div>
                    <p className="mt-2 mb-2 text-sm font-semibold text-foreground">Scholar II</p>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>XP to next level</span>
                      <span className="tabular-nums text-foreground">640 / 940</span>
                    </div>
                    <ProgressBar value={68} />
                  </div>
                </div>
              </div>
            </Card>
          </Tilt>
        </motion.div>
      </ScrollReveal>
    </section>
  );
}
