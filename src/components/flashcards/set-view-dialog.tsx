"use client";

import * as React from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AnimatedList } from "@/components/ui/animated-list";
import type { FlashcardSet } from "@/types";
import { cn } from "@/lib/utils";

interface SetViewDialogProps {
  set: FlashcardSet | null;
  onOpenChange: (open: boolean) => void;
  onAddCard: (setId: string, input: { front: string; back: string }) => void;
  onUpdateCard: (
    setId: string,
    cardId: string,
    patch: { front: string; back: string }
  ) => void;
  onDeleteCard: (setId: string, cardId: string) => void;
  onUpdateSet: (
    id: string,
    patch: { title: string; subject: string; description?: string }
  ) => void;
  onDeleteSet: (id: string) => void;
}

export function SetViewDialog({
  set,
  onOpenChange,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onUpdateSet,
  onDeleteSet,
}: SetViewDialogProps) {
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const [metaTitle, setMetaTitle] = React.useState("");
  const [metaSubject, setMetaSubject] = React.useState("");
  const [metaDescription, setMetaDescription] = React.useState("");
  const [metaDirty, setMetaDirty] = React.useState(false);

  const [editingCardId, setEditingCardId] = React.useState<string | null>(null);
  const [editFront, setEditFront] = React.useState("");
  const [editBack, setEditBack] = React.useState("");

  const setId = set?.id;

  React.useEffect(() => {
    if (!set || !setId) return;
    setMetaTitle(set.title);
    setMetaSubject(set.subject);
    setMetaDescription(set.description ?? "");
    setMetaDirty(false);
    setEditingCardId(null);
    setFront("");
    setBack("");
    // Intentionally only when opening a different set — not on every card mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed from set when setId changes
  }, [setId]);

  if (!set) return null;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!set || !front.trim() || !back.trim()) return;
    onAddCard(set.id, { front: front.trim(), back: back.trim() });
    setFront("");
    setBack("");
  }

  function handleSaveMeta() {
    if (!set || !metaTitle.trim()) return;
    onUpdateSet(set.id, {
      title: metaTitle.trim(),
      subject: metaSubject.trim() || "General",
      description: metaDescription.trim() || undefined,
    });
    setMetaDirty(false);
  }

  function startEditCard(cardId: string, cardFront: string, cardBack: string) {
    setEditingCardId(cardId);
    setEditFront(cardFront);
    setEditBack(cardBack);
  }

  function saveEditCard() {
    if (!set || !editingCardId || !editFront.trim() || !editBack.trim()) return;
    onUpdateCard(set.id, editingCardId, {
      front: editFront.trim(),
      back: editBack.trim(),
    });
    setEditingCardId(null);
  }

  return (
    <>
      <Dialog open={!!set} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit set</DialogTitle>
            <DialogDescription>
              Change title and cards. Editing text keeps each card&apos;s review schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-md border border-border/50 p-3 light:border-border">
            <div className="space-y-1.5">
              <Label htmlFor="set-title">Title</Label>
              <Input
                id="set-title"
                value={metaTitle}
                onChange={(e) => {
                  setMetaTitle(e.target.value);
                  setMetaDirty(true);
                }}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-subject">Subject</Label>
              <Input
                id="set-subject"
                value={metaSubject}
                onChange={(e) => {
                  setMetaSubject(e.target.value);
                  setMetaDirty(true);
                }}
                maxLength={80}
                placeholder="General"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-description">Description</Label>
              <Textarea
                id="set-description"
                value={metaDescription}
                onChange={(e) => {
                  setMetaDescription(e.target.value);
                  setMetaDirty(true);
                }}
                rows={2}
                maxLength={400}
                placeholder="Optional"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="cursor-pointer shadow-none"
                disabled={!metaDirty || !metaTitle.trim()}
                onClick={handleSaveMeta}
              >
                Save set details
              </Button>
            </div>
          </div>

          <form onSubmit={handleAdd} className="rounded-md border border-border/50 bg-wash p-4 light:border-border">
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
              className="mt-2"
              listClassName="max-h-60 space-y-2"
              gradientFromClassName="from-card"
              items={set.cards}
              getItemKey={(card) => card.id}
              renderItem={(card, _index, selected) => {
                const editing = editingCardId === card.id;
                return (
                  <div
                    className={cn(
                      "rounded-lg border p-3.5 transition-colors duration-150",
                      selected || editing
                        ? "border-border bg-wash"
                        : "border-border/50 bg-transparent light:border-border"
                    )}
                  >
                    {editing ? (
                      <div className="space-y-2">
                        <Input
                          value={editFront}
                          onChange={(e) => setEditFront(e.target.value)}
                          aria-label="Edit front"
                          maxLength={300}
                        />
                        <Input
                          value={editBack}
                          onChange={(e) => setEditBack(e.target.value)}
                          aria-label="Edit back"
                          maxLength={300}
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="cursor-pointer"
                            onClick={() => setEditingCardId(null)}
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="cursor-pointer shadow-none"
                            disabled={!editFront.trim() || !editBack.trim()}
                            onClick={saveEditCard}
                          >
                            <Check className="h-3.5 w-3.5" /> Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{card.front}</p>
                          <p className="mt-1 text-xs text-muted">{card.back}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            aria-label="Edit card"
                            onClick={() => startEditCard(card.id, card.front, card.back)}
                            className="cursor-pointer rounded-md p-1.5 text-muted opacity-0 transition-all duration-150 hover:bg-wash hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete card"
                            onClick={() => onDeleteCard(set.id, card.id)}
                            className="cursor-pointer rounded-md p-1.5 text-muted opacity-0 transition-all duration-150 hover:bg-danger-muted hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
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
