"use client";

import Link from "next/link";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/ui/scroll-reveal";
import { FAQS } from "@/components/landing/faq";
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
 * Condensed on-page FAQ before the closing CTA — plain always-visible list,
 * not an accordion (short enough to just read). Reuses FAQS from /faq so
 * answers cannot drift.
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

        <ScrollRevealGroup className="mt-10 border-y border-border/60 md:mt-12">
          <dl className="divide-y divide-border/60">
            {items.map((faq, i) => (
              <ScrollRevealItem key={faq.id}>
                <div className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-8">
                  <dt className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] font-medium tracking-tight text-foreground">
                      {faq.question}
                    </span>
                  </dt>
                  <dd className="pl-[1.9rem] text-sm leading-relaxed text-muted-foreground sm:pl-0">
                    {faq.answer}
                  </dd>
                </div>
              </ScrollRevealItem>
            ))}
          </dl>
        </ScrollRevealGroup>

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
      </LandingContainer>
    </LandingSection>
  );
}
