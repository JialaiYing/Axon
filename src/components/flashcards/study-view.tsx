"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedList } from "@/components/ui/animated-list";
import type { Flashcard, FlashcardSet } from "@/types";
import {
  clampLeitnerBox,
  intervalDaysForBox,
} from "@/lib/flashcards/leitner";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface StudyCardContext {
  setTitle: string;
  subject: string;
}

interface StudyViewProps {
  set: FlashcardSet;
  onBack: () => void;
  onEdit?: () => void;
  onStartTest?: () => void;
  /** Fired once per set, the first time every card's back has been seen this session (browse mode). */
  onCompletePass?: () => void;
  /**
   * Leitner review: after flip, Know / Forgot grades the card and advances.
   * Browse (default) keeps flip-through navigation without scheduling.
   */
  reviewMode?: boolean;
  /** Called when the learner grades a card in review mode. */
  onReview?: (cardId: string, knew: boolean) => void;
  /** Optional header override (e.g. "Due today"). */
  title?: string;
  subtitle?: string;
  /** Per-card set context for cross-set due Study. */
  cardContextById?: Record<string, StudyCardContext>;
  /** Hint line for the session-end summary (e.g. next due across library). */
  summaryNextHint?: string | null;
}

export function StudyView({
  set,
  onBack,
  onEdit,
  onStartTest,
  onCompletePass,
  reviewMode = false,
  onReview,
  title,
  subtitle,
  cardContextById,
  summaryNextHint,
}: StudyViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const topRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [direction, setDirection] = React.useState(1);
  const [queue, setQueue] = React.useState<Flashcard[]>(() => set.cards);
  const sessionTotal = React.useRef(set.cards.length);
  const [knewCount, setKnewCount] = React.useState(0);
  const [forgotCount, setForgotCount] = React.useState(0);
  const [lastGradeCue, setLastGradeCue] = React.useState<string | null>(null);
  const [showSummary, setShowSummary] = React.useState(false);

  const cards = reviewMode ? queue : set.cards;
  const card = cards[Math.min(index, Math.max(0, cards.length - 1))];
  const reviewedCount = sessionTotal.current - queue.length;
  const cardContext = card && cardContextById ? cardContextById[card.id] : undefined;

  const viewedBackIds = React.useRef<Set<string>>(new Set());
  const completedFiredRef = React.useRef(false);

  React.useEffect(() => {
    viewedBackIds.current = new Set();
    completedFiredRef.current = false;
    setIndex(0);
    setFlipped(false);
    setDirection(1);
    setQueue(set.cards);
    sessionTotal.current = set.cards.length;
    setKnewCount(0);
    setForgotCount(0);
    setLastGradeCue(null);
    setShowSummary(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per session id
  }, [set.id]);

  React.useEffect(() => {
    if (
      reviewMode &&
      queue.length === 0 &&
      sessionTotal.current > 0 &&
      !showSummary
    ) {
      setShowSummary(true);
    }
  }, [reviewMode, queue.length, showSummary]);

  const flip = React.useCallback(() => {
    setFlipped((prev) => {
      const next = !prev;
      if (next && card && !reviewMode) {
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
  }, [card, cards.length, onCompletePass, reviewMode]);

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

  const grade = React.useCallback(
    (knew: boolean) => {
      if (!reviewMode || !card || !onReview) return;
      const currentBox = clampLeitnerBox(card.box);
      const nextBox = knew
        ? Math.min(5, currentBox + 1)
        : 1;
      const days = intervalDaysForBox(nextBox);
      setLastGradeCue(
        days === 0 ? "Back in box 1 · due again soon" : `Next review in ${days} day${days === 1 ? "" : "s"}`
      );
      onReview(card.id, knew);
      if (knew) setKnewCount((n) => n + 1);
      else setForgotCount((n) => n + 1);
      setQueue((prev) => {
        const next = prev.filter((c) => c.id !== card.id);
        setFlipped(false);
        setDirection(1);
        setIndex(0);
        return next;
      });
    },
    [reviewMode, card, onReview]
  );

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (showSummary) return;
      if (reviewMode && flipped && (e.key === "1" || e.key === "2")) {
        e.preventDefault();
        grade(e.key === "1");
        return;
      }
      if (e.key === "ArrowRight" && !reviewMode) {
        e.preventDefault();
        goTo(index + 1, 1);
      } else if (e.key === "ArrowLeft" && !reviewMode) {
        e.preventDefault();
        goTo(index - 1, -1);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, flip, reviewMode, flipped, grade, showSummary]);

  React.useEffect(() => {
    if (index > 0 && index >= cards.length) setIndex(Math.max(0, cards.length - 1));
  }, [cards.length, index]);

  const heading = title ?? set.title;
  const sub =
    subtitle ??
    (reviewMode
      ? `${Math.max(0, sessionTotal.current - reviewedCount)} remaining`
      : `${set.subject} · ${cards.length} card${cards.length === 1 ? "" : "s"}`);

  if (showSummary) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
            Session complete
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {sessionTotal.current} card{sessionTotal.current === 1 ? "" : "s"} reviewed
          </p>
        </div>
        <div className="grid w-full max-w-xs grid-cols-2 gap-2">
          <div className="rounded-md border border-border/50 px-3 py-2.5 light:border-border">
            <p className="font-mono text-2xl font-medium tabular-nums text-foreground">
              {knewCount}
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Knew it</p>
          </div>
          <div className="rounded-md border border-border/50 px-3 py-2.5 light:border-border">
            <p className="font-mono text-2xl font-medium tabular-nums text-foreground">
              {forgotCount}
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Forgot</p>
          </div>
        </div>
        {summaryNextHint ? (
          <p className="max-w-sm text-[14px] text-muted-foreground">{summaryNextHint}</p>
        ) : (
          <p className="max-w-sm text-[14px] text-muted-foreground">Caught up for now</p>
        )}
        <Button size="sm" className="cursor-pointer" onClick={onBack}>
          Back to library
        </Button>
      </div>
    );
  }

  return (
    <div ref={topRef} className="flex h-full flex-col">
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
            <h2 className="truncate text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
              {heading}
            </h2>
            <p className="truncate text-[14px] text-muted-foreground">{sub}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onStartTest && !reviewMode && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer shadow-none"
              disabled={cards.length === 0}
              onClick={onStartTest}
            >
              <ListChecks className="h-3.5 w-3.5" /> Test
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer shadow-none"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      {!card ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-[14px] text-muted-foreground">
            {reviewMode ? "Nothing due right now" : "This set has no cards yet"}
          </p>
          {onEdit && !reviewMode ? (
            <Button size="sm" className="cursor-pointer" onClick={onEdit}>
              <Plus className="h-3.5 w-3.5" /> Add your first card
            </Button>
          ) : (
            <Button size="sm" className="cursor-pointer" onClick={onBack}>
              Back to library
            </Button>
          )}
        </div>
      ) : (
        <>
          {(cardContext || (reviewMode && flipped)) && (
            <div className="mx-auto mb-2 flex w-full max-w-3xl shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              {cardContext && (
                <span className="truncate">
                  {cardContext.setTitle}
                  {cardContext.subject?.trim()
                    ? ` · ${cardContext.subject.trim()}`
                    : ""}
                </span>
              )}
              {reviewMode && flipped && (
                <span className="font-mono tabular-nums">
                  Box {clampLeitnerBox(card.box)}
                </span>
              )}
              {lastGradeCue && !flipped && (
                <span className="truncate text-muted-foreground/80">{lastGradeCue}</span>
              )}
            </div>
          )}

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
                    <div
                      style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}
                      className="flex items-center justify-center rounded-md border border-border/60 bg-card p-8 shadow-none light:border-border"
                    >
                      <p className="max-h-full overflow-y-auto text-balance text-center text-xl font-medium leading-relaxed text-foreground md:text-3xl">
                        {card.front}
                      </p>
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                        Click to flip
                      </span>
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                      className="flex items-center justify-center rounded-md border border-border/60 bg-card p-8 shadow-none light:border-border"
                    >
                      <p className="max-h-full overflow-y-auto text-balance text-center text-lg leading-relaxed text-foreground/90 md:text-2xl">
                        {card.back}
                      </p>
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Answer
                      </span>
                    </div>
                  </motion.div>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {reviewMode ? (
            <div className="mx-auto mt-5 flex w-full max-w-3xl shrink-0 flex-col items-center gap-3">
              {flipped ? (
                <div className="flex w-full max-w-md items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 cursor-pointer shadow-none"
                    onClick={() => grade(false)}
                  >
                    <X className="h-4 w-4" /> Forgot
                    <span className="ml-1 font-mono text-[11px] text-muted-foreground">2</span>
                  </Button>
                  <Button
                    type="button"
                    className="h-11 flex-1 cursor-pointer"
                    onClick={() => grade(true)}
                  >
                    <Check className="h-4 w-4" /> Knew it
                    <span className="ml-1 font-mono text-[11px] opacity-70">1</span>
                  </Button>
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Flip the card, then mark Knew it or Forgot
                </p>
              )}
              <div className="w-full">
                <ProgressBar
                  value={
                    sessionTotal.current > 0
                      ? (reviewedCount / sessionTotal.current) * 100
                      : 0
                  }
                  size="sm"
                />
                <p className="mt-1.5 text-center font-mono text-[12px] tabular-nums text-muted-foreground">
                  {reviewedCount} / {sessionTotal.current}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto mt-5 flex w-full max-w-3xl shrink-0 items-center justify-center gap-5">
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer rounded-md"
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
                  className="cursor-pointer rounded-md"
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

              <ScrollReveal className="mx-auto mt-12 w-full max-w-3xl shrink-0 pb-8" y={28}>
                <h3 className="mb-3 text-[11px] font-medium text-muted-foreground">
                  All cards ({cards.length})
                </h3>
                <AnimatedList
                  items={cards}
                  getItemKey={(c) => c.id}
                  listClassName="max-h-[26rem] space-y-1.5"
                  gradientFromClassName="from-background"
                  onItemSelect={(_c, i) => {
                    goTo(i, i > index ? 1 : -1);
                    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  renderItem={(c, i, hovered) => (
                    <div
                      className={cn(
                        "grid w-full cursor-pointer grid-cols-1 gap-3 rounded-md border p-3 text-left transition-colors duration-150 sm:grid-cols-2",
                        i === index
                          ? "border-border bg-wash"
                          : hovered
                            ? "border-border/60 bg-wash"
                            : "border-border/50 bg-transparent light:border-border"
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
        </>
      )}
    </div>
  );
}
