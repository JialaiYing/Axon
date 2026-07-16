import { Kanban, Layers, Timer, BarChart3, Target, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

const FEATURES = [
  {
    icon: Kanban,
    title: "Kanban Workspace",
    description: "Move objectives from queued to finished with drag-and-drop clarity.",
  },
  {
    icon: Layers,
    title: "Flashcards",
    description: "Build sets, run review sessions, and track mastery over time.",
  },
  {
    icon: Timer,
    title: "Pomodoro",
    description: "Custom work and break intervals that keep your sessions honest.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Consistency, accuracy, and productivity trends from real activity.",
  },
  {
    icon: Target,
    title: "Goals",
    description: "Daily targets and weekly goals with clear completion tracking.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "XP, ranks, and streaks calculated from what you actually finish.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-3 text-sm text-muted md:text-base">
            Six focused tools, one consistent workspace.
          </p>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <ScrollRevealItem key={feature.title}>
              <Card className="h-full hover:bg-card-hover hover:border-border-strong">
                <CardHeader>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-accent-muted">
                    <feature.icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <CardTitle className="text-sm text-foreground">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
