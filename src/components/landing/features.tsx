"use client";

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
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import SpecularButton from "@/components/effects/specular-button";

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
    <section
      id="features"
      className="border-t border-white/[0.06] bg-black px-6 py-24 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mb-14 max-w-xl text-left md:mb-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
            Workspace
          </p>
          <p className="mt-3.5 text-sm leading-relaxed text-white/60 md:text-base">
            Eight focused tools, one consistent workspace.
          </p>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <ScrollRevealItem key={feature.title} className="h-full">
              <SpecularButton
                size="card"
                radius={16}
                tint="#ffffff"
                tintOpacity={0}
                blur={0}
                textColor="#f5f5f5"
                lineColor="#ffffff"
                baseColor="#525252"
                intensity={1}
                shineSize={10}
                shineFade={40}
                thickness={1}
                speed={0.35}
                followMouse
                proximity={250}
                autoAnimate={false}
                className="h-full min-h-[11rem]"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-white/12 bg-white/[0.04]">
                  <feature.icon className="h-4 w-4 text-white/85" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-white">{feature.title}</span>
                <span className="mt-2 text-sm font-normal leading-relaxed text-white/55">
                  {feature.description}
                </span>
              </SpecularButton>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
