"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { HowItWorksVisual } from "@/components/landing/how-it-works-visuals";
import { cn } from "@/lib/utils";
import { DURATION, EASE } from "@/lib/motion";

const STEPS = [
  {
    id: "capture",
    title: "Capture your objectives",
    description:
      "Drop every assignment into the Kanban board, tagged by subject and priority.",
  },
  {
    id: "focus",
    title: "Study in focused intervals",
    description:
      "Run Pomodoro sessions against those objectives so time maps to real progress.",
  },
  {
    id: "reinforce",
    title: "Reinforce with flashcards",
    description:
      "Turn material into review sets and track mastery per card, not just per session.",
  },
  {
    id: "track",
    title: "Track what's real",
    description:
      "Analytics and goals update from your actual activity — no self-reported check-ins.",
  },
];

export function HowItWorks() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const selectStep = (index: number) => {
    setActiveIndex(index);
  };

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next =
      e.key === "ArrowDown"
        ? (index + 1) % STEPS.length
        : (index - 1 + STEPS.length) % STEPS.length;
    selectStep(next);
    buttonRefs.current[next]?.focus();
  };

  return (
    <section
      id="how-it-works"
      className="border-t border-white/[0.06] bg-black px-6 py-24 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mb-14 max-w-xl text-left md:mb-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
            The loop
          </p>
          <p className="mt-3.5 text-sm leading-relaxed text-white/60 md:text-base">
            One loop, four steps: plan, focus, reinforce, review.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.2fr_0.8fr] md:gap-12 lg:gap-14">
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.02] shadow-[var(--shadow-elevation-4)]"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="sr-only">Showing: {STEPS[activeIndex]?.title}</span>
            <div
              className="absolute inset-x-0 top-0 z-[1] flex items-center gap-1.5 border-b border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm"
              aria-hidden
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={STEPS[activeIndex]?.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: DURATION.base, ease: EASE }}
                className="absolute inset-0 pt-6"
                aria-hidden
              >
                <HowItWorksVisual index={activeIndex} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col">
            {STEPS.map((step, index) => {
              const isOpen = activeIndex === index;
              const panelId = `how-it-works-panel-${step.id}`;
              const headerId = `how-it-works-header-${step.id}`;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "relative border-b border-white/[0.08]",
                    index === 0 && "border-t border-white/[0.08]"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-3 left-0 w-px rounded-full transition-opacity duration-200",
                      isOpen ? "bg-white/70 opacity-100" : "opacity-0"
                    )}
                  />

                  <button
                    ref={(el) => {
                      buttonRefs.current[index] = el;
                    }}
                    type="button"
                    id={headerId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => selectStep(index)}
                    onKeyDown={(e) => onRowKeyDown(e, index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md py-3.5 pl-3 pr-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                      isOpen
                        ? "bg-white/[0.04] text-white"
                        : "text-white/50 hover:bg-white/[0.02] hover:text-white/75"
                    )}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 font-display text-[15px] font-semibold tracking-tight md:text-base",
                        isOpen ? "text-white" : "text-inherit"
                      )}
                    >
                      {step.title}
                    </span>
                    <motion.span
                      aria-hidden
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : DURATION.fast,
                        ease: EASE,
                      }}
                      className={cn(
                        "shrink-0 transition-colors duration-200",
                        isOpen ? "text-white/55" : "text-white/25"
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={headerId}
                        initial={
                          prefersReducedMotion ? false : { height: 0, opacity: 0 }
                        }
                        animate={{ height: "auto", opacity: 1 }}
                        exit={
                          prefersReducedMotion
                            ? undefined
                            : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: DURATION.base, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 pl-3 pr-8 text-sm leading-relaxed text-white/55 md:text-[15px]">
                          {step.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
