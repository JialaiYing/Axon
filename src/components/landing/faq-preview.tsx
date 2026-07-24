"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FAQS, FAQContent } from "@/components/landing/faq";
import {
  LandingContainer,
  LandingHeader,
  LandingSection,
} from "@/components/landing/landing-primitives";

/** The three objections most likely to stall signup — account, price, AI. */
const HOME_FAQ_IDS = ["account", "free", "ai"];

/**
 * Condensed on-page FAQ, placed right before the closing CTA — answers the
 * objections a visitor still has at the moment of highest intent, instead of
 * asking them to leave the page to find out. Reuses the same FAQS data as
 * the full /faq page so the two can never drift out of sync.
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
            description="A few straight answers. The full list lives on the FAQ page."
            className="mx-auto"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="mt-10 md:mt-12">
          <FAQContent items={items} />
        </ScrollReveal>
      </LandingContainer>
    </LandingSection>
  );
}
