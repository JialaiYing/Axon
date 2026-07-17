"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden px-6 pb-28 pt-32 text-center md:pt-44">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.18),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 -z-10 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.14),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-40 -z-10 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-border-strong/60 to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mb-7 flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-muted shadow-[0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-sm"
      >
        <Zap className="h-3.5 w-3.5 text-accent" />
        Built for focus, not features
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.06, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="max-w-4xl text-balance text-5xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-7xl"
      >
        The study dashboard for staying{" "}
        <span className="bg-gradient-to-r from-accent via-accent to-secondary bg-clip-text text-transparent">
          consistent
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.14, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-6 max-w-xl text-balance text-base leading-relaxed text-muted md:text-lg"
      >
        Axon turns your objectives, flashcards, and focus sessions into one
        calm, local-first workspace — with statistics-driven insights instead
        of noisy AI guesses.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-10 flex items-center gap-3"
      >
        <Button size="lg" asChild>
          <Link href="/dashboard">
            Open Dashboard
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="#features">See features</Link>
        </Button>
      </motion.div>
    </section>
  );
}
