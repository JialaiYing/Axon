import {
  BarChart3,
  CalendarDays,
  Kanban,
  Layers,
  LayoutDashboard,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import ScrollFloat from "@/components/effects/scroll-float";
import BlurText from "@/components/effects/blur-text";
import MagicCard from "@/components/effects/magic-card";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "One home view for streaks, focus time, and what's up next today.",
  },
  {
    icon: Kanban,
    title: "Kanban Workspace",
    description: "Move objectives from queued to finished with drag-and-drop clarity.",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    description: "Schedule objectives into your week and see every session in context.",
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
    <section id="features" className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mb-14 text-center md:mb-16">
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="flex justify-center"
            textClassName="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            {"Everything you need. Nothing you don't."}
          </ScrollFloat>
          <BlurText
            text="Eight focused tools, one consistent workspace."
            delay={80}
            animateBy="words"
            direction="bottom"
            as="p"
            className="mt-3.5 justify-center text-sm leading-relaxed text-muted md:text-base"
          />
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <ScrollRevealItem key={feature.title}>
              <TiltCard className="h-full">
                <MagicCard
                  className="h-full rounded-xl"
                  enableStars
                  enableBorderGlow
                  enableTilt={false}
                  clickEffect
                  particleCount={10}
                  glowColor="59, 130, 246"
                >
                  <Card className="h-full rounded-xl border-0 bg-transparent shadow-none">
                    <CardHeader>
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-accent-muted transition-transform duration-300 group-hover:scale-105">
                        <feature.icon className="h-4.5 w-4.5 text-accent" />
                      </div>
                      <CardTitle className="text-sm text-foreground">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent />
                  </Card>
                </MagicCard>
              </TiltCard>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
