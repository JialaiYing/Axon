"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  LandingContainer,
  LandingHeading,
  LandingLead,
  LandingSection,
  landingPrimaryCtaClassName,
} from "@/components/landing/landing-primitives";
import { cn } from "@/lib/utils";

export function FinalCTA() {
  return (
    <LandingSection size="lg" className="relative bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[radial-gradient(ellipse_70%_55%_at_50%_112%,color-mix(in_srgb,var(--color-accent)_8%,transparent),transparent_70%)]"
      />
      <LandingContainer>
        <ScrollReveal className="mx-auto flex max-w-xl flex-col items-center text-center">
          <LandingHeading as="h2" className="md:text-5xl">
            Open your command center.
          </LandingHeading>
          <LandingLead className="mt-4 max-w-md">
            Create a free account and run your next session in one calm workspace.
          </LandingLead>
          <div className="mt-9">
            <Button
              size="lg"
              asChild
              ripple={false}
              className={cn(landingPrimaryCtaClassName, "px-6")}
            >
              <Link href="/login?mode=signup">Get started</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free account · no credit card required.
          </p>
        </ScrollReveal>
      </LandingContainer>
    </LandingSection>
  );
}
