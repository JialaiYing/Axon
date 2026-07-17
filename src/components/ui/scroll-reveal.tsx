"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Distance in px the content travels into place. */
  y?: number;
}

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/**
 * Fades/slides a section into place the first time it enters the viewport.
 *
 * `once: true` is intentional: reversing back to opacity 0 when an element
 * leaves view (especially inside the dashboard's nested `overflow-y-auto`
 * main pane, or under PageTransition's AnimatePresence) frequently leaves
 * content stuck invisible after client-side navigations.
 */
export function ScrollReveal({ children, className, delay = 0, y = 24 }: ScrollRevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      variants={{
        hidden: { opacity: 0, y, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ duration: 0.65, delay, ease: EASE }}
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
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ staggerChildren: stagger }}
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
      variants={{
        hidden: { opacity: 0, y, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
