"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AnimatedList } from "@/components/ui/animated-list";
import type { FlashcardSet } from "@/types";
import { cn } from "@/lib/utils";

interface SetViewDialogProps {
  set: FlashcardSet | null;
  onOpenChange: (open: boolean) => void;
  onAddCard: (setId: string, input: { front: string; back: string }) => void;
  onDeleteCard: (setId: string, cardId: string) => void;
  onDeleteSet: (id: string) => void;
}

export function SetViewDialog({
  set,
  onOpenChange,
  onAddCard,
  onDeleteCard,
  onDeleteSet,
}: SetViewDialogProps) {
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!set) return null;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!set || !front.trim() || !back.trim()) return;
    onAddCard(set.id, { front: front.trim(), back: back.trim() });
    setFront("");
    setBack("");
  }

  return (
    <>
      <Dialog open={!!set} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{set.title}</DialogTitle>
            <DialogDescription>
              {set.subject} · {set.cards.length} card{set.cards.length === 1 ? "" : "s"}
              {set.description ? ` — ${set.description}` : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} className="rounded-xl border border-border bg-wash p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="card-front">Front</Label>
                <Input
                  id="card-front"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Question or term"
                  maxLength={300}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-back">Back</Label>
                <Input
                  id="card-back"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Answer or definition"
                  maxLength={300}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!front.trim() || !back.trim()}
                className="cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add card
              </Button>
            </div>
          </form>

          {set.cards.length > 0 && (
            <AnimatedList
              className="mt-4"
              listClassName="max-h-60 space-y-2"
              gradientFromClassName="from-card"
              items={set.cards}
              getItemKey={(card) => card.id}
              renderItem={(card, _index, selected) => (
                <div
                  className={cn(
                    "group flex items-start justify-between gap-3 rounded-lg border p-3.5 transition-colors duration-150",
                    selected
                      ? "border-border bg-wash"
                      : "border-border bg-wash"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{card.front}</p>
                    <p className="mt-1 text-xs text-muted">{card.back}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete card"
                    onClick={() => onDeleteCard(set.id, card.id)}
                    className="cursor-pointer rounded-md p-1.5 text-muted opacity-0 transition-all duration-150 hover:bg-danger-muted hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            />
          )}

          <div className="mt-4 flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-danger hover:text-danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Move to recycle bin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Move set to recycle bin?"
        description="This set and its cards will move to the recycle bin. You can restore them within 30 days."
        confirmLabel="Move to recycle bin"
        onConfirm={() => {
          onDeleteSet(set.id);
          setConfirmDelete(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
