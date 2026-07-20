import { CheckCircle2 } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import ScrollFloat from "@/components/effects/scroll-float";
import BorderGlow from "@/components/effects/border-glow";

const BENEFITS = [
  "Works fully offline — an account is only needed for cross-device sync",
  "No AI subscriptions or API keys to manage",
  "Built to make small, consistent effort visible",
  "One connected workspace instead of five disconnected apps",
  "Statistics-driven insights, not opaque predictions",
  "Your data stays yours — local-first, with optional cloud sync",
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
            textClassName="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Why students stick with it
          </ScrollFloat>
        </ScrollReveal>

        <ScrollRevealGroup className="mx-auto grid max-w-4xl grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <ScrollRevealItem key={benefit} className="h-full">
              <TiltCard maxTilt={4} className="h-full">
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
                  {/* BorderGlow without asButton renders backgroundColor as a
                      literal, theme-independent fill — this card stays dark
                      navy in both themes, so its text is hardcoded light
                      rather than following text-muted (which would flip to
                      dark gray in light mode and disappear). */}
                  <div className="flex items-start gap-3 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <p className="text-sm leading-relaxed text-white/70">{benefit}</p>
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
