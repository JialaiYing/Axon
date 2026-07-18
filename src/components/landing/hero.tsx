"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import BorderGlow from "@/components/effects/border-glow";
import GradientText from "@/components/effects/gradient-text";
import RotatingText from "@/components/effects/rotating-text";
import BlurText from "@/components/effects/blur-text";
import TextType from "@/components/effects/text-type";

const GLOW_COLORS = ["#A6C8FF", "#5227FF", "#FF9FFC"];

/**
 * Decorative glass shards floating at different depths around the hero copy.
 * Each layer drifts against scroll at its own speed, which is what sells the
 * spatial-composition effect: nearer panes move faster than farther ones.
 */
function SpatialLayers({ scrollYProgress }: { scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const nearY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const farY = useTransform(scrollYProgress, [0, 1], [0, -36]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden md:block">
      {/* Far layer — large, dim, slow */}
      <motion.div style={{ y: farY }} className="absolute left-[8%] top-[22%]">
        <div className="glass-panel h-28 w-44 rounded-2xl opacity-40 [transform:rotate(-8deg)]" />
      </motion.div>
      <motion.div style={{ y: farY }} className="absolute right-[10%] top-[18%]">
        <div className="glass-panel h-20 w-36 rounded-2xl opacity-30 [transform:rotate(10deg)]" />
      </motion.div>

      {/* Mid layer */}
      <motion.div style={{ y: midY }} className="absolute left-[16%] top-[58%]">
        <div className="glass-panel h-16 w-28 rounded-xl opacity-55 [transform:rotate(6deg)]" />
      </motion.div>
      <motion.div style={{ y: midY }} className="absolute right-[18%] top-[62%]">
        <div className="glass-panel h-24 w-24 rounded-2xl opacity-50 [transform:rotate(-12deg)]" />
      </motion.div>

      {/* Near layer — small, bright, fast */}
      <motion.div style={{ y: nearY }} className="absolute left-[27%] top-[34%]">
        <div className="glass-panel h-10 w-10 rounded-lg opacity-70 shadow-[0_0_24px_-6px_rgba(82,39,255,0.6)] [transform:rotate(14deg)]" />
      </motion.div>
      <motion.div style={{ y: nearY }} className="absolute right-[26%] top-[40%]">
        <div className="glass-panel h-8 w-14 rounded-lg opacity-65 shadow-[0_0_24px_-6px_rgba(255,159,252,0.5)] [transform:rotate(-10deg)]" />
      </motion.div>
    </div>
  );
}

export function Hero() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // The copy itself recedes slightly as you scroll past — content sits on a
  // deeper plane than the near glass shards.
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.25]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
    >
      {!prefersReducedMotion && <SpatialLayers scrollYProgress={scrollYProgress} />}

      <motion.div
        style={prefersReducedMotion ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex flex-col items-center"
      >
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
              className="h-11 min-w-[13.25rem] rounded-[9px] border-0 shadow-none hover:shadow-none"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {/* Fixed-width slot so rotating phrases never reflow the button. */}
                <span className="relative inline-flex h-5 w-[9.75rem] shrink-0 items-center justify-center overflow-hidden">
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
      </motion.div>

      {/* Scroll cue pinned to the bottom of the fullscreen hero */}
      <motion.a
        href="#why-axon"
        aria-label="Scroll to learn why Axon exists"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 cursor-pointer text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <motion.span
          animate={prefersReducedMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="text-[11px] uppercase tracking-[0.2em]">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}
