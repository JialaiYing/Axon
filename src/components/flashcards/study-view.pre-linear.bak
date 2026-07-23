"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, ListChecks, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedList } from "@/components/ui/animated-list";
import type { FlashcardSet } from "@/types";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface StudyViewProps {
  set: FlashcardSet;
  onBack: () => void;
  onEdit: () => void;
  onStartTest: () => void;
  /** Fired once per set, the first time every card's back has been seen this session. */
  onCompletePass?: () => void;
}

export function StudyView({ set, onBack, onEdit, onStartTest, onCompletePass }: StudyViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const topRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  /** +1 when moving forward, -1 backward — drives the slide direction. */
  const [direction, setDirection] = React.useState(1);

  const cards = set.cards;
  const card = cards[Math.min(index, cards.length - 1)];

  // Tracks which cards have had their back revealed this session, so a full
  // pass through the deck (in any order) can fire onCompletePass exactly once.
  const viewedBackIds = React.useRef<Set<string>>(new Set());
  const completedFiredRef = React.useRef(false);

  React.useEffect(() => {
    viewedBackIds.current = new Set();
    completedFiredRef.current = false;
  }, [set.id]);

  const flip = React.useCallback(() => {
    setFlipped((prev) => {
      const next = !prev;
      if (next && card) {
        viewedBackIds.current.add(card.id);
        if (
          !completedFiredRef.current &&
          cards.length > 0 &&
          viewedBackIds.current.size >= cards.length
        ) {
          completedFiredRef.current = true;
          onCompletePass?.();
        }
      }
      return next;
    });
  }, [card, cards.length, onCompletePass]);

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
        flip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, flip]);

  // Keep index valid if cards are deleted while studying.
  React.useEffect(() => {
    if (index > 0 && index >= cards.length) setIndex(Math.max(0, cards.length - 1));
  }, [cards.length, index]);

  return (
    <div ref={topRef} className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
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
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={cards.length === 0}
            onClick={onStartTest}
          >
            <ListChecks className="h-3.5 w-3.5" /> Test
          </Button>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
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
          {/* Big card — fills essentially the whole panel instead of a slice
              of it, so studying reads as one focused surface, not a small
              flashcard floating above a lot of empty space. */}
          <div className="perspective-1200 relative mx-auto min-h-[clamp(360px,calc(100dvh-24rem),640px)] w-full max-w-3xl flex-1">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={card.id}
                custom={direction}
                className="absolute inset-0"
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
                  onClick={flip}
                  className="block h-full w-full cursor-pointer"
                >
                  {/*
                    Rotating around the Y-axis flips the card left/right, like
                    turning a page, so it visually stays put in the same spot
                    — rotating around X (top-over-bottom) reads as the whole
                    card tumbling away from its position instead.
                  */}
                  <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.45, ease: EASE }
                    }
                    style={{ transformStyle: "preserve-3d" }}
                    className="relative h-full w-full"
                  >
                    {/* Front — position is set inline because Panel's base
                        `relative` would otherwise fight Tailwind absolute. */}
                    <div
                      style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}
                      className="shadow-[var(--shadow-elevation-2),inset_0_1px_0_rgba(255,255,255,0.05)] light:shadow-[var(--shadow-elevation-2)] flex items-center justify-center rounded-xl border border-border bg-card p-8"
                    >
                      <p className="max-h-full overflow-y-auto text-balance text-center text-xl font-medium leading-relaxed text-foreground md:text-3xl">
                        {card.front}
                      </p>
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                        Click to flip
                      </span>
                    </div>
                    {/* Back */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                      className="shadow-[var(--shadow-elevation-2),inset_0_1px_0_rgba(255,255,255,0.05)] light:shadow-[var(--shadow-elevation-2)] flex items-center justify-center rounded-xl border border-accent/30 bg-card p-8"
                    >
                      <p className="max-h-full overflow-y-auto text-balance text-center text-lg leading-relaxed text-foreground/90 md:text-2xl">
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
          <div className="mx-auto mt-5 flex w-full max-w-3xl shrink-0 items-center justify-center gap-5">
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
            <span className="min-w-16 text-center font-mono text-sm font-medium tabular-nums text-muted-foreground">
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
          <div className="mx-auto mt-4 w-full max-w-3xl shrink-0">
            <ProgressBar value={((index + 1) / cards.length) * 100} size="sm" />
          </div>

          {/* All cards below, Quizlet-style */}
          <ScrollReveal className="mx-auto mt-12 w-full max-w-3xl shrink-0 pb-8" y={28}>
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
