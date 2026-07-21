import { Brain, Compass, ShieldOff } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { VerticalStepper } from "@/components/ui/stepper";

const ICON_CLASS = "h-5 w-5 text-white";

const POINTS = [
  {
    icon: <Brain className={ICON_CLASS} />,
    title: "Distraction is the default",
    description:
      "Most study tools compete for your attention. Axon strips that away — just your objectives, calendar, and a timer.",
  },
  {
    icon: <Compass className={ICON_CLASS} />,
    title: "Consistency beats intensity",
    description:
      "Real progress comes from small, repeatable sessions. Axon tracks streaks and goals that reward steadiness over heroics.",
  },
  {
    icon: <ShieldOff className={ICON_CLASS} />,
    title: "No AI black box",
    description:
      "Every insight comes from transparent rules on your own activity — not a model making guesses it can't justify.",
  },
];

export function WhyAxon() {
  return (
    <section
      id="why-axon"
      className="border-t border-white/[0.06] bg-black px-6 py-24 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mb-14 max-w-3xl text-left md:mb-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Built for students who don&apos;t need another feed to scroll — they need a
            reason to sit down and study.
          </h2>
        </ScrollReveal>

        <VerticalStepper steps={POINTS} />
      </div>
    </section>
  );
}
