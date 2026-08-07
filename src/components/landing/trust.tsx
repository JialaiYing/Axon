"use client";

import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import {
  HairlineGrid,
  LandingContainer,
  LandingHeader,
  LandingSection,
} from "@/components/landing/landing-primitives";

const PRINCIPLES = [
  {
    n: "01",
    title: "One connected system",
    description:
      "Board, calendar, focus timer, and flashcards all share the same objectives — nothing to re-enter across separate apps.",
  },
  {
    n: "02",
    title: "Free account, always synced",
    description:
      "No guest mode and no paid tier — just a free account. Once you’re signed in, everything syncs across your devices.",
  },
  {
    n: "03",
    title: "No AI gimmicks",
    description:
      "Streaks, XP, and review schedules come from rules applied to your own activity — not a model coaching or planning for you.",
  },
  {
    n: "04",
    title: "Designed for focus",
    description:
      "Quiet chrome and honest timers. No notification theater competing for your attention while you study.",
  },
];

/**
 * Calm-by-default principles — hairline-divided 2x2 grid.
 */
export function Trust() {
  return (
    <LandingSection id="trust" className="bg-surface">
      <LandingContainer>
        <ScrollReveal className="mb-10 md:mb-14">
          <LandingHeader
            eyebrow="Principles"
            title="Calm by default."
            description="Designed around how students study — not how apps chase engagement."
          />
        </ScrollReveal>

        <ScrollRevealGroup>
          <HairlineGrid cols={2}>
            {PRINCIPLES.map((principle) => (
              <ScrollRevealItem key={principle.title} className="bg-background p-6 sm:p-7">
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {principle.n}
                </span>
                <h3 className="mt-1.5 text-[15px] font-semibold tracking-tight text-foreground">
                  {principle.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {principle.description}
                </p>
              </ScrollRevealItem>
            ))}
          </HairlineGrid>
        </ScrollRevealGroup>
      </LandingContainer>
    </LandingSection>
  );
}
