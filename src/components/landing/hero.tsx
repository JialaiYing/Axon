"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center px-6 pb-20 pt-28 text-center md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.16),transparent)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted"
      >
        <Zap className="h-3.5 w-3.5 text-accent" />
        Built for focus, not features
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl"
      >
        The study dashboard for staying{" "}
        <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
          consistent
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-5 max-w-xl text-balance text-base text-muted md:text-lg"
      >
        Axon turns your objectives, flashcards, and focus sessions into one
        calm, local-first workspace — with statistics-driven insights instead
        of noisy AI guesses.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-8 flex items-center gap-3"
      >
        <Button size="lg" asChild>
          <Link href="/dashboard">
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="#features">See features</Link>
        </Button>
      </motion.div>
    </section>
  );
}
