"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StepperStep {
  /** Pre-rendered icon element (e.g. `<Brain className="h-5 w-5" />`) — kept
   *  as a rendered node rather than a component reference so this data can
   *  cross the server/client boundary when this component is used from a
   *  server component. */
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface VerticalStepperProps {
  steps: StepperStep[];
  className?: string;
}

/**
 * A single connected vertical line of steps — deliberately not cards.
 * A dim base rail runs the full height; a white fill rail on top of it
 * completes as the section scrolls through view.
 */
export function VerticalStepper({ steps, className }: VerticalStepperProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const fillScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="absolute left-6 top-6 bottom-6 w-px bg-white/20" aria-hidden />
      <motion.div
        aria-hidden
        style={{ scaleY: fillScale }}
        className="absolute left-6 top-6 bottom-6 w-px origin-top bg-white"
      />

      <ol className="flex flex-col gap-14">
        {steps.map((step, index) => (
          <StepperRow key={step.title} step={step} index={index} />
        ))}
      </ol>
    </div>
  );
}

function StepperRow({ step, index }: { step: StepperStep; index: number }) {
  return (
    <motion.li
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6, margin: "0px 0px -80px 0px" }}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative flex gap-5 pl-0"
    >
      <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black text-white shadow-[0_0_0_4px_rgba(0,0,0,1)]">
        {step.icon}
      </span>
      <div className="max-w-none flex-1 pt-1.5">
        <p className="font-mono text-[11px] tracking-[0.15em] text-white/45">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-white md:text-xl">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60 md:text-base">{step.description}</p>
      </div>
    </motion.li>
  );
}

interface HorizontalStepperProps {
  steps: StepperStep[];
  className?: string;
}

/**
 * Horizontal timeline in the spirit of Linear's changelog strip:
 * a continuous rail with numbered nodes, titles, and short copy —
 * scrollable on smaller viewports.
 */
export function HorizontalStepper({ steps, className }: HorizontalStepperProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.45"],
  });
  const fillScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="-mx-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative min-w-[44rem] md:min-w-0">
          <div className="absolute left-6 right-6 top-6 h-px bg-white/20" aria-hidden />
          <motion.div
            aria-hidden
            style={{ scaleX: fillScale }}
            className="absolute left-6 right-6 top-6 h-px origin-left bg-white"
          />

          <ol className="relative grid grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.li
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="flex flex-col"
              >
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black text-white shadow-[0_0_0_4px_rgba(0,0,0,1)]">
                  {step.icon}
                </span>
                <p className="mt-6 font-mono text-[11px] tracking-[0.15em] text-white/45">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-display text-base font-semibold tracking-tight text-white md:text-lg">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{step.description}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
