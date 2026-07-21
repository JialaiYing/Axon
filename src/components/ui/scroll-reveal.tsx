"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASE, STAGGER, enterVariants } from "@/lib/motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Distance in px the content travels into place. */
  y?: number;
}

/**
 * Fades/slides a section into place the first time it enters the viewport.
 *
 * `once: true` is intentional: reversing back to opacity 0 when an element
 * leaves view (especially inside the dashboard's nested `overflow-y-auto`
 * main pane, or under PageTransition's AnimatePresence) frequently leaves
 * content stuck invisible after client-side navigations.
 */
export function ScrollReveal({ children, className, delay = 0, y = 24 }: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      variants={enterVariants(y)}
      transition={{ duration: DURATION.section, delay, ease: EASE }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wraps a list of children and staggers their entrance as the container
 * scrolls into view. Use for grids like the features section.
 */
export function ScrollRevealGroup({
  children,
  className,
  stagger = STAGGER.base,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ staggerChildren: prefersReducedMotion ? 0 : stagger }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  className,
  y = 20,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      variants={enterVariants(y)}
      transition={{ duration: DURATION.base, ease: EASE }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
