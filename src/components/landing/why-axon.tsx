import { Brain, Compass, ShieldOff } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import ScrollFloat from "@/components/effects/scroll-float";
import TextType from "@/components/effects/text-type";
import MagicCard from "@/components/effects/magic-card";

const POINTS = [
  {
    icon: Brain,
    title: "Distraction is the default",
    description:
      "Most study tools compete for your attention with notifications and feeds. Axon has none of that — just your work, laid out clearly.",
  },
  {
    icon: Compass,
    title: "Consistency beats intensity",
    description:
      "Cramming feels productive and rarely is. Axon is built around small, trackable habits — streaks, intervals, and steady weekly goals.",
  },
  {
    icon: ShieldOff,
    title: "No AI black box",
    description:
      "Every recommendation Axon gives comes from your own activity — plain statistics and rules, not an opaque model guessing at you.",
  },
];

export function WhyAxon() {
  return (
    <section id="why-axon" className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-14 max-w-xl text-center md:mb-16">
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="flex justify-center"
            textClassName="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Why Axon exists
          </ScrollFloat>
          <TextType
            text="Built for students who don't need another feed to scroll — they need a reason to sit down and study."
            typingSpeed={45}
            showCursor
            cursorCharacter="_"
            startOnVisible
            className="mt-3.5 text-sm leading-relaxed text-muted md:text-base"
            as="p"
          />
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {POINTS.map((point) => (
            <ScrollRevealItem key={point.title}>
              <TiltCard className="h-full">
                <MagicCard
                  className="h-full rounded-xl"
                  enableStars
                  enableBorderGlow
                  clickEffect
                  particleCount={10}
                  glowColor="59, 130, 246"
                >
                  <div className="h-full rounded-xl border border-border/60 bg-card/50 p-7 backdrop-blur-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent-muted">
                      <point.icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{point.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted">{point.description}</p>
                  </div>
                </MagicCard>
              </TiltCard>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
