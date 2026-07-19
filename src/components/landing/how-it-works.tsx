import { ListChecks, Timer, Layers, TrendingUp } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import ScrollFloat from "@/components/effects/scroll-float";
import TextType from "@/components/effects/text-type";
import MagicCard from "@/components/effects/magic-card";

const STEPS = [
  {
    step: "01",
    icon: ListChecks,
    title: "Capture your objectives",
    description: "Drop every assignment and study task into the Kanban board, tagged by subject and priority.",
  },
  {
    step: "02",
    icon: Timer,
    title: "Study in focused intervals",
    description: "Run Pomodoro sessions against those objectives so time actually maps to real progress.",
  },
  {
    step: "03",
    icon: Layers,
    title: "Reinforce with flashcards",
    description: "Turn material into review sets and track mastery per card, not just per session.",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Track what's real",
    description: "Analytics and goals update from your actual activity — no self-reported check-ins.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-14 max-w-xl text-center md:mb-16">
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="flex justify-center"
            textClassName="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            How it works
          </ScrollFloat>
          <TextType
            text="Four tools, one loop: plan, focus, reinforce, review."
            typingSpeed={22}
            showCursor
            cursorCharacter="_"
            startOnVisible
            className="mt-3.5 text-sm leading-relaxed text-muted md:text-base"
            as="p"
          />
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <ScrollRevealItem key={item.step}>
              <MagicCard
                className="h-full rounded-xl"
                enableStars={false}
                enableBorderGlow
                clickEffect
                glowColor="59, 130, 246"
              >
                <div className="group relative h-full rounded-xl border border-border/60 bg-card/50 p-7 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground">
                    {item.step}
                  </span>
                  <div className="mt-3 mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent-muted transition-transform duration-300 group-hover:scale-105">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </MagicCard>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
