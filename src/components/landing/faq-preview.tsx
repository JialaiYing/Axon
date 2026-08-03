"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FAQS, FAQContent } from "@/components/landing/faq";
import {
  LandingContainer,
  LandingHeader,
  LandingSection,
  landingFocusRingClassName,
} from "@/components/landing/landing-primitives";
import { cn } from "@/lib/utils";

/** The three objections most likely to stall signup — account, price, AI. */
const HOME_FAQ_IDS = ["account", "free", "ai"];

/**
 * Condensed on-page FAQ before the closing CTA.
 * Reuses FAQS from /faq so answers cannot drift.
 */
export function FAQPreview() {
  const items = FAQS.filter((faq) => HOME_FAQ_IDS.includes(faq.id));

  return (
    <LandingSection id="faq" className="bg-background">
      <LandingContainer className="max-w-2xl">
        <ScrollReveal>
          <LandingHeader
            align="center"
            eyebrow="FAQ"
            title="Before you sign up."
            description="Straight answers on accounts, price, and AI."
            className="mx-auto"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="mt-10 md:mt-12">
          <FAQContent items={items} />
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link
              href="/faq"
              className={cn(
                "font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground",
                landingFocusRingClassName,
                "rounded-sm"
              )}
            >
              See the full FAQ
            </Link>
          </p>
        </ScrollReveal>
      </LandingContainer>
    </LandingSection>
  );
}
