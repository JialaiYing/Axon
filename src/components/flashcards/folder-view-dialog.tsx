"use client";

import * as React from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { FlashcardFolder, FlashcardSet } from "@/types";

interface FolderViewDialogProps {
  folder: FlashcardFolder | null;
  sets: FlashcardSet[];
  onOpenChange: (open: boolean) => void;
  onOpenSet: (set: FlashcardSet) => void;
  onNewSet: () => void;
  onDeleteFolder: (id: string) => void;
}

export function FolderViewDialog({
  folder,
  sets,
  onOpenChange,
  onOpenSet,
  onNewSet,
  onDeleteFolder,
}: FolderViewDialogProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!folder) return null;

  return (
    <>
      <Dialog open={!!folder} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 shrink-0 rounded-sm"
                style={{ backgroundColor: folder.color }}
              />
              <DialogTitle>{folder.title}</DialogTitle>
            </div>
            <DialogDescription>
              {sets.length} set{sets.length === 1 ? "" : "s"} in this folder
            </DialogDescription>
          </DialogHeader>

          {sets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
              <Layers className="h-6 w-6 text-muted" />
              <p className="text-sm text-muted">No sets in this folder yet</p>
            </div>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {sets.map((set) => {
                const mastery =
                  set.cards.length > 0
                    ? Math.round(
                        set.cards.reduce((sum, c) => sum + c.masteryPercent, 0) / set.cards.length
                      )
                    : 0;
                return (
                  <li key={set.id}>
                    <button
                      type="button"
                      onClick={() => onOpenSet(set)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface/60 p-3.5 text-left transition-colors duration-200 hover:border-border-strong hover:bg-card-hover"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{set.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {set.subject} · {set.cards.length} card{set.cards.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Badge variant={mastery >= 70 ? "success" : mastery >= 40 ? "warning" : "default"}>
                        {mastery}% mastery
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-danger hover:text-danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete folder
            </Button>
            <Button size="sm" className="cursor-pointer" onClick={onNewSet}>
              <Plus className="h-3.5 w-3.5" /> New set
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this folder?"
        description="Sets inside it won't be deleted — they'll become unfiled."
        confirmLabel="Delete folder"
        onConfirm={() => {
          onDeleteFolder(folder.id);
          setConfirmDelete(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
