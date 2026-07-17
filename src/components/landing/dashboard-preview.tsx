"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // Subtle scroll-linked parallax — the preview drifts a few px against the
  // page's scroll rather than staying perfectly pinned to the viewport.
  const parallaxY = useTransform(scrollYProgress, [0, 1], [24, -24]);

  return (
    <section ref={sectionRef} className="px-6 pb-24">
      <ScrollReveal className="mx-auto max-w-5xl">
        <motion.div style={{ y: parallaxY }}>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Card className="glass overflow-hidden p-2 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_8px_30px_-10px_rgba(59,130,246,0.35)]">
              <div className="rounded-md bg-surface/60 p-6">
                <div className="mb-4 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                </div>

                <ScrollRevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-4" stagger={0.1}>
                  {STATS.map((stat) => (
                    <ScrollRevealItem key={stat.label}>
                      <div className="rounded-md border border-border bg-card p-4">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{stat.node}</p>
                      </div>
                    </ScrollRevealItem>
                  ))}
                </ScrollRevealGroup>

                <div className="mt-3 rounded-md border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted">Weekly XP Progress</p>
                    <p className="text-xs text-muted-foreground">Level 7</p>
                  </div>
                  <ProgressBar value={68} showLabel />
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </ScrollReveal>
    </section>
  );
}