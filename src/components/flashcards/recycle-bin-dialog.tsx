"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Layers, Trash2, RotateCcw, Inbox } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { formatCreatedDate, daysUntilPermanentDelete } from "@/lib/kanban-utils";
import type { FlashcardFolder, FlashcardSet } from "@/types";

type RecycledItem =
  | { kind: "folder"; item: FlashcardFolder }
  | { kind: "set"; item: FlashcardSet };

interface FlashcardsRecycleBinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FlashcardFolder[];
  sets: FlashcardSet[];
  onRestoreFolder: (folder: FlashcardFolder) => void;
  onRestoreSet: (set: FlashcardSet) => void;
  onDeleteForeverFolder: (folder: FlashcardFolder) => void;
  onDeleteForeverSet: (set: FlashcardSet) => void;
  onClearAll: () => void;
}

export function FlashcardsRecycleBinDialog({
  open,
  onOpenChange,
  folders,
  sets,
  onRestoreFolder,
  onRestoreSet,
  onDeleteForeverFolder,
  onDeleteForeverSet,
  onClearAll,
}: FlashcardsRecycleBinDialogProps) {
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);

  const sorted = React.useMemo(() => {
    // Sets recycled with their parent folder are restored/deleted via the folder entry.
    const nestedUnderRecycledFolder = new Set(
      sets.filter((set) => set.folderId && folders.some((f) => f.id === set.folderId)).map((s) => s.id)
    );
    const items: RecycledItem[] = [
      ...folders.map((item): RecycledItem => ({ kind: "folder", item })),
      ...sets
        .filter((set) => !nestedUnderRecycledFolder.has(set.id))
        .map((item): RecycledItem => ({ kind: "set", item })),
    ];
    return items.sort(
      (a, b) =>
        new Date(b.item.recycledAt ?? 0).getTime() - new Date(a.item.recycledAt ?? 0).getTime()
    );
  }, [folders, sets]);

  const nestedSetCount = React.useCallback(
    (folderId: string) => sets.filter((set) => set.folderId === folderId).length,
    [sets]
  );

  React.useEffect(() => {
    if (!open) {
      setExpandedKey(null);
      setConfirmClear(false);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <div className="min-w-0">
                <DialogTitle>Recycle bin</DialogTitle>
                <DialogDescription>
                  Folders and sets you deleted. Anything left here is permanently deleted after 30
                  days.
                </DialogDescription>
              </div>
              {sorted.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-danger hover:bg-danger-muted hover:text-danger"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all
                </Button>
              ) : null}
            </div>
          </DialogHeader>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
              <Inbox className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">The recycle bin is empty.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {sorted.map((entry) => {
                const key = `${entry.kind}:${entry.item.id}`;
                const isExpanded = expandedKey === key;
                const daysLeft = daysUntilPermanentDelete(entry.item.recycledAt);
                const title = entry.item.title;
                const meta =
                  entry.kind === "folder"
                    ? (() => {
                        const count = nestedSetCount(entry.item.id);
                        return count === 0
                          ? "Folder"
                          : `Folder · ${count} set${count === 1 ? "" : "s"}`;
                      })()
                    : `${entry.item.subject || "General"} · ${entry.item.cards.length} card${
                        entry.item.cards.length === 1 ? "" : "s"
                      }`;

                return (
                  <li
                    key={key}
                    className="overflow-hidden rounded-md border border-border/50 transition-colors duration-150 hover:bg-wash light:border-border"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedKey(isExpanded ? null : key)}
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors duration-150 hover:bg-card"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Recycled {formatCreatedDate(entry.item.recycledAt) ?? "recently"} ·{" "}
                          {daysLeft === 0 ? "deletes today" : `deletes in ${daysLeft}d`}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {entry.kind}
                      </Badge>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                          className={cn("border-t border-border px-3.5")}
                        >
                          <div className="py-3 text-sm">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {entry.kind === "folder" ? (
                                <Folder className="h-3.5 w-3.5" />
                              ) : (
                                <Layers className="h-3.5 w-3.5" />
                              )}
                              <span>{meta}</span>
                            </div>
                            {entry.kind === "set" && entry.item.description ? (
                              <p className="mt-2 text-muted">{entry.item.description}</p>
                            ) : null}
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              Created {formatCreatedDate(entry.item.createdAt)}
                            </p>

                            <div className="mt-3 flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  entry.kind === "folder"
                                    ? onRestoreFolder(entry.item)
                                    : onRestoreSet(entry.item)
                                }
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restore
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  entry.kind === "folder"
                                    ? onDeleteForeverFolder(entry.item)
                                    : onDeleteForeverSet(entry.item)
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete forever
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear recycle bin?"
        description={`Permanently delete ${sorted.length} item${sorted.length === 1 ? "" : "s"}? This can’t be undone.`}
        confirmLabel="Clear all"
        onConfirm={onClearAll}
      />
    </>
  );
}
