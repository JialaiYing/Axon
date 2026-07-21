"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden rounded-b-[12px] bg-black px-6 pb-20 pt-28 md:rounded-b-[16px] md:pb-28 md:pt-36">
      {/* Soft light wash — fades under the product shot without a hard plate */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(to_top,rgba(232,232,237,0.35)_0%,rgba(58,58,66,0.25)_40%,transparent_100%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="max-w-3xl text-left"
        >
          <h1 className="font-display text-balance text-5xl font-semibold leading-[1.08] tracking-tight text-white md:text-7xl">
            The study dashboard for staying consistent
          </h1>
          <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-white/65 md:text-lg">
            One calm, local-first workspace with statistics-driven insights
            instead of noisy AI guesses
          </p>
        </motion.div>

        <div className="mx-auto mt-14 w-full max-w-[52rem] md:mt-20 lg:max-w-[56rem]">
          <div className="relative shadow-[0_2px_8px_rgba(0,0,0,0.2),0_24px_48px_-12px_rgba(0,0,0,0.55),0_48px_96px_-24px_rgba(0,0,0,0.45)]">
            <DashboardPreview embedded />
          </div>
        </div>
      </div>
    </section>
  );
}
