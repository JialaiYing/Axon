"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FolderPlus,
  Gauge,
  History,
  Layers,
  Plus,
  RotateCcw,
} from "lucide-react";
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
import { FolderCoverTile } from "@/components/flashcards/folder-cover-tile";
import { StudyView } from "@/components/flashcards/study-view";
import { TestView } from "@/components/flashcards/test-view";
import type { FlashcardFolder, FlashcardSet } from "@/types";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/time";

/**
 * The dome view pulls in Three.js/OGL + gesture libs, but the default view
 * is the plain grid — defer that whole chunk until someone actually opens
 * "Visual gallery" instead of shipping it on every Flashcards page load.
 */
const DomeGallery = dynamic(() => import("@/components/flashcards/dome-gallery"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  ),
});

/** How long the cinematic loading state shows between dome and study view. */
const STUDY_LOAD_MS = 700;

type LibraryView = "grid" | "dome";

type LibraryMode =
  | { type: "library"; view: LibraryView }
  | { type: "loading"; setId: string }
  | { type: "study"; setId: string }
  | { type: "test"; setId: string };

function HomeSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="px-1 py-3.5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function StudyLoader() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="relative h-12 w-12">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-border"
          aria-hidden
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
        className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
      >
        Preparing your set
      </motion.p>
    </div>
  );
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
    deleteCard,
    recordCardResult,
    completeSet,
    setsInFolder,
    recents,
    totalCards,
    toggleFolderInDome,
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
  const [mode, setMode] = React.useState<LibraryMode>({ type: "library", view: "grid" });
  const [libraryView, setLibraryView] = React.useState<LibraryView>("grid");
  const loadTimerRef = React.useRef<number | null>(null);

  // Resolve live objects from ids so views always show fresh data.
  const gridFolder = folders.find((f) => f.id === gridFolderId) ?? null;
  const editFolder = folders.find((f) => f.id === editFolderId) ?? null;
  const editSet = sets.find((s) => s.id === editSetId) ?? null;
  const overviewSet = sets.find((s) => s.id === overviewSetId) ?? null;
  const studySet =
    mode.type === "study" || mode.type === "loading" || mode.type === "test"
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
    return () => {
      if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
    };
  }, []);

  // If the open folder was deleted, return to the grid root.
  React.useEffect(() => {
    if (gridFolderId && !folders.some((f) => f.id === gridFolderId)) {
      setGridFolderId(null);
    }
  }, [gridFolderId, folders]);

  const openFolder = React.useCallback(
    (folder: FlashcardFolder) => {
      touchFolder(folder.id);
      setLibraryView("grid");
      setMode({ type: "library", view: "grid" });
      setGridFolderId(folder.id);
    },
    [touchFolder]
  );

  /** Enter study view — skip the cinematic loader when opening from the grid. */
  const openSetForStudy = React.useCallback(
    (set: FlashcardSet) => {
      touchSet(set.id);
      if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
      if (libraryView === "dome" && !prefersReducedMotion) {
        setMode({ type: "loading", setId: set.id });
        loadTimerRef.current = window.setTimeout(
          () => setMode({ type: "study", setId: set.id }),
          STUDY_LOAD_MS
        );
      } else {
        setMode({ type: "study", setId: set.id });
      }
    },
    [libraryView, prefersReducedMotion, touchSet]
  );

  /** Library / grid opens overview first; Home Recent opens the same. */
  const openSetOverview = React.useCallback((set: FlashcardSet) => {
    setOverviewSetId(set.id);
  }, []);

  const startTestForSet = React.useCallback(
    (set: FlashcardSet) => {
      touchSet(set.id);
      if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
      setMode({ type: "test", setId: set.id });
    },
    [touchSet]
  );

  const backToLibrary = React.useCallback(() => {
    if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
    setMode({ type: "library", view: libraryView });
  }, [libraryView]);

  // If the studied set gets deleted (via the edit dialog), fall back to the library.
  React.useEffect(() => {
    if ((mode.type === "study" || mode.type === "loading" || mode.type === "test") && !studySet) {
      backToLibrary();
    }
  }, [mode.type, studySet, backToLibrary]);

  const backToStudy = React.useCallback((setId: string) => {
    setMode({ type: "study", setId });
  }, []);

  const avgMastery = React.useMemo(() => {
    const allCards = sets.flatMap((s) => s.cards);
    if (allCards.length === 0) return 0;
    return Math.round(allCards.reduce((sum, c) => sum + c.masteryPercent, 0) / allCards.length);
  }, [sets]);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="space-y-6 px-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-[calc(100dvh-16rem)] min-h-[480px] rounded-md lg:col-span-3" />
      </div>
    );
  }

  const glanceStats = [
    { label: "Folders", value: folders.length },
    { label: "Sets", value: sets.length },
    { label: "Cards", value: totalCards },
    { label: "Mastery", value: `${avgMastery}%` },
  ];

  return (
    <>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : DURATION.section, ease: EASE }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* ── Home column (1/4) — flat, no scroll; sections divided by rules ─ */}
        <div className="flex flex-col border-r border-transparent pr-1 lg:self-start lg:border-border/40 light:lg:border-border lg:pr-4">
          <h2 className="px-1 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground">
            Home
          </h2>

          <div className="divide-y divide-border light:divide-border">
          <HomeSection title="At a glance" icon={Gauge}>
            <ul className="divide-y divide-border/50 light:divide-border">
              {glanceStats.map((stat) => (
                <li
                  key={stat.label}
                  className="flex items-center justify-between gap-3 px-1 py-1.5"
                >
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                </li>
              ))}
            </ul>
          </HomeSection>

          <HomeSection title="Recent" icon={History}>
            {recents.length === 0 ? (
              <p className="px-1 text-xs leading-relaxed text-muted-foreground">
                Open a folder or set and it will show up here.
              </p>
            ) : (
              <ul className="divide-y divide-border/50 light:divide-border">
                {recents.slice(0, 4).map((entry) => {
                  const folder =
                    entry.kind === "folder"
                      ? folders.find((f) => f.id === entry.id)
                      : undefined;
                  return (
                    <li key={`${entry.kind}-${entry.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (entry.kind === "folder") {
                            if (folder) openFolder(folder);
                          } else {
                            const set = sets.find((s) => s.id === entry.id);
                            if (set) openSetOverview(set);
                          }
                        }}
                        className="group flex w-full cursor-pointer items-center gap-2.5 px-1 py-1.5 text-left transition-colors duration-150 hover:bg-wash"
                      >
                        {entry.kind === "folder" && folder ? (
                          <FolderCoverTile
                            title={folder.title}
                            imageSrc={folder.imageDataUrl}
                            size="sm"
                          />
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
                            <Layers className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-foreground">
                            {entry.title}
                          </span>
                          <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-muted-foreground">
                            {formatRelativeTime(entry.openedAt)}
                          </span>
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </HomeSection>

          <HomeSection title="Create" icon={Plus}>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setCreateFolderOpen(true)}
                className="flex w-full cursor-pointer items-center gap-2.5 px-1 py-1.5 text-left text-xs font-medium text-foreground transition-colors duration-150 hover:bg-wash hover:text-foreground"
              >
                <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" />
                New folder
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateSetFolderId(undefined);
                  setCreateSetOpen(true);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-1 py-1.5 text-left text-xs font-medium text-foreground transition-colors duration-150 hover:bg-wash hover:text-foreground"
              >
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                New flashcard set
              </button>
            </div>
          </HomeSection>
          </div>
        </div>

        {/* ── Library (3/4): grid (default) ↔ dome ↔ study ──────────── */}
        <div
          className={cn(
            "relative h-[calc(100dvh-16rem)] min-h-[420px] rounded-md border border-border/50 bg-transparent shadow-none lg:col-span-3 light:border-border light:bg-card",
            mode.type === "study" ? "overflow-y-auto p-5 md:p-6" : "overflow-hidden"
          )}
        >
          <AnimatePresence mode="wait">
            {mode.type === "library" && (
              <motion.div
                key={`library-${mode.view}`}
                className="flex h-full flex-col"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2 light:border-border">
                  <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Library
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 cursor-pointer gap-1.5 px-2 text-[12px] text-muted-foreground hover:text-foreground"
                      onClick={() => setRecycleBinOpen(true)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Recycle bin
                      {recycledCount > 0 ? (
                        <span className="rounded-md bg-wash px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                          {recycledCount}
                        </span>
                      ) : null}
                    </Button>
                    <div className="inline-flex items-center gap-0.5 rounded-md border border-border/60 p-0.5 light:border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setLibraryView("grid");
                          setMode({ type: "library", view: "grid" });
                        }}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
                          mode.view === "grid"
                            ? "bg-wash-strong text-foreground"
                            : "text-muted-foreground hover:bg-wash hover:text-foreground"
                        )}
                      >
                        Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLibraryView("dome");
                          setMode({ type: "library", view: "dome" });
                        }}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors duration-150",
                          mode.view === "dome"
                            ? "bg-wash-strong text-foreground"
                            : "text-muted-foreground hover:bg-wash hover:text-foreground"
                        )}
                      >
                        Visual gallery
                      </button>
                    </div>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {sets.length} set{sets.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {mode.view === "grid" ? (
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
                      onShowInDome={toggleFolderInDome}
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
                ) : (
                  <>
                    <div className="relative min-h-0 flex-1">
                      <DomeGallery
                        sets={sets}
                        folders={folders}
                        onSetClick={openSetOverview}
                        onCreateSet={(folderId) => {
                          setCreateSetFolderId(folderId);
                          setCreateSetOpen(true);
                        }}
                        onMoveSet={(setId, folderId) => updateSet(setId, { folderId })}
                        onHideFolder={(folderId) => {
                          // Only hide — never re-show from the dome label (hidden folders leave the gallery).
                          const folder = folders.find((f) => f.id === folderId);
                          if (folder && folder.showInDome !== false) toggleFolderInDome(folderId);
                        }}
                        dragDampening={2}
                        idleSpinDelayMs={10000}
                      />
                    </div>
                    <LibraryCreateBar
                      folder={gridFolder}
                      hint="Drag to explore · Hold a set to move it · Scroll a column to browse"
                      onNewFolder={() => setCreateFolderOpen(true)}
                      onNewSet={(folderId) => {
                        setCreateSetFolderId(folderId);
                        setCreateSetOpen(true);
                      }}
                    />
                  </>
                )}
              </motion.div>
            )}

            {mode.type === "loading" && (
              <motion.div
                key="loading"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                <StudyLoader />
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
          // Creating a set opens it for editing (adding cards), not studying —
          // so it shouldn't become the dashboard's "Jump back in" target yet.
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
  hint,
  onNewFolder,
  onNewSet,
}: {
  /** When set, "New set" is created inside this folder. */
  folder: FlashcardFolder | null;
  hint?: string;
  onNewFolder: () => void;
  onNewSet: (folderId?: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/50 px-4 py-2 light:border-border">
      <p className="min-w-0 truncate text-[11px] text-muted-foreground">
        {hint ??
          (folder
            ? `Inside ${folder.title}`
            : "Folders and unfiled sets")}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="h-8 shrink-0 cursor-pointer gap-1.5 rounded-md px-3 shadow-none"
            aria-label={
              folder
                ? `Create in ${folder.title}`
                : "Create folder or flashcard set"
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
