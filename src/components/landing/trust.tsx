"use client";

import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import {
  LandingContainer,
  LandingEyebrow,
  LandingSection,
} from "@/components/landing/landing-primitives";

const PRINCIPLES = [
  {
    n: "01",
    title: "Free account required",
    description:
      "Sign in to use the app — there is no guest mode. Once you’re signed in, the same board, timers, flashcards, and progress sync across your devices.",
  },
  {
    n: "02",
    title: "Fast after you sign in",
    description:
      "Study data stays local for a responsive feel, with cloud sync in the background. Not an offline-first product — an account is the door.",
  },
  {
    n: "03",
    title: "Built for deep work",
    description:
      "Quiet chrome, honest timers, and progress from finished work. No AI coaching, no notification theater — instead of juggling a task app, calendar, timer, and flashcard app.",
  },
];

/**
 * Calm-by-default principles — typographic beat, no card grid.
 */
export function Trust() {
  return (
    <LandingSection id="trust" className="bg-surface">
      <LandingContainer>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <ScrollReveal>
            <LandingEyebrow>Principles</LandingEyebrow>
            <h2 className="mt-3 text-balance font-display text-3xl font-semibold leading-[1.15] tracking-tight text-foreground md:text-4xl">
              Calm by default. Designed around how students study — not how apps
              chase engagement.
            </h2>
          </ScrollReveal>

          <ScrollRevealGroup className="divide-y divide-border/60 border-y border-border/60">
            {PRINCIPLES.map((step) => (
              <ScrollRevealItem key={step.title}>
                <div className="flex items-baseline gap-5 py-5">
                  <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        </div>
      </LandingContainer>
    </LandingSection>
  );
}
