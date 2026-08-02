"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpen, FolderPlus, Layers, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppPage } from "@/components/layout/app-page";
import { useFlashcards } from "@/hooks/use-flashcards";
import { collectDueCards, formatRelativeDue, getNextDueAt, type DueCardRef } from "@/lib/flashcards/leitner";
import { FolderDialog } from "@/components/flashcards/folder-dialog";
import { CreateSetDialog } from "@/components/flashcards/create-set-dialog";
import {
  FlashcardsGridLibrary,
  type GridLayoutMode,
} from "@/components/flashcards/grid-library";
import { FlashcardsRecycleBinDialog } from "@/components/flashcards/recycle-bin-dialog";
import { SetViewDialog } from "@/components/flashcards/set-view-dialog";
import { SetOverviewDialog } from "@/components/flashcards/set-overview-dialog";
import { StudyView } from "@/components/flashcards/study-view";
import { TestView } from "@/components/flashcards/test-view";
import type { FlashcardFolder, FlashcardSet } from "@/types";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type LibraryMode =
  | { type: "library" }
  | { type: "study-due" }
  | { type: "test"; setId: string };

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `due-${Date.now()}`;
}

function buildDueStudySet(sessionId: string, refs: DueCardRef[], scopedSet?: FlashcardSet | null): FlashcardSet {
  const now = new Date().toISOString();
  return {
    id: sessionId,
    title: scopedSet ? scopedSet.title : "Due today",
    subject: scopedSet ? scopedSet.subject : "Review",
    folderId: scopedSet?.folderId,
    createdAt: now,
    updatedAt: now,
    cards: refs.map((r) => r.card),
  };
}

