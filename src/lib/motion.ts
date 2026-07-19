/**
 * Shared motion language for the whole app — one easing curve, one set of
 * durations, one spring feel. Every entrance/hover/tilt animation should
 * pull from here instead of hand-rolling its own numbers, so switching
 * between sections never feels like switching products.
 *
 * Motion budget (biggest to smallest): Hero > Nav > Cards > Buttons > Background.
 */

/** The one easing curve used everywhere — a soft, confident deceleration. */
export const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export const DURATION = {
  /** Micro-interactions: hovers, toggles, icon nudges. */
  fast: 0.15,
  /** Default UI transitions: dialogs, dropdowns, small reveals. */
  base: 0.28,
  /** Section/page entrances. */
  section: 0.55,
} as const;

export const STAGGER = {
  tight: 0.06,
  base: 0.08,
  loose: 0.1,
} as const;

/** Spring presets — one feel for pointer-driven motion (tilt, magnetic, drag). */
export const SPRING = {
  hover: { type: "spring" as const, stiffness: 300, damping: 24 },
  tilt: { type: "spring" as const, stiffness: 300, damping: 22 },
  enter: { type: "spring" as const, stiffness: 260, damping: 26 },
  magnetic: { type: "spring" as const, stiffness: 200, damping: 18 },
} as const;

/** Hover lift — how far cards/buttons rise toward the viewer. Keep this small. */
export const HOVER_LIFT_PX = 3;

/** Standard entrance variants: opacity + a small upward drift + a hair of scale. */
export const enterVariants = (y = 12) => ({
  hidden: { opacity: 0, y, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
});

export const enterTransition = (delay = 0) => ({
  duration: DURATION.section,
  delay,
  ease: EASE,
});

/** For lists — pass to a parent motion element's `transition`. */
export const staggerContainer = (stagger: number = STAGGER.base) => ({
  staggerChildren: stagger,
});
