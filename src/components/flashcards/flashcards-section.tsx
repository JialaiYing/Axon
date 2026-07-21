"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FolderPlus,
  Layers,
  Pin,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFlashcards } from "@/hooks/use-flashcards";
import { CreateFolderDialog } from "@/components/flashcards/create-folder-dialog";
import { CreateSetDialog } from "@/components/flashcards/create-set-dialog";
import {
  FlashcardsGridLibrary,
  type GridLayoutMode,
} from "@/components/flashcards/grid-library";
import { FlashcardsRecycleBinDialog } from "@/components/flashcards/recycle-bin-dialog";
import { SetViewDialog } from "@/components/flashcards/set-view-dialog";
import { StudyView } from "@/components/flashcards/study-view";
import { TestView } from "@/components/flashcards/test-view";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import type { FlashcardFolder, FlashcardSet } from "@/types";
import { cn } from "@/lib/utils";

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

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** How long the cinematic loading state shows between dome and study view. */
const STUDY_LOAD_MS = 700;

type LibraryView = "grid" | "dome";

type LibraryMode =
  | { type: "library"; view: LibraryView }
  | { type: "loading"; setId: string }
  | { type: "study"; setId: string }
  | { type: "test"; setId: string };

function HomePanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("glass-panel glass-panel-hover rounded-2xl p-4", className)}>{children}</div>
  );
}

