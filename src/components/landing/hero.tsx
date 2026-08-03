"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Button } from "@/components/ui/button";
import {
  LandingContainer,
  LandingHeading,
  LandingLead,
  landingFocusRingClassName,
  landingPrimaryCtaClassName,
} from "@/components/landing/landing-primitives";
import { DURATION, EASE, STAGGER, enterVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? false : "hidden";

  return (
    <section className="relative overflow-hidden bg-background pb-16 pt-20 md:pb-24 md:pt-24">
      {/* Quiet atmospheric wash — value only, no accent glow theater */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-[radial-gradient(ellipse_70%_55%_at_50%_-12%,color-mix(in_srgb,var(--color-foreground)_6%,transparent),transparent_70%)]"
      />

      <LandingContainer className="relative z-10">
        <motion.div
          initial={initial}
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: STAGGER.base },
            },
          }}
          className="mx-auto flex max-w-2xl flex-col items-center text-center"
        >
          <motion.div
            variants={enterVariants(10)}
            transition={{ duration: DURATION.section, ease: EASE }}
          >
            <LandingHeading as="h1">Study without the noise.</LandingHeading>
          </motion.div>

          <motion.div
            variants={enterVariants(10)}
            transition={{ duration: DURATION.section, ease: EASE }}
          >
            <LandingLead className="mx-auto mt-5 max-w-md">
              One signed-in place to plan objectives, focus, and review with spaced
              flashcards. Free account required — syncs across your devices.
            </LandingLead>
          </motion.div>

          <motion.div
            variants={enterVariants(8)}
            transition={{ duration: DURATION.section, ease: EASE }}
            className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3"
          >
            <Button
              size="lg"
              asChild
              ripple={false}
              className={landingPrimaryCtaClassName}
            >
              <Link href="/login?mode=signup">Get started</Link>
            </Button>
            <Link
              href="/login"
              className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                landingFocusRingClassName,
                "rounded-md"
              )}
            >
              Sign in
            </Link>
          </motion.div>

          <motion.p
            variants={enterVariants(6)}
            transition={{ duration: DURATION.section, ease: EASE }}
            className="mt-3 text-xs text-muted-foreground"
          >
            Free account · no credit card · sync included.
          </motion.p>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: DURATION.section,
            delay: prefersReducedMotion ? 0 : 0.12,
            ease: EASE,
          }}
          className="mt-14 w-full md:mt-16"
        >
          <DashboardPreview />
        </motion.div>
      </LandingContainer>
    </section>
  );
}
