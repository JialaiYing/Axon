import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function FinalCTA() {
  return (
    <section className="px-6 pb-24">
      <ScrollReveal className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-10 text-center md:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(59,130,246,0.14),transparent)]"
          />
          <h2 className="relative text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Start your first streak today
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-muted md:text-base">
            No signup, no setup, no AI subscription. Just open the dashboard
            and add your first objective.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
