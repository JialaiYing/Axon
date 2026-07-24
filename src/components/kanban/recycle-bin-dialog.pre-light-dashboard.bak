"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, RotateCcw, Inbox } from "lucide-react";
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
import {
  formatCreatedDate,
  daysUntilPermanentDelete,
  priorityBadgeVariant,
} from "@/lib/kanban-utils";
import type { Objective } from "@/types";

interface RecycleBinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: Objective[];
  onRestore: (objective: Objective) => void;
  onDeleteForever: (objective: Objective) => void;
  onClearAll: () => void;
}

export function RecycleBinDialog({
  open,
  onOpenChange,
  objectives,
  onRestore,
  onDeleteForever,
  onClearAll,
}: RecycleBinDialogProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);

  const sorted = React.useMemo(
    () =>
      [...objectives].sort(
        (a, b) => new Date(b.recycledAt ?? 0).getTime() - new Date(a.recycledAt ?? 0).getTime()
      ),
    [objectives]
  );

  React.useEffect(() => {
    if (!open) {
      setExpandedId(null);
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
                  Finished objectives you sent here, or that aged out automatically. Anything left
                  here is permanently deleted after 30 days.
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
              {sorted.map((objective) => {
                const isExpanded = expandedId === objective.id;
                const daysLeft = daysUntilPermanentDelete(objective.recycledAt);
                return (
                  <li
                    key={objective.id}
                    className="overflow-hidden rounded-md border border-border/50 transition-colors duration-150 hover:bg-foreground/[0.03] light:border-border light:hover:bg-black/[0.03]"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : objective.id)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {objective.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Recycled {formatCreatedDate(objective.recycledAt) ?? "recently"} ·{" "}
                          {daysLeft === 0 ? "deletes today" : `deletes in ${daysLeft}d`}
                        </p>
                      </div>
                      <Badge
                        variant={priorityBadgeVariant(objective.priority)}
                        className="shrink-0 capitalize"
                      >
                        {objective.priority}
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
                            {objective.description && (
                              <p className="text-muted">{objective.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                              <Badge variant="outline">{objective.subject}</Badge>
                              {objective.labels.map((label) => (
                                <Badge key={label} variant="default">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              Created {formatCreatedDate(objective.createdAt)}
                              {objective.completedAt &&
                                ` · Finished ${formatCreatedDate(objective.completedAt)}`}
                            </p>
                            {objective.notes && (
                              <p className="mt-2 rounded-md bg-card p-2 text-xs text-muted">
                                {objective.notes}
                              </p>
                            )}

                            <div className="mt-3 flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRestore(objective)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restore
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onDeleteForever(objective)}
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
