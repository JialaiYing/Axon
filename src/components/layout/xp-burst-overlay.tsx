"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { subscribeXpAwards, type XpAwardPayload } from "@/lib/progress/xp-events";
import { EASE } from "@/lib/motion";

type FlyingXp = XpAwardPayload & {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

type BurstParticle = {
  id: string;
  awardId: string;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  fromX: number;
  fromY: number;
};

function dashboardTargetCenter(): { x: number; y: number } | null {
  const el = document.querySelector<HTMLElement>('[data-xp-target="dashboard"]');
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function makeParticles(awardId: string, fromX: number, fromY: number, count = 10): BurstParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.35 - 0.175);
    return {
      id: `${awardId}-p${i}`,
      awardId,
      angle,
      distance: 42 + Math.random() * 56,
      size: 4 + Math.random() * 5,
      delay: Math.random() * 0.08,
      fromX,
      fromY,
    };
  });
}

/**
 * Signature reward moment: XP pops as a burst, then the total flies to Dashboard.
 */
export function XpBurstOverlay() {
  const prefersReducedMotion = useReducedMotion();
  const [flights, setFlights] = React.useState<FlyingXp[]>([]);
  const [particles, setParticles] = React.useState<BurstParticle[]>([]);
  const [pulse, setPulse] = React.useState(false);

  React.useEffect(() => {
    return subscribeXpAwards((payload) => {
      const target = dashboardTargetCenter();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const fromX = vw * 0.5 + (Math.random() * 60 - 30);
      const fromY = vh * 0.4 + (Math.random() * 40 - 20);
      const toX = target?.x ?? 40;
      const toY = target?.y ?? 120;

      if (prefersReducedMotion) {
        setFlights((prev) => [...prev, { ...payload, fromX: toX, fromY: toY, toX, toY }]);
        window.setTimeout(() => {
          setFlights((prev) => prev.filter((f) => f.id !== payload.id));
          setPulse(true);
        }, 700);
        return;
      }

      setParticles((prev) => [...prev, ...makeParticles(payload.id, fromX, fromY)]);
      setFlights((prev) => [...prev, { ...payload, fromX, fromY, toX, toY }]);
    });
  }, [prefersReducedMotion]);

  React.useEffect(() => {
    if (!pulse) return;
    const id = window.setTimeout(() => setPulse(false), 520);
    return () => window.clearTimeout(id);
  }, [pulse]);

  React.useEffect(() => {
    if (!pulse) return;
    const el = document.querySelector<HTMLElement>('[data-xp-target="dashboard"]');
    if (!el) return;
    el.dataset.xpPulse = "true";
    const id = window.setTimeout(() => {
      delete el.dataset.xpPulse;
    }, 520);
    return () => {
      window.clearTimeout(id);
      delete el.dataset.xpPulse;
    };
  }, [pulse]);

  function clearAward(awardId: string) {
    setFlights((prev) => prev.filter((f) => f.id !== awardId));
    setParticles((prev) => prev.filter((p) => p.awardId !== awardId));
    setPulse(true);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" aria-hidden>
      <AnimatePresence>
        {particles.map((particle) => {
          const dx = Math.cos(particle.angle) * particle.distance;
          const dy = Math.sin(particle.angle) * particle.distance;
          return (
            <motion.span
              key={particle.id}
              className="absolute left-0 top-0 rounded-full bg-accent shadow-[0_0_12px_rgba(94,106,210,0.65)]"
              style={{
                width: particle.size,
                height: particle.size,
                marginLeft: -particle.size / 2,
                marginTop: -particle.size / 2,
              }}
              initial={{
                opacity: 0,
                x: particle.fromX,
                y: particle.fromY,
                scale: 0.4,
              }}
              animate={{
                opacity: [0, 1, 0.85, 0],
                x: [particle.fromX, particle.fromX + dx * 0.55, particle.fromX + dx],
                y: [particle.fromY, particle.fromY + dy * 0.55, particle.fromY + dy],
                scale: [0.4, 1.15, 0.6],
              }}
              transition={{
                duration: 0.55,
                delay: particle.delay,
                ease: EASE,
                times: [0, 0.35, 1],
              }}
            />
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {flights.map((flight) => (
          <motion.div
            key={flight.id}
            className="absolute left-0 top-0"
            initial={{
              opacity: 0,
              x: flight.fromX,
              y: flight.fromY,
              scale: 0.45,
            }}
            animate={
              prefersReducedMotion
                ? { opacity: [0, 1, 0], scale: [0.9, 1.08, 0.95] }
                : {
                    opacity: [0, 1, 1, 1, 0.9],
                    x: [flight.fromX, flight.fromX, flight.fromX, flight.toX],
                    y: [flight.fromY, flight.fromY - 10, flight.fromY - 22, flight.toY],
                    scale: [0.45, 1.28, 1.05, 0.42],
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.7, ease: EASE }
                : {
                    duration: 1.25,
                    times: [0, 0.18, 0.38, 1],
                    ease: EASE,
                  }
            }
            onAnimationComplete={() => clearAward(flight.id)}
          >
            <span className="-translate-x-1/2 -translate-y-1/2 relative inline-flex items-center">
              {!prefersReducedMotion && (
                <motion.span
                  className="absolute inset-0 -m-3 rounded-full bg-accent/25 blur-md"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 0.9, 0.35, 0], scale: [0.6, 1.4, 1.8, 2.1] }}
                  transition={{ duration: 0.7, ease: EASE }}
                />
              )}
              <span className="relative inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-muted/95 px-3 py-1.5 text-sm font-semibold tabular-nums tracking-tight text-accent shadow-[0_0_24px_rgba(94,106,210,0.35),var(--shadow-elevation-2)] backdrop-blur-sm">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent/80">+</span>
                {flight.amount}
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent/75">XP</span>
              </span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
