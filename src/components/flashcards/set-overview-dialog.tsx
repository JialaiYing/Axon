"use client";

import { Layers, Pencil, Play, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  boxBreakdown,
  countDueCards,
  formatRelativeDue,
  getNextDueAt,
  type LeitnerBox,
} from "@/lib/flashcards/leitner";
import type { FlashcardSet } from "@/types";

interface SetOverviewDialogProps {
  set: FlashcardSet | null;
  onOpenChange: (open: boolean) => void;
  /** Due-only Study — no-op when nothing due (button disabled). */
  onStudy: (set: FlashcardSet) => void;
  /** Explicit practice of the whole set (still grades / schedules). */
  onPractice: (set: FlashcardSet) => void;
  onEdit: (set: FlashcardSet) => void;
  onTest: (set: FlashcardSet) => void;
}

const BOXES: LeitnerBox[] = [1, 2, 3, 4, 5];

/** Glance panel — schedule first, then actions. */
export function SetOverviewDialog({
  set,
  onOpenChange,
  onStudy,
  onPractice,
  onEdit,
  onTest,
}: SetOverviewDialogProps) {
  if (!set) return null;

  const dueInSet = countDueCards([set]);
  const nextDue = getNextDueAt([set]);
  const boxes = boxBreakdown([set]);
  const mastery =
    set.cards.length > 0
      ? Math.round(set.cards.reduce((sum, c) => sum + c.masteryPercent, 0) / set.cards.length)
      : 0;

  return (
    <Dialog open={!!set} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-8 text-2xl font-medium tracking-tight sm:text-[28px]">
            {set.title}
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            {set.subject || "General"} · {set.cards.length} card
            {set.cards.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border/50 px-3 py-2.5 light:border-border">
            <p className="font-mono text-3xl font-medium tabular-nums tracking-tight text-foreground sm:text-4xl">
              {dueInSet}
            </p>
            <p className="mt-0.5 text-[14px] text-muted-foreground">Due now</p>
          </div>
          <div className="rounded-md border border-border/50 px-3 py-2.5 light:border-border">
            {dueInSet === 0 && nextDue ? (
              <>
                <p className="text-[15px] font-medium leading-snug text-foreground">
                  {formatRelativeDue(nextDue)}
                </p>
                <p className="mt-0.5 text-[14px] text-muted-foreground">Next review</p>
              </>
            ) : dueInSet === 0 ? (
              <>
                <p className="text-[15px] font-medium text-foreground">Caught up</p>
                <p className="mt-0.5 text-[14px] text-muted-foreground">Nothing scheduled</p>
              </>
            ) : (
              <>
                <p className="font-mono text-3xl font-medium tabular-nums tracking-tight text-foreground sm:text-4xl">
                  {mastery}%
                </p>
                <p className="mt-0.5 text-[14px] text-muted-foreground">Mastery</p>
              </>
            )}
          </div>
        </div>

        {set.cards.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {BOXES.map((box) => (
              <span
                key={box}
                className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 font-mono text-[11px] tabular-nums text-muted-foreground light:border-border"
                title={`Box ${box}`}
              >
                B{box}
                <span className="text-foreground">{boxes[box]}</span>
              </span>
            ))}
          </div>
        )}

        {set.description?.trim() && (
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {set.description.trim()}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button
            className="w-full cursor-pointer justify-start shadow-none"
            onClick={() => {
              onStudy(set);
              onOpenChange(false);
            }}
            disabled={dueInSet === 0}
          >
            <Play className="h-4 w-4" />
            {dueInSet > 0 ? `Study · ${dueInSet} due` : "Caught up"}
          </Button>
          {set.cards.length > 0 && (
            <Button
              variant="outline"
              className="w-full cursor-pointer justify-start shadow-none"
              onClick={() => {
                onPractice(set);
                onOpenChange(false);
              }}
            >
              <RotateCw className="h-4 w-4" />
              Practice all
              <span className="ml-auto text-[12px] font-normal text-muted-foreground">
                still schedules
              </span>
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full cursor-pointer justify-start"
            onClick={() => {
              onTest(set);
              onOpenChange(false);
            }}
            disabled={set.cards.length === 0}
          >
            <Layers className="h-4 w-4" />
            Take a test
          </Button>
          <Button
            variant="ghost"
            className="w-full cursor-pointer justify-start text-muted-foreground"
            onClick={() => {
              onEdit(set);
              onOpenChange(false);
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit set &amp; cards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
