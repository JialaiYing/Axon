"use client";

import { Calendar, Layers, LayoutGrid, Timer } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { HorizontalStepper } from "@/components/ui/stepper";
import {
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
    icon: <LayoutGrid className="h-5 w-5" aria-hidden />,
  },
  {
    id: "schedule",
    title: "Schedule the week",
    description:
      "Drop work onto the calendar so each day has a real plan, not a vague hope to study later.",
    icon: <Calendar className="h-5 w-5" aria-hidden />,
  },
  {
    id: "focus",
    title: "Protect the session",
    description:
      "Run a Pomodoro tied to an objective. The timer keeps the block honest when distractions show up.",
    icon: <Timer className="h-5 w-5" aria-hidden />,
  },
  {
    id: "review",
    title: "Review what's due",
    description:
      "Flashcards use Leitner spaced repetition. Study surfaces cards that are due — no set pick required.",
    icon: <Layers className="h-5 w-5" aria-hidden />,
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

        <ScrollReveal delay={0.06}>
          <HorizontalStepper steps={STEPS} />
        </ScrollReveal>
      </LandingContainer>
    </LandingSection>
  );
}
