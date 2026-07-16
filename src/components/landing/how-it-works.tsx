import { ListChecks, Timer, Layers, TrendingUp } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

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
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            How it works
          </h2>
          <p className="mt-3 text-sm text-muted md:text-base">
            Four tools, one loop: plan, focus, reinforce, review.
          </p>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <ScrollRevealItem key={item.step}>
              <div className="relative h-full rounded-lg border border-border bg-card p-6">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground">
                  {item.step}
                </span>
                <div className="mt-3 mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent-muted">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
