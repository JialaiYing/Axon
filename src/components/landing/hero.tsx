"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { AxonLogo } from "@/components/brand/axon-logo";
import { Button } from "@/components/ui/button";
import { DURATION, EASE, STAGGER, enterVariants } from "@/lib/motion";

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? false : "hidden";

  return (
    <section className="relative overflow-hidden bg-black px-6 pb-20 pt-28 md:pb-28 md:pt-36">
      {/* Soft light wash — fades under the product shot without a hard plate */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(to_top,rgba(232,232,237,0.35)_0%,rgba(58,58,66,0.25)_40%,transparent_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.div
          initial={initial}
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: STAGGER.base },
            },
          }}
          className="max-w-3xl text-left"
        >
          {/* Compact brand mark — keeps the logo feature without displacing the headline */}
          <motion.div
            variants={enterVariants(10)}
            transition={{ duration: DURATION.section, ease: EASE }}
          >
            <AxonLogo
              withWordmark
              priority
              iconClassName="h-13 w-13"
              wordmarkClassName="text-base font-semibold tracking-tight text-white md:text-lg"
              className="gap-2.5"
            />
          </motion.div>

          <motion.h1
            variants={enterVariants(12)}
            transition={{ duration: DURATION.section, ease: EASE }}
            className="mt-8 font-display text-balance text-5xl font-semibold leading-[1.08] tracking-tight text-white md:mt-6 md:text-7xl"
          >
            The study dashboard for staying consistent
          </motion.h1>

          <motion.p
            variants={enterVariants(12)}
            transition={{ duration: DURATION.section, ease: EASE }}
            className="mt-6 max-w-xl text-balance text-base leading-relaxed text-white/65 md:text-lg"
          >
            One calm study workspace with statistics-driven insights instead of
            noisy AI guesses — create a free account to get started.
          </motion.p>

          <motion.div
            variants={enterVariants(10)}
            transition={{ duration: DURATION.section, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button
              size="lg"
              asChild
              className="rounded-lg border-0 bg-white text-sm font-medium text-black shadow-none hover:bg-white/90 hover:shadow-none"
            >
              <Link href="/login?mode=signup">Get started</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-lg border-white/20 bg-transparent text-sm font-medium text-white shadow-none hover:bg-white/5 hover:text-white hover:shadow-none"
            >
              <Link href="/login">Log in</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: DURATION.section,
            delay: prefersReducedMotion ? 0 : 0.18,
            ease: EASE,
          }}
          className="mx-auto mt-14 w-full max-w-[52rem] md:mt-20 lg:max-w-[56rem]"
        >
          <div
            data-theme="dark"
            className="relative shadow-[var(--shadow-elevation-4)]"
          >
            <DashboardPreview embedded />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