export function FlashcardsSection() {
  const prefersReducedMotion = useReducedMotion();
  const {
    folders,
    sets,
    recycledFolders,
    recycledSets,
    hydrated,
    addFolder,
    updateFolder,
    sendFolderToRecycleBin,
    restoreFolderFromRecycleBin,
    permanentlyDeleteFolder,
    touchFolder,
    addSet,
    updateSet,
    sendSetToRecycleBin,
    restoreSetFromRecycleBin,
    permanentlyDeleteSet,
    clearRecycleBin,
    touchSet,
    addCard,
    updateCard,
    deleteCard,
    recordCardResult,
    dueCount,
    completeSet,
    setsInFolder,
    toggleFolderPinned,
    toggleSetPinned,
  } = useFlashcards();

  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const [editFolderId, setEditFolderId] = React.useState<string | null>(null);
  const [createSetOpen, setCreateSetOpen] = React.useState(false);
  const [createSetFolderId, setCreateSetFolderId] = React.useState<string | undefined>(undefined);
  const [gridFolderId, setGridFolderId] = React.useState<string | null>(null);
  const [gridLayout, setGridLayout] = React.useState<GridLayoutMode>("icons");
  const [confirmDeleteFolder, setConfirmDeleteFolder] = React.useState(false);
  const [pendingRecycleFolder, setPendingRecycleFolder] = React.useState<FlashcardFolder | null>(
    null
  );
  const [recycleBinOpen, setRecycleBinOpen] = React.useState(false);
  const [editSetId, setEditSetId] = React.useState<string | null>(null);
  const [overviewSetId, setOverviewSetId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<LibraryMode>({ type: "library" });
  const [dueSession, setDueSession] = React.useState<{
    id: string;
    setId?: string;
    refs: DueCardRef[];
    practice?: boolean;
  } | null>(null);

  const gridFolder = folders.find((f) => f.id === gridFolderId) ?? null;
  const editFolder = folders.find((f) => f.id === editFolderId) ?? null;
  const editSet = sets.find((s) => s.id === editSetId) ?? null;
  const overviewSet = sets.find((s) => s.id === overviewSetId) ?? null;
  const testSet =
    mode.type === "test" ? sets.find((s) => s.id === mode.setId) ?? null : null;

  const dueStudySet = React.useMemo(() => {
    if (!dueSession) return null;
    const scoped = dueSession.setId
      ? sets.find((s) => s.id === dueSession.setId) ?? null
      : null;
    return buildDueStudySet(dueSession.id, dueSession.refs, scoped);
  }, [dueSession, sets]);

  const dueCardSetMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (!dueSession) return map;
    for (const ref of dueSession.refs) map.set(ref.card.id, ref.setId);
    return map;
  }, [dueSession]);

  const cardContextById = React.useMemo(() => {
    const map: Record<string, { setTitle: string; subject: string }> = {};
    if (!dueSession) return map;
    for (const ref of dueSession.refs) {
      map[ref.card.id] = { setTitle: ref.setTitle, subject: ref.subject };
    }
    return map;
  }, [dueSession]);

  const nextDueAt = React.useMemo(() => getNextDueAt(sets), [sets]);
  const summaryNextHint = React.useMemo(() => {
    const remaining = collectDueCards(sets).length;
    if (remaining > 0) {
      return `${remaining} still due — Study again when you're ready.`;
    }
    if (nextDueAt) {
      return `Caught up for now · next review ${formatRelativeDue(nextDueAt)}.`;
    }
    return "Caught up for now.";
  }, [sets, nextDueAt]);

  const unfiledSets = React.useMemo(
    () => sets.filter((set) => !set.folderId || !folders.some((f) => f.id === set.folderId)),
    [sets, folders]
  );
  const folderSets = gridFolder ? setsInFolder(gridFolder.id) : [];
  const recycledCount = React.useMemo(() => {
    const nestedIds = new Set(
      recycledSets
        .filter((set) => set.folderId && recycledFolders.some((f) => f.id === set.folderId))
        .map((set) => set.id)
    );
    return recycledFolders.length + recycledSets.filter((set) => !nestedIds.has(set.id)).length;
  }, [recycledFolders, recycledSets]);

  const requestRecycleFolder = React.useCallback((folder: FlashcardFolder) => {
    setPendingRecycleFolder(folder);
    setConfirmDeleteFolder(true);
  }, []);

  const confirmRecycleFolder = React.useCallback(() => {
    const target = pendingRecycleFolder ?? gridFolder;
    if (!target) return;
    sendFolderToRecycleBin(target.id);
    if (gridFolderId === target.id) setGridFolderId(null);
    setPendingRecycleFolder(null);
  }, [pendingRecycleFolder, gridFolder, gridFolderId, sendFolderToRecycleBin]);

  React.useEffect(() => {
    if (gridFolderId && !folders.some((f) => f.id === gridFolderId)) {
      setGridFolderId(null);
    }
  }, [gridFolderId, folders]);

  const openFolder = React.useCallback(
    (folder: FlashcardFolder) => {
      touchFolder(folder.id);
      setMode({ type: "library" });
      setGridFolderId(folder.id);
    },
    [touchFolder]
  );

  const openDueStudy = React.useCallback(
    (setId?: string) => {
      const refs = collectDueCards(sets, new Date(), setId);
      if (refs.length === 0) return;
      if (setId) touchSet(setId);
      setDueSession({ id: createSessionId(), setId, refs, practice: false });
      setMode({ type: "study-due" });
    },
    [sets, touchSet]
  );

  /** Explicit full-set practice — still grades / schedules; never labeled Study. */
  const openPractice = React.useCallback(
    (set: FlashcardSet) => {
      if (set.cards.length === 0) return;
      const refs: DueCardRef[] = set.cards.map((card) => ({
        setId: set.id,
        setTitle: set.title,
        subject: set.subject,
        card,
      }));
      touchSet(set.id);
      setDueSession({ id: createSessionId(), setId: set.id, refs, practice: true });
      setMode({ type: "study-due" });
    },
    [touchSet]
  );

  const openSetForStudy = React.useCallback(
    (set: FlashcardSet) => {
      openDueStudy(set.id);
    },
    [openDueStudy]
  );

  const openSetOverview = React.useCallback((set: FlashcardSet) => {
    setOverviewSetId(set.id);
  }, []);

  const startTestForSet = React.useCallback(
    (set: FlashcardSet) => {
      touchSet(set.id);
      setMode({ type: "test", setId: set.id });
    },
    [touchSet]
  );

  const backToLibrary = React.useCallback(() => {
    setDueSession(null);
    setMode({ type: "library" });
  }, []);

  React.useEffect(() => {
    if (mode.type === "test" && !testSet) {
      setMode({ type: "library" });
    }
  }, [mode.type, testSet]);

  const handleDueReview = React.useCallback(
    (cardId: string, knew: boolean) => {
      const setId = dueCardSetMap.get(cardId);
      if (!setId) return;
      recordCardResult(setId, cardId, knew);
    },
    [dueCardSetMap, recordCardResult]
  );

  if (!hydrated) {
    return (
      <AppPage title="Flashcards" feature="flashcards">
        <Skeleton className="h-[calc(100dvh-16rem)] min-h-[420px] w-full rounded-md" />
      </AppPage>
    );
  }

  const inSession = mode.type === "study-due" || mode.type === "test";

  return (
    <>
      <AppPage
        title="Flashcards"
        feature="flashcards"
        hideHeader={inSession}
        actions={
          !inSession ? (
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              {dueCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 cursor-pointer gap-1.5 px-2.5 shadow-none"
                  onClick={() => openDueStudy()}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Study
                  <span className="rounded-md bg-accent-foreground/15 px-1.5 py-0.5 font-mono text-[12px] font-medium tabular-nums">
                    {dueCount}
                  </span>
                </Button>
              ) : (
                <span
                  className="inline-flex h-8 items-center gap-1.5 px-2 text-[13px] text-muted-foreground"
                  title={
                    nextDueAt
                      ? `Caught up · next review ${formatRelativeDue(nextDueAt)}`
                      : "Caught up — nothing due"
                  }
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Caught up
                  {nextDueAt ? (
                    <span className="hidden font-mono text-[12px] tabular-nums sm:inline">
                      · {formatRelativeDue(nextDueAt)}
                    </span>
                  ) : null}
                </span>
              )}
              <button
                type="button"
                onClick={() => setRecycleBinOpen(true)}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-wash hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Recycle bin
                {recycledCount > 0 ? (
                  <span className="font-mono text-[14px] tabular-nums text-muted-foreground">
                    {recycledCount}
                  </span>
                ) : null}
              </button>
              <span className="hidden font-mono text-[14px] tabular-nums text-muted-foreground sm:inline">
                {sets.length} set{sets.length === 1 ? "" : "s"}
              </span>
            </div>
          ) : undefined
        }
      >
        <div
          className={cn(
            "relative min-h-[calc(100dvh-16rem)]",
            mode.type === "study-due" || mode.type === "test"
              ? "overflow-y-auto"
              : "flex flex-col overflow-hidden"
          )}
        >
          <AnimatePresence mode="wait">
            {mode.type === "library" && (
              <motion.div
                key="library"
                className="flex min-h-[calc(100dvh-16rem)] flex-col"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <FlashcardsGridLibrary
                    folders={folders}
                    unfiledSets={unfiledSets}
                    folder={gridFolder}
                    folderSets={folderSets}
                    layout={gridLayout}
                    onLayoutChange={setGridLayout}
                    onOpenFolder={openFolder}
                    onEditFolder={(f) => setEditFolderId(f.id)}
                    onBack={() => setGridFolderId(null)}
                    onOpenSet={openSetOverview}
                    onToggleFolderPin={toggleFolderPinned}
                    onToggleSetPin={toggleSetPinned}
                    onDeleteFolder={() => {
                      if (gridFolder) requestRecycleFolder(gridFolder);
                    }}
                    onRecycleFolder={requestRecycleFolder}
                    onRecycleSet={(set) => sendSetToRecycleBin(set.id)}
                    onMoveSet={(setId, folderId) => updateSet(setId, { folderId })}
                    setsInFolder={setsInFolder}
                  />
                  <LibraryCreateBar
                    folder={gridFolder}
                    onNewFolder={() => setCreateFolderOpen(true)}
                    onNewSet={(folderId) => {
                      setCreateSetFolderId(folderId);
                      setCreateSetOpen(true);
                    }}
                  />
                </div>
              </motion.div>
            )}

            {mode.type === "study-due" && dueStudySet && (
              <motion.div
                key={`study-due-${dueStudySet.id}`}
                className="min-h-[calc(100dvh-14rem)]"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <StudyView
                  set={dueStudySet}
                  title={
                    dueSession?.practice
                      ? `Practice · ${dueStudySet.title}`
                      : dueSession?.setId
                        ? dueStudySet.title
                        : "Due today"
                  }
                  subtitle={
                    dueSession?.practice
                      ? `${dueStudySet.subject} · grades still schedule reviews`
                      : dueSession?.setId
                        ? `${dueStudySet.subject} · ${dueSession.refs.length} due`
                        : `${dueSession?.refs.length ?? 0} card${
                            (dueSession?.refs.length ?? 0) === 1 ? "" : "s"
                          } due`
                  }
                  reviewMode
                  cardContextById={cardContextById}
                  summaryNextHint={summaryNextHint}
                  onBack={backToLibrary}
                  onReview={handleDueReview}
                  onEdit={
                    dueSession?.setId
                      ? () => setEditSetId(dueSession.setId!)
                      : undefined
                  }
                />
              </motion.div>
            )}

            {mode.type === "test" && testSet && (
              <motion.div
                key={`test-${testSet.id}`}
                className="min-h-[calc(100dvh-14rem)]"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <TestView
                  set={testSet}
                  onBack={backToLibrary}
                  onRecordResult={(cardId, correct) =>
                    recordCardResult(testSet.id, cardId, correct)
                  }
                  onComplete={(result) => completeSet(testSet.id, result)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AppPage>

      <FolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={(input) => addFolder(input)}
      />

      <FolderDialog
        open={editFolderId !== null}
        folder={editFolder}
        onOpenChange={(open) => {
          if (!open) setEditFolderId(null);
        }}
        onSave={(id, input) => {
          updateFolder(id, {
            title: input.title,
            imageDataUrl: input.imageDataUrl,
          });
        }}
      />

      <SetOverviewDialog
        set={overviewSet}
        onOpenChange={(open) => {
          if (!open) setOverviewSetId(null);
        }}
        onStudy={openSetForStudy}
        onPractice={openPractice}
        onEdit={(set) => setEditSetId(set.id)}
        onTest={startTestForSet}
      />

      <CreateSetDialog
        open={createSetOpen}
        onOpenChange={setCreateSetOpen}
        folders={folders}
        defaultFolderId={createSetFolderId}
        onCreateFolder={(title) => addFolder({ title })}
        onCreate={(input) => {
          const set = addSet(input);
          setEditSetId(set.id);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteFolder}
        onOpenChange={(open) => {
          setConfirmDeleteFolder(open);
          if (!open) setPendingRecycleFolder(null);
        }}
        title="Move folder to recycle bin?"
        description={
          (pendingRecycleFolder ?? gridFolder)
            ? `“${(pendingRecycleFolder ?? gridFolder)!.title}” and the sets inside it will move to the recycle bin. You can restore them within 30 days.`
            : "This folder and its sets will move to the recycle bin."
        }
        confirmLabel="Move to recycle bin"
        onConfirm={confirmRecycleFolder}
      />

      <FlashcardsRecycleBinDialog
        open={recycleBinOpen}
        onOpenChange={setRecycleBinOpen}
        folders={recycledFolders}
        sets={recycledSets}
        onRestoreFolder={(folder) => restoreFolderFromRecycleBin(folder.id)}
        onRestoreSet={(set) => restoreSetFromRecycleBin(set.id)}
        onDeleteForeverFolder={(folder) => permanentlyDeleteFolder(folder.id)}
        onDeleteForeverSet={(set) => permanentlyDeleteSet(set.id)}
        onClearAll={clearRecycleBin}
      />

      <SetViewDialog
        set={editSet}
        onOpenChange={(open) => {
          if (!open) setEditSetId(null);
        }}
        onAddCard={addCard}
        onUpdateCard={updateCard}
        onDeleteCard={deleteCard}
        onUpdateSet={(id, patch) => updateSet(id, patch)}
        onDeleteSet={sendSetToRecycleBin}
      />
    </>
  );
}

function LibraryCreateBar({
  folder,
  onNewFolder,
  onNewSet,
}: {
  folder: FlashcardFolder | null;
  onNewFolder: () => void;
  onNewSet: (folderId?: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/40 px-0 py-3 light:border-border">
      <p className="min-w-0 truncate text-[14px] text-muted-foreground">
        {folder ? `Inside ${folder.title}` : "Folders and unfiled sets"}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="h-8 shrink-0 cursor-pointer gap-1.5 rounded-md px-3 shadow-none"
            aria-label={
              folder ? `Create in ${folder.title}` : "Create folder or flashcard set"
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="min-w-[11.5rem]">
          <DropdownMenuItem onSelect={onNewFolder}>
            <FolderPlus className="h-3.5 w-3.5" />
            New folder
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onNewSet(folder?.id)}>
            <Layers className="h-3.5 w-3.5" />
            {folder ? `New set in ${folder.title}` : "New flashcard set"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
