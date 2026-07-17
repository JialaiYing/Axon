import { CheckCircle2 } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import ScrollFloat from "@/components/effects/scroll-float";
import BorderGlow from "@/components/effects/border-glow";

const BENEFITS = [
  "Everything runs locally — no account required to start",
  "No AI subscriptions or API keys to manage",
  "Built to make small, consistent effort visible",
  "Kanban, flashcards, and Pomodoro in one workspace",
  "Statistics-driven insights, not opaque predictions",
  "Designed to scale from localStorage to a real database later",
];

export function Benefits() {
  return (
    <section className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-12 max-w-xl text-center md:mb-14">
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="flex justify-center"
            textClassName="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Why students stick with it
          </ScrollFloat>
        </ScrollReveal>

        <ScrollRevealGroup className="mx-auto grid max-w-4xl grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <ScrollRevealItem key={benefit}>
              <TiltCard maxTilt={4}>
                <BorderGlow
                  edgeSensitivity={28}
                  glowColor="210 90 75"
                  backgroundColor="#131620"
                  borderRadius={12}
                  glowRadius={24}
                  glowIntensity={0.85}
                  coneSpread={22}
                  colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
                  fillOpacity={0.35}
                  className="h-full"
                >
                  <div className="flex items-start gap-3 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <p className="text-sm leading-relaxed text-muted">{benefit}</p>
                  </div>
                </BorderGlow>
              </TiltCard>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
