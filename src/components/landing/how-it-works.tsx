"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { HowItWorksVisual } from "@/components/landing/how-it-works-visuals";
import {
  LandingContainer,
  LandingHeader,
  LandingSection,
  ProductChrome,
} from "@/components/landing/landing-primitives";
import { cn } from "@/lib/utils";
import { DURATION, EASE } from "@/lib/motion";

/** Capture → Schedule → Focus → Review */
const STEPS = [
  {
    id: "capture",
    title: "Capture objectives",
    description:
      "Put assignments on a Kanban board. Priorities stay visible so nothing disappears into a notebook.",
  },
  {
    id: "schedule",
    title: "Schedule the week",
    description:
      "Drop work onto the calendar so the day has a real plan, not a vague hope to study later.",
  },
  {
    id: "focus",
    title: "Protect the session",
    description:
      "Run a Pomodoro against an objective. The timer keeps the block honest when distractions show up.",
  },
  {
    id: "review",
    title: "Review what stuck",
    description:
      "Turn material into flashcards and track mastery from finished work, not guesswork.",
  },
];

export function HowItWorks() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const prefersReducedMotion = useReducedMotion();
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const selectStep = (index: number) => setActiveIndex(index);

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
    <LandingSection id="how-it-works" className="bg-surface">
      <LandingContainer>
        <ScrollReveal className="mb-10 md:mb-14">
          <LandingHeader
            eyebrow="The loop"
            title="One system for the whole session."
            description="Capture, schedule, focus, review. No rebuilding your setup every time you sit down."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <ProductChrome
            title={STEPS[activeIndex]?.title ?? "Workspace"}
            className="hidden aspect-[5/4] w-full sm:aspect-[4/3] lg:block"
            bodyClassName="relative"
          >
            <div className="absolute inset-0" aria-live="polite" aria-atomic="true">
              <span className="sr-only">Showing: {STEPS[activeIndex]?.title}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={STEPS[activeIndex]?.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: DURATION.base, ease: EASE }}
                  className="absolute inset-0"
                  aria-hidden
                >
                  <HowItWorksVisual index={activeIndex} />
                </motion.div>
              </AnimatePresence>
            </div>
          </ProductChrome>

          <div className="flex flex-col justify-center">
            {STEPS.map((step, index) => {
              const isOpen = activeIndex === index;
              const panelId = `how-it-works-panel-${step.id}`;
              const headerId = `how-it-works-header-${step.id}`;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "relative border-b border-border/50",
                    index === 0 && "border-t border-border/50"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-2.5 left-0 w-0.5 rounded-full transition-opacity duration-200",
                      isOpen ? "bg-accent opacity-100" : "opacity-0"
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
                      "flex w-full items-center gap-3 rounded-md py-3.5 pl-3 pr-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isOpen
                        ? "bg-wash text-foreground"
                        : "text-muted-foreground hover:bg-wash/70 hover:text-foreground"
                    )}
                  >
                    <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[15px] font-semibold tracking-tight",
                        isOpen ? "text-foreground" : "text-inherit"
                      )}
                    >
                      {step.title}
                    </span>
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
                        <div className="pb-4 pl-11 pr-4">
                          <ProductChrome
                            title={step.title}
                            className="mb-4 aspect-[4/3] w-full lg:hidden"
                            bodyClassName="relative"
                          >
                            <div className="absolute inset-0" aria-hidden>
                              <HowItWorksVisual index={index} />
                            </div>
                          </ProductChrome>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
