"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import BorderGlow from "@/components/effects/border-glow";
import GradientText from "@/components/effects/gradient-text";
import RotatingText from "@/components/effects/rotating-text";
import BlurText from "@/components/effects/blur-text";
import TextType from "@/components/effects/text-type";

const GLOW_COLORS = ["#A6C8FF", "#5227FF", "#FF9FFC"];

export function Hero() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden px-6 pb-28 pt-32 text-center md:pt-44">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mb-7 flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-muted shadow-[0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-sm"
      >
        <Zap className="h-3.5 w-3.5 text-accent" />
        <BlurText
          text="Built for focus, not features"
          delay={80}
          animateBy="words"
          direction="top"
          className="justify-center text-xs font-medium text-muted"
          as="span"
        />
      </motion.div>

      <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-7xl">
        <BlurText
          text="The study dashboard for staying"
          delay={60}
          animateBy="words"
          direction="top"
          className="justify-center text-5xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-7xl"
          as="span"
        />{" "}
        <GradientText
          colors={["#5227FF", "#FF9FFC", "#B497CF"]}
          animationSpeed={8}
          showBorder={false}
          className="align-baseline text-5xl font-semibold md:text-7xl"
        >
          consistent
        </GradientText>
      </h1>

      <div className="mt-6 max-w-xl text-balance text-base leading-relaxed text-muted md:text-lg">
        <TextType
          text="Axon turns your objectives, flashcards, and focus sessions into one calm, local-first workspace — with statistics-driven insights instead of noisy AI guesses."
          typingSpeed={20}
          showCursor
          cursorCharacter="_"
          startOnVisible
          className="text-base leading-relaxed text-muted md:text-lg"
          as="p"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-10 flex flex-wrap items-center justify-center gap-3"
      >
        <BorderGlow
          asButton
          edgeSensitivity={28}
          glowColor="210 90 75"
          backgroundColor="#1d3a66"
          borderRadius={10}
          glowRadius={28}
          glowIntensity={1}
          coneSpread={25}
          colors={GLOW_COLORS}
          fillOpacity={0.45}
        >
          <Button
            size="lg"
            asChild
            className="rounded-[9px] border-0 shadow-none hover:shadow-none"
          >
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <span className="relative inline-block text-center">
                <span aria-hidden className="invisible whitespace-nowrap">
                  Start Studying
                </span>
                <span className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <RotatingText
                    texts={["Open Dashboard", "Start Studying", "Begin Focus"]}
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={2500}
                    splitBy="characters"
                    auto
                    loop
                    mainClassName="justify-center overflow-hidden"
                  />
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </BorderGlow>
        <BorderGlow
          asButton
          edgeSensitivity={28}
          glowColor="270 80 75"
          backgroundColor="#0f1115"
          borderRadius={10}
          glowRadius={28}
          glowIntensity={0.9}
          coneSpread={25}
          colors={GLOW_COLORS}
          fillOpacity={0.35}
        >
          <Button
            size="lg"
            variant="outline"
            asChild
            className="rounded-[9px] border-border/60 bg-transparent shadow-none hover:shadow-none"
          >
            <Link href="#features">See features</Link>
          </Button>
        </BorderGlow>
      </motion.div>
    </section>
  );
}
