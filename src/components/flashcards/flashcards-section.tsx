"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FolderPlus, Layers, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFlashcards } from "@/hooks/use-flashcards";
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
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type LibraryMode =
  | { type: "library" }
  | { type: "study"; setId: string }
  | { type: "test"; setId: string };

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
    deleteCard,
    recordCardResult,
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

  const gridFolder = folders.find((f) => f.id === gridFolderId) ?? null;
  const editFolder = folders.find((f) => f.id === editFolderId) ?? null;
  const editSet = sets.find((s) => s.id === editSetId) ?? null;
  const overviewSet = sets.find((s) => s.id === overviewSetId) ?? null;
  const studySet =
    mode.type === "study" || mode.type === "test"
      ? sets.find((s) => s.id === mode.setId) ?? null
      : null;

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

  const openSetForStudy = React.useCallback(
    (set: FlashcardSet) => {
      touchSet(set.id);
      setMode({ type: "study", setId: set.id });
    },
    [touchSet]
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
    setMode({ type: "library" });
  }, []);

  React.useEffect(() => {
    if ((mode.type === "study" || mode.type === "test") && !studySet) {
      backToLibrary();
    }
  }, [mode.type, studySet, backToLibrary]);

  const backToStudy = React.useCallback((setId: string) => {
    setMode({ type: "study", setId });
  }, []);

  if (!hydrated) {
    return <Skeleton className="h-[calc(100dvh-16rem)] min-h-[480px] w-full rounded-md" />;
  }

  return (
    <>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : DURATION.section, ease: EASE }}
      >
        <div
          className={cn(
            "relative h-[calc(100dvh-16rem)] min-h-[420px] rounded-md border border-border/50 bg-transparent shadow-none light:border-border light:bg-card",
            mode.type === "study" ? "overflow-y-auto p-5 md:p-6" : "overflow-hidden"
          )}
        >
          <AnimatePresence mode="wait">
            {mode.type === "library" && (
              <motion.div
                key="library"
                className="flex h-full flex-col"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-3 light:border-border">
                  <h2 className="text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">
                    Library
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 cursor-pointer gap-1.5 px-2.5 text-[14px] text-muted-foreground hover:text-foreground"
                      onClick={() => setRecycleBinOpen(true)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Recycle bin
                      {recycledCount > 0 ? (
                        <span className="rounded-md bg-wash px-1.5 py-0.5 font-mono text-[14px] font-medium text-muted-foreground">
                          {recycledCount}
                        </span>
                      ) : null}
                    </Button>
                    <span className="font-mono text-[14px] tabular-nums text-muted-foreground">
                      {sets.length} set{sets.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

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

            {mode.type === "study" && studySet && (
              <motion.div
                key={`study-${studySet.id}`}
                className="h-full"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <StudyView
                  set={studySet}
                  onBack={backToLibrary}
                  onEdit={() => setEditSetId(studySet.id)}
                  onStartTest={() => setMode({ type: "test", setId: studySet.id })}
                  onCompletePass={() => completeSet(studySet.id)}
                />
              </motion.div>
            )}

            {mode.type === "test" && studySet && (
              <motion.div
                key={`test-${studySet.id}`}
                className="h-full"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <TestView
                  set={studySet}
                  onBack={() => backToStudy(studySet.id)}
                  onRecordResult={(cardId, correct) => recordCardResult(studySet.id, cardId, correct)}
                  onComplete={(result) => completeSet(studySet.id, result)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

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
        onDeleteCard={deleteCard}
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
    <div className="flex items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 light:border-border">
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
