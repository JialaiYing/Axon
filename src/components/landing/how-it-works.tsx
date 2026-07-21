import { ListChecks, Timer, Layers, TrendingUp } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { HorizontalStepper } from "@/components/ui/stepper";

const ICON_CLASS = "h-5 w-5 text-white";

const STEPS = [
  {
    icon: <ListChecks className={ICON_CLASS} />,
    title: "Capture your objectives",
    description: "Drop every assignment into the Kanban board, tagged by subject and priority.",
  },
  {
    icon: <Timer className={ICON_CLASS} />,
    title: "Study in focused intervals",
    description: "Run Pomodoro sessions against those objectives so time maps to real progress.",
  },
  {
    icon: <Layers className={ICON_CLASS} />,
    title: "Reinforce with flashcards",
    description: "Turn material into review sets and track mastery per card, not just per session.",
  },
  {
    icon: <TrendingUp className={ICON_CLASS} />,
    title: "Track what's real",
    description: "Analytics and goals update from your actual activity — no self-reported check-ins.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-black px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mb-14 max-w-xl text-left md:mb-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            How it works
          </h2>
          <p className="mt-3.5 text-sm leading-relaxed text-white/55 md:text-base">
            One loop, four steps: plan, focus, reinforce, review.
          </p>
        </ScrollReveal>

        <HorizontalStepper steps={STEPS} />
      </div>
    </section>
  );
}
