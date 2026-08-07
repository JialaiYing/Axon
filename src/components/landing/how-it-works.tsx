"use client";

import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import {
  CalendarScheduleVisual,
  FlashcardsVisual,
  KanbanCaptureVisual,
  PomodoroVisual,
} from "@/components/landing/how-it-works-visuals";
import {
  HairlineGrid,
  LandingContainer,
  LandingHeader,
  LandingSection,
} from "@/components/landing/landing-primitives";

/** Capture → Schedule → Focus → Review */
const STEPS = [
  {
    id: "capture",
    title: "Capture on the Board",
    description:
      "Add objectives with subjects and priorities. The board is your to-do list — nothing disappears into a notebook.",
    Visual: KanbanCaptureVisual,
  },
  {
    id: "schedule",
    title: "Schedule the week",
    description:
      "Drop work onto the calendar so each day has a real plan, not a vague hope to study later.",
    Visual: CalendarScheduleVisual,
  },
  {
    id: "focus",
    title: "Protect the session",
    description:
      "Run a Pomodoro tied to an objective. The timer keeps the block honest when distractions show up.",
    Visual: PomodoroVisual,
  },
  {
    id: "review",
    title: "Review what's due",
    description:
      "Flashcards use Leitner spaced repetition. Study surfaces cards that are due — no set pick required.",
    Visual: FlashcardsVisual,
  },
];

export function HowItWorks() {
  return (
    <LandingSection id="how-it-works" className="bg-surface">
      <LandingContainer>
        <ScrollReveal className="mb-10 md:mb-14">
          <LandingHeader
            eyebrow="The loop"
            title="One system for the whole session."
            description="Board → calendar → focus → spaced review. Rebuild your setup once, then run the loop."
          />
        </ScrollReveal>

        <ScrollRevealGroup>
          <HairlineGrid cols={2}>
            {STEPS.map((step, index) => (
              <ScrollRevealItem key={step.id} className="flex flex-col gap-4 bg-background p-6 sm:p-7">
                <div
                  data-theme="dark"
                  className="aspect-[4/3] w-full overflow-hidden rounded-md border border-border/60"
                >
                  <step.Visual />
                </div>
                <div>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1.5 text-[15px] font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </ScrollRevealItem>
            ))}
          </HairlineGrid>
        </ScrollRevealGroup>
      </LandingContainer>
    </LandingSection>
  );
}
