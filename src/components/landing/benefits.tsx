import { CheckCircle2 } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";

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
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Why students stick with it
          </h2>
        </ScrollReveal>

        <ScrollRevealGroup className="mx-auto grid max-w-4xl grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <ScrollRevealItem key={benefit}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <p className="text-sm text-muted">{benefit}</p>
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