function StudyLoader() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="relative h-12 w-12">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-foreground/10"
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
        className="text-xs uppercase tracking-[0.2em] text-foreground/50"
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
    lastStudiedSet,
    completedSets,
    totalCards,
    toggleFolderInDome,
    toggleFolderPinned,
    toggleSetPinned,
    pinned,
  } = useFlashcards();

  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
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
  const [mode, setMode] = React.useState<LibraryMode>({ type: "library", view: "grid" });
  const [libraryView, setLibraryView] = React.useState<LibraryView>("grid");
  const loadTimerRef = React.useRef<number | null>(null);

  // Resolve live objects from ids so views always show fresh data.
  const gridFolder = folders.find((f) => f.id === gridFolderId) ?? null;
  const editSet = sets.find((s) => s.id === editSetId) ?? null;
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
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-[calc(100dvh-13rem)] min-h-[480px] rounded-2xl lg:col-span-3" />
      </div>
    );
  }

  return (
    <>
      <FeatureIntro feature="flashcards" />
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-4"
      >
        {/* ── Home column (1/4) ─────────────────────────────────────── */}
        <div className="flex max-h-[calc(100dvh-13rem)] min-h-[480px] flex-col gap-4 overflow-y-auto pr-0.5">
          <h2 className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/50">
            Home
          </h2>
          {/* Jump right back in */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Jump right back in
              </h2>
            </div>
            {lastStudiedSet ? (
              <button
                type="button"
                onClick={() => openSetForStudy(lastStudiedSet)}
                className="w-full cursor-pointer rounded-xl border border-foreground/8 bg-foreground/[0.04] p-3.5 text-left transition-all duration-200 hover:border-foreground/16 hover:bg-foreground/[0.07]"
              >
                <p className="truncate text-sm font-medium text-foreground">{lastStudiedSet.title}</p>
                <p className="mt-1 text-xs text-foreground/45">
                  {lastStudiedSet.subject} · {lastStudiedSet.cards.length} card
                  {lastStudiedSet.cards.length === 1 ? "" : "s"}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-accent">
                  Continue <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            ) : (
              <p className="rounded-xl border border-dashed border-foreground/10 p-3.5 text-xs leading-relaxed text-foreground/45">
                Open a set and it will show up here for quick access.
              </p>
            )}
          </HomePanel>

          {/* Create */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Create
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full cursor-pointer justify-start"
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlus className="h-3.5 w-3.5" /> New folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full cursor-pointer justify-start"
                onClick={() => {
                  setCreateSetFolderId(undefined);
                  setCreateSetOpen(true);
                }}
              >
                <Layers className="h-3.5 w-3.5" /> New flashcard set
              </Button>
            </div>
          </HomePanel>

          {/* Pinned */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Pin className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Pinned
              </h2>
            </div>
            {pinned.length === 0 ? (
              <p className="rounded-xl border border-dashed border-foreground/10 p-3.5 text-xs leading-relaxed text-foreground/45">
                Pin folders or sets in the library for quick access.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {pinned.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (entry.kind === "folder") {
                          const folder = folders.find((f) => f.id === entry.id);
                          if (folder) openFolder(folder);
                        } else {
                          const set = sets.find((s) => s.id === entry.id);
                          if (set) openSetForStudy(set);
                        }
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-foreground/[0.06]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {entry.kind === "folder" && entry.color && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: entry.color }}
                          />
                        )}
                        <span className="truncate text-xs font-medium text-foreground/80">
                          {entry.title}
                        </span>
                      </span>
                      <Badge variant={entry.kind === "folder" ? "secondary" : "accent"}>
                        {entry.kind}
                      </Badge>
                    </button>
                    <button
                      type="button"
                      aria-label={`Unpin ${entry.title}`}
                      onClick={() =>
                        entry.kind === "folder"
                          ? toggleFolderPinned(entry.id)
                          : toggleSetPinned(entry.id)
                      }
                      className="cursor-pointer rounded-md p-1.5 text-accent opacity-70 transition-opacity hover:opacity-100"
                    >
                      <Pin className="h-3 w-3 fill-current" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </HomePanel>

          {/* Completed */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Completed
              </h2>
            </div>
            {completedSets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-foreground/10 p-3.5 text-xs leading-relaxed text-foreground/45">
                Finish studying every card in a set, or finish a test, and it&apos;ll show up here.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {completedSets.map((set) => (
                  <li key={set.id}>
                    <button
                      type="button"
                      onClick={() => openSetForStudy(set)}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-foreground/[0.06]"
                    >
                      <span className="min-w-0 truncate text-xs font-medium text-foreground/80">
                        {set.title}
                      </span>
                      {set.lastTestResult ? (
                        <Badge
                          variant={
                            set.lastTestResult.correct === set.lastTestResult.total
                              ? "success"
                              : "accent"
                          }
                        >
                          {set.lastTestResult.correct}/{set.lastTestResult.total}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Studied</Badge>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </HomePanel>

          {/* Library stats */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                At a glance
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-2">
              {[
                { label: "Folders", value: folders.length },
                { label: "Sets", value: sets.length },
                { label: "Cards", value: totalCards },
                { label: "Mastery", value: `${avgMastery}%` },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-foreground/8 bg-foreground/[0.04] p-2.5 text-center"
                >
                  <p className="text-sm font-semibold tabular-nums text-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-foreground/45">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </HomePanel>
        </div>

        {/* ── Library (3/4): grid (default) ↔ dome ↔ study ──────────── */}
        <div
          className={cn(
            "relative h-[calc(100dvh-13rem)] min-h-[480px] rounded-2xl border border-foreground/8 bg-background/40 lg:col-span-3",
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
                <div className="flex items-center justify-between gap-2 border-b border-foreground/8 bg-foreground/[0.02] px-4 py-2.5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/50">
                    Library
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 cursor-pointer gap-1.5 px-2.5 text-[11px]"
                      onClick={() => setRecycleBinOpen(true)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Recycle bin
                      {recycledCount > 0 ? (
                        <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {recycledCount}
                        </span>
                      ) : null}
                    </Button>
                    <div className="inline-flex items-center gap-0.5 rounded-lg border border-foreground/10 bg-foreground/[0.03] p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLibraryView("grid");
                          setMode({ type: "library", view: "grid" });
                        }}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors",
                          mode.view === "grid"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/50 hover:text-foreground"
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
                          "rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors",
                          mode.view === "dome"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/50 hover:text-foreground"
                        )}
                      >
                        Visual gallery
                      </button>
                    </div>
                    <span className="text-[10px] tabular-nums text-foreground/35">
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
                      onBack={() => setGridFolderId(null)}
                      onOpenSet={openSetForStudy}
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
                        onSetClick={openSetForStudy}
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
      </motion.div>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={(input) => addFolder(input)}
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
    <div className="flex items-center justify-between gap-3 border-t border-foreground/8 bg-foreground/[0.02] px-4 py-2.5">
      <p className="min-w-0 truncate text-[11px] uppercase tracking-[0.2em] text-foreground/40">
        {hint ??
          (folder
            ? `Inside ${folder.title}`
            : "Folders and unfiled sets")}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="h-8 shrink-0 cursor-pointer gap-1.5 rounded-full px-3"
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
