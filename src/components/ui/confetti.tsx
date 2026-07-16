"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"];

interface ConfettiBurstProps {
  /** Increment this number to trigger a new burst. */
  triggerKey: number;
}

/**
 * A small, dependency-free confetti burst that fires from the center of
 * its container. Meant for short celebratory moments (completing an
 * objective, finishing a focus session) — not a persistent element.
 */
export function ConfettiBurst({ triggerKey }: ConfettiBurstProps) {
  const pieces = React.useMemo(() => {
    if (triggerKey === 0) return [];
    return Array.from({ length: 24 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
      const distance = 60 + Math.random() * 90;
      return {
        id: `${triggerKey}-${i}`,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 30,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.08,
        size: 5 + Math.random() * 4,
      };
    });
  }, [triggerKey]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.span
            key={piece.id}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
            animate={{ opacity: 0, x: piece.x, y: piece.y + 40, rotate: piece.rotate, scale: 0.6 }}
            transition={{ duration: 0.9, delay: piece.delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: piece.size,
              height: piece.size * 1.6,
              backgroundColor: piece.color,
              borderRadius: 1,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}