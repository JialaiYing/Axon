"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedList } from "@/components/ui/animated-list";
import type { FlashcardSet } from "@/types";
import { cn } from "@/lib/utils";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

interface StudyViewProps {
  set: FlashcardSet;
  onBack: () => void;
  onEdit: () => void;
}

export function StudyView({ set, onBack, onEdit }: StudyViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const topRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  /** +1 when moving forward, -1 backward — drives the slide direction. */
  const [direction, setDirection] = React.useState(1);

  const cards = set.cards;
  const card = cards[Math.min(index, cards.length - 1)];

  const goTo = React.useCallback(
    (next: number, dir: number) => {
      if (cards.length === 0) return;
      const clamped = Math.min(Math.max(next, 0), cards.length - 1);
      if (clamped === index) return;
      setDirection(dir);
      setFlipped(false);
      setIndex(clamped);
    },
    [cards.length, index]
  );

  // Arrow keys navigate, Space/Enter flips — Quizlet-style keyboard control.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1, 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1, -1);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  // Keep index valid if cards are deleted while studying.
  React.useEffect(() => {
    if (index > 0 && index >= cards.length) setIndex(Math.max(0, cards.length - 1));
  }, [cards.length, index]);

  return (
    <div ref={topRef} className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 cursor-pointer"
            onClick={onBack}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Library
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{set.title}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {set.subject} · {cards.length} card{cards.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 cursor-pointer" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </div>

      {!card ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">This set has no cards yet</p>
          <Button size="sm" className="cursor-pointer" onClick={onEdit}>
            <Plus className="h-3.5 w-3.5" /> Add your first card
          </Button>
        </div>
      ) : (
        <>
          {/* Big card */}
          <div className="perspective-1200 relative mx-auto w-full max-w-2xl">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={card.id}
                custom={direction}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: direction * 80, scale: 0.97 }
                }
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: -direction * 80, scale: 0.97 }
                }
                transition={{ duration: 0.28, ease: EASE }}
              >
                <button
                  type="button"
                  aria-label={flipped ? "Show front of card" : "Show back of card"}
                  onClick={() => setFlipped((f) => !f)}
                  className="perspective-1200 block h-72 w-full cursor-pointer md:h-80"
                >
                  <motion.div
                    animate={{ rotateX: flipped ? 180 : 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.45, ease: EASE }
                    }
                    style={{ transformStyle: "preserve-3d" }}
                    className="relative h-full w-full"
                  >
                    {/* Front */}
                    <div
                      style={{ backfaceVisibility: "hidden" }}
                      className="glass-panel absolute inset-0 flex items-center justify-center rounded-2xl p-8"
                    >
                      <p className="max-h-full overflow-y-auto text-balance text-center text-xl font-medium leading-relaxed text-foreground md:text-2xl">
                        {card.front}
                      </p>
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                        Click to flip
                      </span>
                    </div>
                    {/* Back */}
                    <div
                      style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
                      className="glass-panel absolute inset-0 flex items-center justify-center rounded-2xl border-accent/30 p-8"
                    >
                      <p className="max-h-full overflow-y-auto text-balance text-center text-lg leading-relaxed text-foreground/90 md:text-xl">
                        {card.back}
                      </p>
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-accent/70">
                        Answer
                      </span>
                    </div>
                  </motion.div>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mx-auto mt-5 flex w-full max-w-2xl items-center justify-center gap-5">
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer rounded-full"
              disabled={index === 0}
              onClick={() => goTo(index - 1, -1)}
              aria-label="Previous card"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-16 text-center text-sm font-medium tabular-nums text-muted-foreground">
              {index + 1} / {cards.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer rounded-full"
              disabled={index === cards.length - 1}
              onClick={() => goTo(index + 1, 1)}
              aria-label="Next card"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mx-auto mt-4 w-full max-w-2xl">
            <ProgressBar value={((index + 1) / cards.length) * 100} size="sm" />
          </div>

          {/* All cards below, Quizlet-style */}
          <ScrollReveal className="mx-auto mt-12 w-full max-w-2xl pb-8" y={28}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              All cards ({cards.length})
            </h3>
            <AnimatedList
              items={cards}
              getItemKey={(c) => c.id}
              listClassName="max-h-[26rem] space-y-2.5"
              gradientFromClassName="from-background"
              onItemSelect={(_c, i) => {
                goTo(i, i > index ? 1 : -1);
                topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              renderItem={(c, i, hovered) => (
                <div
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-1 gap-3 rounded-xl border p-4 text-left transition-all duration-200 sm:grid-cols-2",
                    i === index
                      ? "border-accent/40 bg-accent-muted/30"
                      : hovered
                        ? "border-foreground/15 bg-foreground/[0.05]"
                        : "border-border bg-foreground/[0.02]"
                  )}
                >
                  <p className="text-sm font-medium text-foreground sm:border-r sm:border-border sm:pr-3">
                    {c.front}
                  </p>
                  <p className="text-sm text-muted-foreground">{c.back}</p>
                </div>
              )}
            />
          </ScrollReveal>
        </>
      )}
    </div>
  );
}
