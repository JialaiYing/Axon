"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

const STATS = [
  { label: "Rank", node: "Scholar II" },
  { label: "Streak", node: <AnimatedCounter value={12} suffix=" days" /> },
  { label: "Intervals", node: <AnimatedCounter value={34} /> },
  { label: "Productivity", node: <AnimatedCounter value={82} suffix="%" /> },
];

export function DashboardPreview() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Immersive perspective reveal: the panel starts pitched back like a
  // screen lying on a desk, then rises flat as it crosses the viewport —
  // an Apple-keynote-style product shot driven by scroll.
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
          <Card className="glass-panel glass-panel-hover overflow-hidden rounded-2xl p-2 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_20px_60px_-16px_rgba(59,130,246,0.35)]">
            <div className="rounded-xl bg-surface/60 p-6 md:p-8">
              <div className="mb-5 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>

              <ScrollRevealGroup className="grid grid-cols-2 gap-3.5 md:grid-cols-4" stagger={0.1}>
                {STATS.map((stat) => (
                  <ScrollRevealItem key={stat.label}>
                    <div className="rounded-lg border border-border bg-card p-4 transition-colors duration-300 hover:border-border-strong hover:bg-card-hover">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-1.5 text-lg font-semibold text-foreground">{stat.node}</p>
                    </div>
                  </ScrollRevealItem>
                ))}
              </ScrollRevealGroup>

              <div className="mt-3.5 rounded-lg border border-border bg-card p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-xs text-muted">Weekly XP Progress</p>
                  <p className="text-xs text-muted-foreground">Level 8</p>
                </div>
                <ProgressBar value={68} showLabel />
              </div>
            </div>
          </Card>
        </motion.div>
      </ScrollReveal>
    </section>
  );
}
