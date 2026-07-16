"use client";

import * as React from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * Animates a number counting up from 0 to `value` once it scrolls into
 * view. Use for dashboard stats, landing-page proof points, etc.
 */
export function AnimatedCounter({
  value,
  duration = 1.4,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = React.useState("0");

  React.useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, motionValue, value]);

  React.useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(latest.toFixed(decimals));
    });
    return unsubscribe;
  }, [spring, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}