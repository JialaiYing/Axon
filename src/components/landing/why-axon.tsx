import { Brain, Compass, ShieldOff } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

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
    <section id="why-axon" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Why Axon exists
          </h2>
          <p className="mt-3 text-sm text-muted md:text-base">
            Built for students who don&apos;t need another feed to scroll —
            they need a reason to sit down and study.
          </p>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {POINTS.map((point) => (
            <ScrollRevealItem key={point.title}>
              <div className="h-full rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent-muted">
                  <point.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{point.description}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
