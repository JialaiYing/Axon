"use client";

import { Layers, Pencil, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FlashcardSet } from "@/types";

interface SetOverviewDialogProps {
  set: FlashcardSet | null;
  onOpenChange: (open: boolean) => void;
  onStudy: (set: FlashcardSet) => void;
  onEdit: (set: FlashcardSet) => void;
  onTest: (set: FlashcardSet) => void;
}

/** Glance panel before Study — mastery, counts, then primary actions. */
export function SetOverviewDialog({
  set,
  onOpenChange,
  onStudy,
  onEdit,
  onTest,
}: SetOverviewDialogProps) {
  if (!set) return null;

  const mastery =
    set.cards.length > 0
      ? Math.round(set.cards.reduce((sum, c) => sum + c.masteryPercent, 0) / set.cards.length)
      : 0;

  return (
    <Dialog open={!!set} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-8">{set.title}</DialogTitle>
          <DialogDescription>
            {set.subject || "General"} · {set.cards.length} card
            {set.cards.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <p className="font-mono text-lg font-semibold tabular-nums text-foreground">{mastery}%</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              Mastery
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {set.cards.length}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              Cards
            </p>
          </div>
        </div>

        {set.description?.trim() && (
          <p className="text-sm leading-relaxed text-muted-foreground">{set.description.trim()}</p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button
            className="w-full cursor-pointer justify-start"
            onClick={() => {
              onStudy(set);
              onOpenChange(false);
            }}
            disabled={set.cards.length === 0}
          >
            <Play className="h-4 w-4" />
            Study
          </Button>
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
            Edit cards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
